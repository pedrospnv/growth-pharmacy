import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar-senha")({
  component: Recuperar,
});

function Recuperar() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 grid place-items-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-3xl font-extrabold">Recuperar senha</h1>
          {sent ? (
            <p className="text-sm text-muted-foreground mt-4">
              Enviamos um link de redefinição para <strong>{email}</strong>. Verifique sua caixa de entrada.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4 mt-6">
              <div><Label>E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">{loading ? "Enviando..." : "Enviar link"}</Button>
            </form>
          )}
          <p className="mt-6 text-sm text-center text-muted-foreground">
            <Link to="/login" className="text-primary font-semibold hover:underline">Voltar para login</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
