ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS motivo_devolucao text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS devolucao_solicitada_em timestamptz;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS entregue_em timestamptz;

-- Permite que o próprio cliente atualize o status do seu pedido para entregue/devolucao
DROP POLICY IF EXISTS pedidos_own_update ON public.pedidos;
CREATE POLICY pedidos_own_update ON public.pedidos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
