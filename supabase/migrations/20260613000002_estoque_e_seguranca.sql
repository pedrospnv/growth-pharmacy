-- Desconta estoque ao inserir um pedido
CREATE OR REPLACE FUNCTION public.descontar_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.itens)
  LOOP
    UPDATE public.produtos
    SET estoque = estoque - (item->>'quantidade')::int
    WHERE id = (item->>'id')::uuid
      AND estoque >= (item->>'quantidade')::int;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %', item->>'nome';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_pedido_criado
  AFTER INSERT ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.descontar_estoque();
