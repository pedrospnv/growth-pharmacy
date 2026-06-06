ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS mercadopago_payment_id text;
CREATE INDEX IF NOT EXISTS pedidos_mp_payment_id_idx ON public.pedidos(mercadopago_payment_id);