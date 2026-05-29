import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/pedido/$id")({
  component: Pedido,
});

function Pedido() {
  const { id } = Route.useParams();
  const { data: p, isLoading } = useQuery({
    queryKey: ["pedido", id],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center">Carregando...</div>;
  if (!p) return <div className="min-h-screen grid place-items-center">Pedido não encontrado</div>;

  const itens = (p.itens as any[]) ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-16 max-w-2xl flex-1">
        <div className="text-center mb-10">
          <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success mb-4">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="font-display text-4xl font-extrabold">Pedido confirmado!</h1>
          <p className="text-muted-foreground mt-2">Recebemos seu pedido e ele já está em processamento.</p>
          <p className="text-xs mt-3 text-muted-foreground">Código: <span className="font-mono">{p.id.slice(0, 8).toUpperCase()}</span></p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Entrega</p>
            <p className="font-semibold mt-1">{p.nome_cliente}</p>
            <p className="text-sm text-muted-foreground">{p.endereco}</p>
            <p className="text-sm text-muted-foreground">{p.cidade}/{p.estado} · CEP {p.cep}</p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Itens</p>
            {itens.map((i: any) => (
              <div key={i.id} className="flex justify-between text-sm py-1">
                <span>{i.quantidade}× {i.nome}</span>
                <span className="font-semibold">{brl(i.preco * i.quantidade)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{brl(Number(p.subtotal))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{brl(Number(p.frete))}</span></div>
            {Number(p.desconto_pix) > 0 && <div className="flex justify-between text-success"><span>Desconto PIX</span><span>-{brl(Number(p.desconto_pix))}</span></div>}
            <div className="flex justify-between text-lg font-bold pt-2"><span>Total</span><span className="text-primary">{brl(Number(p.total))}</span></div>
            <p className="text-xs text-muted-foreground capitalize">Pagamento: {p.forma_pagamento}</p>
          </div>
        </div>

        <Button asChild size="lg" className="w-full rounded-full mt-8"><Link to="/">Continuar comprando</Link></Button>
      </div>
      <Footer />
    </div>
  );
}
