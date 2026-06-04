import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { CheckCircle2, Truck, ExternalLink } from "lucide-react";

const STATUS_INFO: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  pendente: { label: "Pendente", variant: "outline", className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  aguardando_pagamento: { label: "Aguardando pagamento", variant: "outline", className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  pago: { label: "Pago", variant: "default", className: "bg-blue-600 hover:bg-blue-600" },
  processando: { label: "Processando", variant: "default", className: "bg-blue-600 hover:bg-blue-600" },
  em_preparacao: { label: "Em preparação", variant: "default", className: "bg-indigo-600 hover:bg-indigo-600" },
  enviado: { label: "Enviado", variant: "default", className: "bg-purple-600 hover:bg-purple-600" },
  a_caminho: { label: "A caminho", variant: "default", className: "bg-purple-600 hover:bg-purple-600" },
  entregue: { label: "Entregue", variant: "default", className: "bg-success hover:bg-success" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

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
          {(() => {
            const info = STATUS_INFO[p.status] ?? { label: p.status, variant: "secondary" as const };
            return (
              <div className="mt-4 flex justify-center">
                <Badge variant={info.variant} className={`text-sm px-3 py-1 ${info.className ?? ""}`}>{info.label}</Badge>
              </div>
            );
          })()}
          {(p as any).codigo_rastreio && (
            <div className="mt-5 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-left">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Truck className="h-4 w-4" /> Código de rastreio
              </div>
              <p className="font-mono text-lg font-bold mt-1 break-all">{(p as any).codigo_rastreio}</p>
              <a
                href={`https://www.linkcorreios.com.br/?id=${encodeURIComponent((p as any).codigo_rastreio)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline font-semibold"
              >
                Rastrear nos Correios <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
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
