
-- 1. ROLES ENUM + tabela user_roles (separada por segurança)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Security definer para checar role sem recursão
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. PRODUTOS
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL,
  imagem_url TEXT,
  estoque INTEGER NOT NULL DEFAULT 0,
  desconto INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.produtos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_public_read" ON public.produtos
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "produtos_admin_insert" ON public.produtos
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "produtos_admin_update" ON public.produtos
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "produtos_admin_delete" ON public.produtos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. PEDIDOS
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome_cliente TEXT NOT NULL,
  email TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cep TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  itens JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  frete NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto_pix NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pedidos TO authenticated;
GRANT UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_own_select" ON public.pedidos
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "pedidos_own_insert" ON public.pedidos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "pedidos_admin_select" ON public.pedidos
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pedidos_admin_update" ON public.pedidos
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Trigger: criar profile + atribuir role no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  -- role padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  -- Administrators are assigned explicitly through the Supabase dashboard.
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Seed de produtos
INSERT INTO public.produtos (nome, descricao, preco, categoria, imagem_url, estoque, desconto, destaque) VALUES
('Dipirona 500mg - 20 comprimidos', 'Analgésico e antitérmico para alívio rápido de dores e febre.', 12.90, 'Medicamentos', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', 150, 15, true),
('Paracetamol 750mg - 20 comp', 'Indicado para dores leves a moderadas e redução de febre.', 14.50, 'Medicamentos', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400', 120, 0, false),
('Vitamina C 1g - 30 comp efervescentes', 'Reforço do sistema imunológico com sabor laranja.', 29.90, 'Vitaminas', 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400', 80, 20, true),
('Vitamina D3 2000 UI - 60 cápsulas', 'Suplementação diária de vitamina D para saúde óssea.', 49.90, 'Vitaminas', 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400', 60, 10, true),
('Sabonete Líquido Antibacteriano 250ml', 'Higiene profunda com proteção antibacteriana.', 18.90, 'Higiene Pessoal', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 200, 0, false),
('Escova Dental Premium', 'Cerdas macias com cabeça anatômica.', 9.90, 'Higiene Pessoal', 'https://images.unsplash.com/photo-1559591935-c6c92c6f1a06?w=400', 300, 25, false),
('Protetor Solar FPS 60 - 120ml', 'Alta proteção UVA/UVB, toque seco.', 79.90, 'Dermocosméticos', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400', 45, 30, true),
('Hidratante Facial Antissinais 50g', 'Reduz linhas finas com ácido hialurônico.', 89.90, 'Dermocosméticos', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400', 35, 15, true),
('Whey Protein Concentrado 900g', 'Proteína de alto valor biológico, sabor chocolate.', 159.90, 'Suplementos', 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400', 50, 20, true),
('Creatina Monohidratada 300g', 'Aumento de força e desempenho.', 89.90, 'Suplementos', 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400', 70, 0, false),
('Ômega 3 1000mg - 120 cápsulas', 'Óleo de peixe purificado, rico em EPA e DHA.', 69.90, 'Vitaminas', 'https://images.unsplash.com/photo-1626197031507-c17099753214?w=400', 90, 10, false),
('Álcool em Gel 70% 500ml', 'Antisséptico para mãos, secagem rápida.', 15.90, 'Higiene Pessoal', 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=400', 250, 5, false);
