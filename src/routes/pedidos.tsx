import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/pedidos")({
  head: () => ({ meta: [{ title: "Meus Pedidos — Farma Pro" }] }),
  component: PedidosPage,
});

const STATUS_VARIANT: Record<string, { label: string; cls: string }> = {
  pendente:             { label: "Pendente",             cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  aguardando_pagamento: { label: "Aguardando pagamento", cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  aguardando_pix:       { label: "Aguardando PIX",       cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  aguardando_boleto:    { label: "Aguardando boleto",    cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  pago:                 { label: "Pago",                 cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  processando:          { label: "Processando",          cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  em_preparacao:        { label: "Em preparação",        cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  enviado:              { label: "Enviado",              cls: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  a_caminho:            { label: "A caminho",            cls: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  entregue:             { label: "Entregue",             cls: "bg-green-500/15 text-green-700 border-green-500/30" },
  cancelado:            { label: "Cancelado",            cls: "bg-destructive/15 text-destructive border-destructive/30" },
  devolucao_solicitada: { label: "Devolução solicitada", cls: "bg-orange-500/15 text-orange-700 border-orange-500/30" },
  devolucao_a_caminho:  { label: "Devolução a caminho",  cls: "bg-orange-500/15 text-orange-700 border-orange-500/30" },
  devolucao_aprovada:   { label: "Devolução aprovada",   cls: "bg-green-500/15 text-green-700 border-green-500/30" },
};

function PedidosPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ["meus-pedidos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", user!.id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Historico</p>
          <h1 className="font-display text-4xl font-extrabold mt-1">Meus pedidos</h1>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            Carregando pedidos...
          </div>
        ) : !pedidos || pedidos.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">Voce ainda nao tem pedidos</p>
            <p className="text-sm text-muted-foreground mt-1">Que tal comecar agora?</p>
            <Button asChild className="mt-4 rounded-full"><Link to="/produtos">Ver produtos</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => {
              const itens = (p.itens as any[]) ?? [];
              const status = STATUS_VARIANT[p.status] ?? { label: p.status, cls: "bg-muted text-foreground border-border" };
              return (
                <Link
                  key={p.id}
                  to="/pedido/$id"
                  params={{ id: p.id }}
                  className="block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/60 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                        Pedido #{p.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(p.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`border ${status.cls}`}>{status.label}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground line-clamp-1">
                    {itens.map((i: any) => `${i.quantidade}x ${i.nome}`).join(" · ")}
                  </div>
                  <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                    <div className="text-xs text-muted-foreground">
                      <span className="capitalize">{p.forma_pagamento}</span> · {itens.length} {itens.length === 1 ? "item" : "itens"}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-display text-lg font-extrabold text-primary">{brl(Number(p.total))}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
