-- Harden customer-created orders and preserve customer return actions.
CREATE OR REPLACE FUNCTION public.prepare_customer_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item jsonb;
  product public.produtos%ROWTYPE;
  quantity integer;
  unit_price numeric(10,2);
  calculated_subtotal numeric(10,2) := 0;
  normalized_items jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Pedido deve pertencer ao usuário autenticado'; END IF;
  IF NEW.forma_pagamento NOT IN ('pix', 'cartao', 'boleto') THEN RAISE EXCEPTION 'Forma de pagamento inválida'; END IF;
  IF jsonb_typeof(NEW.itens) <> 'array' OR jsonb_array_length(NEW.itens) = 0 THEN RAISE EXCEPTION 'O pedido precisa ter itens'; END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(NEW.itens)
  LOOP
    quantity := (item->>'quantidade')::integer;
    IF quantity < 1 OR quantity > 50 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
    SELECT * INTO product FROM public.produtos WHERE id = (item->>'id')::uuid FOR UPDATE;
    IF NOT FOUND OR product.estoque < quantity THEN RAISE EXCEPTION 'Produto indisponível ou estoque insuficiente'; END IF;
    unit_price := ROUND(product.preco * (100 - COALESCE(product.desconto, 0)) / 100, 2);
    calculated_subtotal := calculated_subtotal + unit_price * quantity;
    normalized_items := normalized_items || jsonb_build_array(jsonb_build_object(
      'id', product.id, 'nome', product.nome, 'preco', unit_price,
      'imagem_url', product.imagem_url, 'quantidade', quantity
    ));
  END LOOP;

  NEW.itens := normalized_items;
  NEW.subtotal := calculated_subtotal;
  NEW.frete := 0;
  NEW.desconto_pix := CASE WHEN NEW.forma_pagamento = 'pix' THEN ROUND(calculated_subtotal * 0.10, 2) ELSE 0 END;
  NEW.total := calculated_subtotal + NEW.frete - NEW.desconto_pix;
  NEW.status := CASE WHEN NEW.forma_pagamento = 'pix' THEN 'aguardando_pix'
    WHEN NEW.forma_pagamento = 'boleto' THEN 'aguardando_boleto' ELSE 'pendente' END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_customer_order_before_insert ON public.pedidos;
CREATE TRIGGER prepare_customer_order_before_insert BEFORE INSERT ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.prepare_customer_order();

CREATE OR REPLACE FUNCTION public.guard_customer_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW.user_id IS DISTINCT FROM auth.uid()
     OR (to_jsonb(NEW) - ARRAY['status','motivo_devolucao','devolucao_solicitada_em','entregue_em'])
        IS DISTINCT FROM
        (to_jsonb(OLD) - ARRAY['status','motivo_devolucao','devolucao_solicitada_em','entregue_em']) THEN
    RAISE EXCEPTION 'Cliente não pode alterar dados do pedido';
  END IF;
  IF OLD.status = 'a_caminho' AND NEW.status = 'entregue' THEN
    NEW.entregue_em := now();
    NEW.motivo_devolucao := OLD.motivo_devolucao;
    NEW.devolucao_solicitada_em := OLD.devolucao_solicitada_em;
    RETURN NEW;
  END IF;
  IF OLD.status = 'entregue' AND NEW.status = 'devolucao_solicitada' THEN
    IF OLD.entregue_em IS NULL OR OLD.entregue_em < now() - interval '7 days' THEN RAISE EXCEPTION 'Prazo de devolução encerrado'; END IF;
    IF length(trim(COALESCE(NEW.motivo_devolucao, ''))) < 3 OR length(NEW.motivo_devolucao) > 500 THEN
      RAISE EXCEPTION 'Motivo de devolução inválido';
    END IF;
    NEW.entregue_em := OLD.entregue_em;
    NEW.devolucao_solicitada_em := now();
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Transição de status não permitida para cliente';
END;
$$;

DROP TRIGGER IF EXISTS guard_customer_order_update_before_update ON public.pedidos;
CREATE TRIGGER guard_customer_order_update_before_update BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.guard_customer_order_update();

DROP POLICY IF EXISTS pedidos_own_insert ON public.pedidos;
CREATE POLICY pedidos_own_insert ON public.pedidos FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND status IN ('pendente', 'aguardando_pix', 'aguardando_boleto'));
