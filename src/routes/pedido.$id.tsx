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
import { useAuth } from "@/lib/auth";
import { brl, maskCardNumber, maskCardExp, maskCpf, onlyDigits } from "@/lib/format";
import { toast } from "sonner";
import { CheckCircle2, Truck, ExternalLink, QrCode, CreditCard, Barcode, Copy, Loader2, Clock, RotateCcw, PackageCheck, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_INFO: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  pendente:             { label: "Aguardando pagamento",  variant: "outline",      className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  aguardando_pagamento: { label: "Aguardando pagamento",  variant: "outline",      className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  aguardando_pix:       { label: "Aguardando PIX",        variant: "outline",      className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  aguardando_boleto:    { label: "Aguardando boleto",     variant: "outline",      className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  pago:                 { label: "Pago",                  variant: "default",      className: "bg-blue-600 hover:bg-blue-600" },
  processando:          { label: "Processando",           variant: "default",      className: "bg-blue-600 hover:bg-blue-600" },
  em_preparacao:        { label: "Em preparação",         variant: "default",      className: "bg-indigo-600 hover:bg-indigo-600" },
  enviado:              { label: "Enviado",               variant: "default",      className: "bg-purple-600 hover:bg-purple-600" },
  a_caminho:            { label: "A caminho",             variant: "default",      className: "bg-purple-600 hover:bg-purple-600" },
  entregue:             { label: "Entregue",              variant: "default",      className: "bg-green-600 hover:bg-green-600" },
  cancelado:            { label: "Cancelado",             variant: "destructive" },
  devolucao_solicitada: { label: "Devolução solicitada",  variant: "outline",      className: "border-orange-500 text-orange-700" },
  devolucao_a_caminho:  { label: "Devolução a caminho",   variant: "outline",      className: "border-orange-500 text-orange-700" },
  devolucao_aprovada:   { label: "Devolução aprovada",    variant: "default",      className: "bg-green-600 hover:bg-green-600" },
};

const PENDING_STATUSES = new Set(["pendente", "aguardando_pagamento", "aguardando_pix", "aguardando_boleto"]);
const MOTIVOS = [
  "Produto com defeito",
  "Produto errado",
  "Produto incompleto",
  "Mudei de ideia",
  "Produto danificado na entrega",
  "Produto fora do prazo de validade",
  "Outro motivo",
];

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
          <ConfirmadoHeader pedido={p} onUpdated={() => refetch()} />
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
                <span>{i.quantidade}x {i.nome}</span>
                <span className="font-semibold">{brl(i.preco * i.quantidade)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{brl(Number(p.subtotal))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{brl(Number(p.frete))}</span></div>
            {Number(p.desconto_pix) > 0 && <div className="flex justify-between text-green-600"><span>Desconto PIX</span><span>-{brl(Number(p.desconto_pix))}</span></div>}
            <div className="flex justify-between text-lg font-bold pt-2"><span>Total</span><span className="text-primary">{brl(Number(p.total))}</span></div>
            <p className="text-xs text-muted-foreground capitalize">Pagamento: {p.forma_pagamento}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button asChild size="lg" variant="outline" className="w-full rounded-full">
            <Link to="/">Continuar comprando</Link>
          </Button>

          {/* Botão confirmar entrega — aparece quando status é a_caminho */}
          {p.status === "a_caminho" && (
            <BotaoConfirmarEntrega pedido={p} onUpdated={() => refetch()} />
          )}

          {/* Botão devolução — aparece após entregue, dentro de 7 dias */}
          {p.status === "entregue" && (() => {
            const diasPassados = (Date.now() - new Date(p.entregue_em ?? p.criado_em).getTime()) / (1000 * 60 * 60 * 24);
            return diasPassados <= 7;
          })() && (
            <BotaoDevolucao pedido={p} onUpdated={() => refetch()} />
          )}

          {/* Aviso se devolução já foi solicitada */}
          {["devolucao_solicitada", "devolucao_a_caminho", "devolucao_aprovada"].includes(p.status) && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 p-4 text-sm space-y-3">
              <div>
                <div className="flex items-center gap-2 font-semibold text-orange-700 dark:text-orange-400 mb-1">
                  <RotateCcw className="h-4 w-4" />
                  {STATUS_INFO[p.status]?.label}
                </div>
                {(p as any).motivo_devolucao && (
                  <p className="text-orange-600 dark:text-orange-300 text-xs">Motivo: {(p as any).motivo_devolucao}</p>
                )}
                {(p as any).devolucao_solicitada_em && (
                  <p className="text-orange-500 text-xs mt-1">
                    Solicitado em {new Date((p as any).devolucao_solicitada_em).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
              <a
                href={`https://wa.me/5512992512045?text=${encodeURIComponent(`Olá, preciso de suporte para o pedido #${p.id.slice(0, 8).toUpperCase()} — Motivo da devolução: ${(p as any).motivo_devolucao ?? "não informado"}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-full border border-orange-300 bg-white dark:bg-background px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com o suporte
              </a>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function BotaoConfirmarEntrega({ pedido, onUpdated }: { pedido: any; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirmar = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("pedidos").update({
        status: "entregue",
        entregue_em: new Date().toISOString(),
      }).eq("id", pedido.id);
      if (error) throw error;
      toast.success("Entrega confirmada!");
      setOpen(false);
      onUpdated();
    } catch (e: any) {
      toast.error(e.message || "Erro ao confirmar entrega");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="lg"
        className="w-full rounded-full gap-2 bg-green-600 hover:bg-green-700"
        onClick={() => setOpen(true)}
      >
        <PackageCheck className="h-4 w-4" />
        Confirmar que recebi o pedido
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-green-600" />
              Confirmar entrega
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você confirma que recebeu o pedido <span className="font-semibold text-foreground">#{pedido.id.slice(0, 8).toUpperCase()}</span>?
            </p>
            <p className="text-xs text-muted-foreground">
              Após confirmar, você terá <span className="font-semibold">7 dias</span> para solicitar uma devolução caso precise.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-full bg-green-600 hover:bg-green-700" disabled={loading} onClick={confirmar}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar entrega"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BotaoDevolucao({ pedido, onUpdated }: { pedido: any; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const confirmar = async () => {
    if (!motivo) { toast.error("Selecione o motivo da devolução"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("pedidos").update({
        status: "devolucao_solicitada",
        motivo_devolucao: motivo,
        devolucao_solicitada_em: new Date().toISOString(),
      }).eq("id", pedido.id);
      if (error) throw error;
      toast.success("Devolução solicitada! Aguarde a análise.");
      setOpen(false);
      onUpdated();
    } catch (e: any) {
      toast.error(e.message || "Erro ao solicitar devolução");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="lg"
        variant="outline"
        className="w-full rounded-full border-orange-300 text-orange-700 hover:bg-orange-50 gap-2"
        onClick={() => { setOpen(true); setMotivo(""); }}
      >
        <RotateCcw className="h-4 w-4" />
        Devolver produto
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Solicitar devolução
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Você tem até 7 dias após a entrega para solicitar a devolução. O reembolso cobre o valor total do pedido.
            </div>
            <div>
              <Label className="text-sm font-semibold">Qual o motivo da devolução?</Label>
              <div className="mt-2 space-y-2">
                {MOTIVOS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMotivo(m)}
                    className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition ${
                      motivo === m
                        ? "border-primary bg-primary/5 text-primary font-semibold"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                className="flex-1 rounded-full bg-orange-600 hover:bg-orange-700"
                disabled={loading || !motivo}
                onClick={confirmar}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar devolução"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmadoHeader({ pedido: p, onUpdated }: { pedido: any; onUpdated: () => void }) {
  const info = STATUS_INFO[p.status] ?? { label: p.status, variant: "secondary" as const };
  return (
    <div className="text-center mb-2">
      <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-green-500/10 text-green-600 mb-4">
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
  const [cpf, setCpf] = useState("");
  const { user } = useAuth();

  useState(() => {
    if (!user) return;
    supabase.from("profiles").select("cpf").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.cpf) setCpf(maskCpf(data.cpf));
    });
  });

  const subtotal = Number(p.subtotal);
  const frete = Number(p.frete);
  const desconto = pgto === "pix" ? subtotal * 0.1 : 0;
  const total = subtotal + frete - desconto;

  const callMP = async (payload: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Sua sessão expirou. Entre novamente para pagar.");
    const r = await fetch("/api/mercadopago/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.access_token,
      },
      body: JSON.stringify(payload),
    });
    const json = await r.json();
    if (!r.ok) throw new Error(json?.error || "Falha no pagamento");
    return json;
  };

  const pagar = async () => {
    if (onlyDigits(cpf).length !== 11) { toast.error("Informe um CPF válido para pagar"); return; }
    setLoading(true);
    try {
      const payer = { email: p.email, nome: p.nome_cliente, cpf };
      if (user) await supabase.from("profiles").update({ cpf: onlyDigits(cpf) }).eq("id", user.id);

      if (pgto === "pix") {
        const r = await callMP({ method: "pix", amount: total, payer, description: `Pedido ${p.id.slice(0, 8)}` });
        setPixData({ qr_code_base64: r.qr_code_base64, qr_code: r.qr_code });
        await supabase.from("pedidos").update({
          forma_pagamento: "pix", subtotal, frete, desconto_pix: desconto, total,
          status: r.status === "approved" ? "pago" : "aguardando_pix",
          mercadopago_payment_id: r.id ? String(r.id) : null,
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
          mercadopago_payment_id: r.id ? String(r.id) : null,
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
          mercadopago_payment_id: r.id ? String(r.id) : null,
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
        <p className="text-muted-foreground mt-2">Seu pedido está aguardando pagamento.</p>
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
            <button key={o.v}
              onClick={() => { setPgto(o.v); setPixData(null); setBoletoData(null); }}
              className={`rounded-xl border-2 p-4 text-left transition ${pgto === o.v ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}>
              <o.icon className="h-5 w-5 mb-2 text-primary" />
              <p className="font-display font-bold text-sm">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.sub}</p>
            </button>
          ))}
        </div>

        <div>
          <Label>CPF do pagador</Label>
          <Input value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" />
        </div>

        {pgto === "pix" && (
          <div className="rounded-xl border border-border p-6 text-center bg-secondary/40">
            <p className="text-sm font-bold text-green-600 mb-3">10% OFF aplicado automaticamente</p>
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
                  <p className="text-xs text-primary font-semibold mt-3 flex items-center gap-2 justify-center">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando confirmação...
                  </p>
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
                  value={cartao.parcelas} onChange={(e) => setCartao({ ...cartao, parcelas: parseInt(e.target.value, 10) })}>
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
