import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { brl, maskCardNumber, maskCardExp, onlyDigits } from "@/lib/format";
import { toast } from "sonner";
import { CheckCircle2, Truck, ExternalLink, QrCode, CreditCard, Barcode, Copy, Loader2, Clock } from "lucide-react";

const STATUS_INFO: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  pendente: { label: "Aguardando pagamento", variant: "outline", className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  aguardando_pagamento: { label: "Aguardando pagamento", variant: "outline", className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  aguardando_pix: { label: "Aguardando PIX", variant: "outline", className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  aguardando_boleto: { label: "Aguardando boleto", variant: "outline", className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  pago: { label: "Pago", variant: "default", className: "bg-blue-600 hover:bg-blue-600" },
  processando: { label: "Processando", variant: "default", className: "bg-blue-600 hover:bg-blue-600" },
  em_preparacao: { label: "Em preparação", variant: "default", className: "bg-indigo-600 hover:bg-indigo-600" },
  enviado: { label: "Enviado", variant: "default", className: "bg-purple-600 hover:bg-purple-600" },
  a_caminho: { label: "A caminho", variant: "default", className: "bg-purple-600 hover:bg-purple-600" },
  entregue: { label: "Entregue", variant: "default", className: "bg-success hover:bg-success" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const PENDING_STATUSES = new Set(["pendente", "aguardando_pagamento", "aguardando_pix", "aguardando_boleto"]);

export const Route = createFileRoute("/pedido/$id")({
  component: Pedido,
});

function Pedido() {
  const { id } = Route.useParams();
  const { data: p, isLoading, refetch } = useQuery({
    queryKey: ["pedido", id],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center">Carregando...</div>;
  if (!p) return <div className="min-h-screen grid place-items-center">Pedido não encontrado</div>;

  const isPending = PENDING_STATUSES.has(p.status);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-16 max-w-2xl flex-1">
        {isPending ? (
          <PagamentoPendente pedido={p} onUpdated={() => refetch()} />
        ) : (
          <ConfirmadoHeader pedido={p} />
        )}

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 mt-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Entrega</p>
            <p className="font-semibold mt-1">{p.nome_cliente}</p>
            <p className="text-sm text-muted-foreground">{p.endereco}</p>
            <p className="text-sm text-muted-foreground">{p.cidade}/{p.estado} · CEP {p.cep}</p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Itens</p>
            {((p.itens as any[]) ?? []).map((i: any) => (
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

        <Button asChild size="lg" variant="outline" className="w-full rounded-full mt-8"><Link to="/">Continuar comprando</Link></Button>
      </div>
      <Footer />
    </div>
  );
}

function ConfirmadoHeader({ pedido: p }: { pedido: any }) {
  const info = STATUS_INFO[p.status] ?? { label: p.status, variant: "secondary" as const };
  return (
    <div className="text-center mb-2">
      <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success mb-4">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <h1 className="font-display text-4xl font-extrabold">Pedido confirmado!</h1>
      <p className="text-muted-foreground mt-2">Recebemos seu pedido e ele já está em processamento.</p>
      <p className="text-xs mt-3 text-muted-foreground">Código: <span className="font-mono">{p.id.slice(0, 8).toUpperCase()}</span></p>
      <div className="mt-4 flex justify-center">
        <Badge variant={info.variant} className={`text-sm px-3 py-1 ${info.className ?? ""}`}>{info.label}</Badge>
      </div>
      {p.codigo_rastreio && (
        <div className="mt-5 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-left">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Truck className="h-4 w-4" /> Código de rastreio
          </div>
          <p className="font-mono text-lg font-bold mt-1 break-all">{p.codigo_rastreio}</p>
          <a
            href={`https://www.linkcorreios.com.br/?id=${encodeURIComponent(p.codigo_rastreio)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline font-semibold"
          >
            Rastrear nos Correios <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

type Pgto = "pix" | "cartao" | "boleto";

function PagamentoPendente({ pedido: p, onUpdated }: { pedido: any; onUpdated: () => void }) {
  const initial: Pgto = (["pix", "cartao", "boleto"].includes(p.forma_pagamento) ? p.forma_pagamento : "pix") as Pgto;
  const [pgto, setPgto] = useState<Pgto>(initial);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code_base64?: string; qr_code?: string } | null>(null);
  const [boletoData, setBoletoData] = useState<{ barcode?: string; boleto_url?: string } | null>(null);
  const [cartao, setCartao] = useState({ numero: "", nome: "", validade: "", cvv: "", parcelas: 1 });

  // Recalcula total considerando desconto PIX (10% sobre subtotal) caso troque de método
  const subtotal = Number(p.subtotal);
  const frete = Number(p.frete);
  const desconto = pgto === "pix" ? subtotal * 0.1 : 0;
  const total = subtotal + frete - desconto;

  const callMP = async (payload: any) => {
    const r = await fetch("/api/mercadopago/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await r.json();
    if (!r.ok) throw new Error(json?.error || "Falha no pagamento");
    return json;
  };

  const pagar = async () => {
    setLoading(true);
    try {
      const payer = { email: p.email, nome: p.nome_cliente, cpf: "" };
      if (pgto === "pix") {
        const r = await callMP({ method: "pix", amount: total, payer, description: `Pedido ${p.id.slice(0, 8)}` });
        setPixData({ qr_code_base64: r.qr_code_base64, qr_code: r.qr_code });
        await supabase.from("pedidos").update({
          forma_pagamento: "pix", subtotal, frete, desconto_pix: desconto, total,
          status: r.status === "approved" ? "pago" : "aguardando_pix",
        }).eq("id", p.id);
        toast.success("PIX gerado! Escaneie o QR Code.");
      } else if (pgto === "boleto") {
        const r = await callMP({
          method: "boleto", amount: total, payer,
          address: { cep: p.cep, rua: p.endereco, numero: "S/N", bairro: "-", cidade: p.cidade, estado: p.estado },
        });
        setBoletoData({ barcode: r.barcode, boleto_url: r.boleto_url });
        await supabase.from("pedidos").update({
          forma_pagamento: "boleto", subtotal, frete, desconto_pix: 0, total,
          status: "aguardando_boleto",
        }).eq("id", p.id);
        toast.success("Boleto gerado!");
      } else {
        const r = await callMP({
          method: "cartao", amount: total, payer,
          card: { numero: cartao.numero, nome: cartao.nome, validade: cartao.validade, cvv: cartao.cvv, parcelas: cartao.parcelas },
        });
        if (r.status !== "approved") throw new Error(`Pagamento ${r.status}: ${r.status_detail || ""}`);
        await supabase.from("pedidos").update({
          forma_pagamento: "cartao", subtotal, frete, desconto_pix: 0, total, status: "pago",
        }).eq("id", p.id);
        toast.success("Pagamento aprovado!");
        onUpdated();
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (!pixData?.qr_code) return;
    navigator.clipboard.writeText(pixData.qr_code);
    toast.success("Código PIX copiado!");
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-yellow-500/10 text-yellow-600 mb-4">
          <Clock className="h-12 w-12" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold">Conclua seu pagamento</h1>
        <p className="text-muted-foreground mt-2">Seu pedido está aguardando pagamento. Escolha uma forma abaixo para finalizar.</p>
        <p className="text-xs mt-3 text-muted-foreground">Código: <span className="font-mono">{p.id.slice(0, 8).toUpperCase()}</span></p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-display text-xl font-bold">Forma de pagamento</h2>
        <div className="grid grid-cols-3 gap-3">
          {([
            { v: "pix", icon: QrCode, label: "PIX", sub: "10% OFF" },
            { v: "cartao", icon: CreditCard, label: "Cartão", sub: "até 3x" },
            { v: "boleto", icon: Barcode, label: "Boleto", sub: "3 dias úteis" },
          ] as const).map((o) => (
            <button
              key={o.v}
              onClick={() => { setPgto(o.v); setPixData(null); setBoletoData(null); }}
              className={`rounded-xl border-2 p-4 text-left transition ${pgto === o.v ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}
            >
              <o.icon className="h-5 w-5 mb-2 text-primary" />
              <p className="font-display font-bold text-sm">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.sub}</p>
            </button>
          ))}
        </div>

        {pgto === "pix" && (
          <div className="rounded-xl border border-border p-6 text-center bg-secondary/40">
            <p className="text-sm font-bold text-success mb-3">✓ 10% OFF aplicado automaticamente</p>
            {pixData?.qr_code_base64 ? (
              <>
                <div className="inline-block bg-white p-3 rounded-xl">
                  <img alt="QR Code PIX" className="h-56 w-56" src={`data:image/png;base64,${pixData.qr_code_base64}`} />
                </div>
                <div className="mt-4 text-left">
                  <Label className="text-xs">Código copia e cola</Label>
                  <div className="flex gap-2 mt-1">
                    <Input readOnly value={pixData.qr_code || ""} className="font-mono text-xs" />
                    <Button type="button" variant="outline" size="icon" onClick={copyPix}><Copy className="h-4 w-4" /></Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Escaneie o QR Code ou cole o código no seu app bancário</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Clique em "Pagar" para gerar o QR Code PIX</p>
            )}
          </div>
        )}

        {pgto === "cartao" && (
          <div className="space-y-4">
            <div><Label>Número do cartão</Label><Input value={cartao.numero} onChange={(e) => setCartao({ ...cartao, numero: maskCardNumber(e.target.value) })} placeholder="0000 0000 0000 0000" /></div>
            <div><Label>Nome no cartão</Label><Input value={cartao.nome} onChange={(e) => setCartao({ ...cartao, nome: e.target.value.toUpperCase() })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Validade</Label><Input value={cartao.validade} onChange={(e) => setCartao({ ...cartao, validade: maskCardExp(e.target.value) })} placeholder="MM/AA" /></div>
              <div><Label>CVV</Label><Input value={cartao.cvv} onChange={(e) => setCartao({ ...cartao, cvv: onlyDigits(e.target.value).slice(0, 4) })} placeholder="000" /></div>
              <div>
                <Label>Parcelas</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={cartao.parcelas}
                  onChange={(e) => setCartao({ ...cartao, parcelas: parseInt(e.target.value, 10) })}>
                  {[1, 2, 3].map((n) => <option key={n} value={n}>{n}x de {brl(total / n)}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {pgto === "boleto" && (
          <div className="rounded-xl border border-border p-6 bg-secondary/40">
            {boletoData?.barcode ? (
              <>
                <p className="text-sm font-semibold mb-3">Código de barras</p>
                <div className="bg-white p-4 rounded-lg font-mono text-xs break-all border border-border">{boletoData.barcode}</div>
                {boletoData.boleto_url && (
                  <Button asChild variant="outline" className="mt-3 w-full rounded-full">
                    <a href={boletoData.boleto_url} target="_blank" rel="noopener noreferrer">Abrir boleto em PDF</a>
                  </Button>
                )}
                <p className="text-xs text-muted-foreground mt-3">Vencimento em 3 dias úteis</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Clique em "Pagar" para gerar o boleto</p>
            )}
          </div>
        )}

        <div className="border-t border-border pt-4 flex justify-between text-lg font-bold">
          <span>Total</span><span className="text-primary">{brl(total)}</span>
        </div>

        <Button size="lg" disabled={loading} className="w-full rounded-full" onClick={pagar}>
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</> : `Pagar · ${brl(total)}`}
        </Button>
      </div>
    </div>
  );
}
