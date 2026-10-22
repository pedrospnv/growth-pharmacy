import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verificar-email")({
  validateSearch: z.object({ email: z.string().optional() }),
  component: Verify,
});

function Verify() {
  const { email } = Route.useSearch();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 grid place-items-center px-4 py-16">
        <div className="max-w-md text-center rounded-3xl border border-border bg-card p-10 shadow-card">
          <div className="inline-grid h-16 w-16 place-items-center rounded-full bg-accent text-primary mb-5">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-extrabold">Verifique seu e-mail</h1>
          <p className="text-muted-foreground mt-3">
            Enviamos um link de confirmação{email ? <> para <strong>{email}</strong></> : ""}. Clique no link para ativar sua conta.
          </p>
          <p className="text-xs text-muted-foreground mt-4">Não recebeu? Verifique a caixa de spam.</p>
          <Button asChild className="rounded-full mt-6"><Link to="/login">Ir para o login</Link></Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
