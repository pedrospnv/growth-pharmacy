import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) { setLoading(false); toast.error(error.message); return; }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("ativo")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile && profile.ativo === false) {
        await supabase.auth.signOut();
        setLoading(false);
        toast.error("Sua conta foi suspensa. Entre em contato com o suporte.");
        return;
      }
    }
    setLoading(false);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 grid place-items-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="text-center mb-6">
            <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground mb-3">
              <Leaf className="h-6 w-6" />
            </div>
            <h1 className="font-display text-3xl font-extrabold">Entrar</h1>
            <p className="text-sm text-muted-foreground mt-1">Acesse sua conta Farma Pro</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Senha</Label><Input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">{loading ? "Entrando..." : "Entrar"}</Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
            <p><Link to="/recuperar-senha" className="text-primary font-semibold hover:underline">Esqueci minha senha</Link></p>
            <p>Não tem conta? <Link to="/cadastro" className="text-primary font-semibold hover:underline">Criar conta</Link></p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
