import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/cadastro")({
  component: Cadastro,
});

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  senha: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ nome, email, senha });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: senha,
      options: { data: { nome }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/verificar-email", search: { email } as any });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 grid place-items-center px-4 py-10 md:py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card">
          <div className="text-center mb-6">
            <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground mb-3">
              <Leaf className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-extrabold">Criar conta</h1>
            <p className="text-sm text-muted-foreground mt-1">Cuide da sua saúde com a Farma Pro</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Senha</Label><Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /><p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres</p></div>
            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">{loading ? "Criando..." : "Criar conta"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
