import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 grid place-items-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-3xl font-extrabold">Nova senha</h1>
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div><Label>Nova senha</Label><Input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">{loading ? "Atualizando..." : "Atualizar senha"}</Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
