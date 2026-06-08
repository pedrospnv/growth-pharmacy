import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { brl, maskCep, maskCardNumber, maskCardExp, maskCpf, onlyDigits, calcFretePorCep } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, CreditCard, QrCode, Barcode, Copy, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Farma Pro" }] }),
  component: Checkout,
});

type Step = 1 | 2 | 3;
type Pgto = "pix" | "cartao" | "boleto";

const FRETE_GRATIS_TESTE = true;
const STATUS_PAGO = ["pago", "em_preparacao", "a_caminho", "entregue"];

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  const [endereco, setEndereco] = useState({
    nome: "", cpf: "", cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [frete, setFrete] = useState(0);
  const [pgto, setPgto] = useState<Pgto>("pix");
  const [cartao, setCartao] = useState({ numero: "", nome: "", validade: "", cvv: "", parcelas: 1 });
  const [saving, setSaving] = useState(false);

  const [pixData, setPixData] = useState<{ qr_code_base64?: string; qr_code?: string } | null>(null);
  const [boletoData, setBoletoData] = useState<{ barcode?: string; boleto_url?: string } | null>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [mpPaymentId, setMpPaymentId] = useState<string | null>(null);
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (items.length === 0 && step !== 3 && !pixData && !boletoData) navigate({ to: "/carrinho" });
  }, [items.length, step, navigate, pixData, boletoData]);

  useEffect(() => {
    if (!user && step === 1) {
      toast.info("Faca login para finalizar a compra.");
      navigate({ to: "/login" });
    }
  }, [user, step, navigate]);

  // Preenche nome, CPF e endereco salvos no perfil
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome, cpf, cep, rua, numero, complemento, bairro, cidade, estado")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setEndereco((e) => ({
          nome: e.nome || data.nome || "",
          cpf: e.cpf || (data.cpf ? maskCpf(data.cpf) : ""),
          cep: e.cep || data.cep || "",
          rua: e.rua || data.rua || "",
          numero: e.numero || data.numero || "",
          complemento: e.complemento || data.complemento || "",
          bairro: e.bairro || data.bairro || "",
          cidade: e.cidade || data.cidade || "",
          estado: e.estado || data.estado || "",
        }));
        if (data.cep && onlyDigits(data.cep).length === 8) {
          setFrete(FRETE_GRATIS_TESTE ? 0 : calcFretePorCep(data.cep));
        }
      }
    })();
  }, [user]);

  // Polling: banco (via webhook) + fallback direto na API do MP a cada 15s
  useEffect(() => {
    if ((!pedidoId && !mpPaymentId) || pagamentoAprovado) return;

    const confirmar = () => {
      setPagamentoAprovado(true);
      if (pollingRef.current) clearInterval(pollingRef.current);
      toast.success("Pagamento aprovado!");
    };

    let tick = 0;

    pollingRef.current = setInterval(async () => {
      tick++;

      if (pedidoId) {
        const { data } = await supabase
          .from("pedidos")
          .select("status")
          .eq("id", pedidoId)
          .maybeSingle();
        if (data && STATUS_PAGO.includes(data.status)) {
          confirmar();
          return;
        }
      }

      if (mpPaymentId && tick % 3 === 0) {
        try {
          const r = await fetch(`/api/mercadopago/status?payment_id=${mpPaymentId}`);
          if (r.ok) {
            const json = await r.json();
            if (json?.status === "approved") {
              if (pedidoId) {
                await supabase.from("pedidos").update({ status: "pago" }).eq("id", pedidoId);
              }
              confirmar();
            }
          }
        } catch { /* ignora */ }
      }
    }, 5000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [pedidoId, mpPaymentId, pagamentoAprovado]);

  const buscarCep = async (cep: string) => {
    const d = onlyDigits(cep);
    if (d.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await r.json();
      if (!data.erro) {
        setEndereco((e) => ({
          ...e,
          rua: data.logradouro || e.rua,
          bairro: data.bairro || e.bairro,
          cidade: data.localidade || e.cidade,
          estado: data.uf || e.estado,
        }));
        setFrete(FRETE_GRATIS_TESTE ? 0 : calcFretePorCep(d));
      } else toast.error("CEP nao encontrado");
    } catch { toast.error("Falha ao buscar CEP"); }
    setCepLoading(false);
  };

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

  const finalizar = async () => {
    if (!user) return;
    if (!endereco.cpf || onlyDigits(endereco.cpf).length !== 11) {
      toast.error("Informe um CPF valido"); return;
    }
    setSaving(true);
    try {
      const basePayer = { email: user.email!, nome: endereco.nome, cpf: endereco.cpf };
      const baseAddress = {
        cep: endereco.cep, rua: endereco.rua, numero: endereco.numero,
        bairro: endereco.bairro, cidade: endereco.cidade, estado: endereco.estado,
      };

      let mpResult: any = null;
      let mpStatus = "pendente";

      if (pgto === "pix") {
        mpResult = await callMP({ method: "pix", amount: total, payer: basePayer, description: "Pedido Farma Pro" });
        setPixData({ qr_code_base64: mpResult.qr_code_base64, qr_code: mpResult.qr_code });
        setMpPaymentId(mpResult.id ? String(mpResult.id) : null);
        mpStatus = mpResult.status === "approved" ? "pago" : "aguardando_pix";
      } else if (pgto === "boleto") {
        mpResult = await callMP({ method: "boleto", amount: total, payer: basePayer, address: baseAddress });
        setBoletoData({ barcode: mpResult.barcode, boleto_url: mpResult.boleto_url });
        setMpPaymentId(mpResult.id ? String(mpResult.id) : null);
        mpStatus = "aguardando_boleto";
      } else {
        mpResult = await callMP({
          method: "cartao", amount: total, payer: basePayer,
          card: { numero: cartao.numero, nome: cartao.nome, validade: cartao.validade, cvv: cartao.cvv, parcelas: cartao.parcelas },
        });
        if (mpResult.status !== "approved") throw new Error(`Pagamento ${mpResult.status}: ${mpResult.status_detail || ""}`);
        mpStatus = "pago";
      }

      const { data, error } = await supabase.from("pedidos").insert({
        user_id: user.id,
        nome_cliente: endereco.nome,
        email: user.email!,
        endereco: `${endereco.rua}, ${endereco.numero}${endereco.complemento ? " - " + endereco.complemento : ""} · ${endereco.bairro}`,
        cep: endereco.cep,
        cidade: endereco.cidade,
        estado: endereco.estado,
        itens: items as any,
        subtotal, frete, desconto_pix: desconto, total,
        forma_pagamento: pgto,
        status: mpStatus,
        mercadopago_payment_id: mpResult?.id ? String(mpResult.id) : null,
      }).select("id").single();

      if (error) throw error;

      // Atualiza perfil com CPF e endereco usados
      await supabase.from("profiles").update({
        cpf: onlyDigits(endereco.cpf),
        cep: endereco.cep,
        rua: endereco.rua,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
      }).eq("id", user.id);

      if (pgto === "cartao") {
        clear();
        navigate({ to: "/pedido/$id", params: { id: data.id } });
      } else {
        clear();
        setPedidoId(data.id);
        toast.success(pgto === "pix" ? "PIX gerado! Escaneie o QR Code." : "Boleto gerado!");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro no pagamento");
    } finally {
      setSaving(false);
    }
  };

  const copyPix = () => {
    if (!pixData?.qr_code) return;
    navigator.clipboard.writeText(pixData.qr_code);
    toast.success("Codigo PIX copiado!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-10 flex-1 max-w-5xl">
        <h1 className="font-display text-4xl font-extrabold mb-2">Checkout</h1>

        <div className="flex items-center gap-2 mt-6 mb-10">
          {[{ n: 1, label: "Endereco" }, { n: 2, label: "Frete" }, { n: 3, label: "Pagamento" }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`grid h-9 w-9 place-items-center rounded-full font-bold text-sm ${step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {step > s.n ? <Check className="h-4 w-4" /> : s.n}
              </div>
              <span className={`text-sm font-semibold ${step >= s.n ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr,340px] gap-8">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">

            {step === 1 && (
              <>
                <h2 className="font-display text-xl font-bold">Endereco de entrega</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Nome completo</Label>
                    <Input value={endereco.nome} onChange={(e) => setEndereco({ ...endereco, nome: e.target.value })} />
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input value={endereco.cpf} onChange={(e) => setEndereco({ ...endereco, cpf: maskCpf(e.target.value) })} placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input value={endereco.cep} onChange={(e) => {
                      const v = maskCep(e.target.value);
                      setEndereco({ ...endereco, cep: v });
                      if (onlyDigits(v).length === 8) buscarCep(v);
                    }} placeholder="00000-000" />
                    {cepLoading && <p className="text-xs text-muted-foreground mt-1">Buscando endereco...</p>}
                  </div>
                  <div><Label>Rua</Label><Input value={endereco.rua} onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })} /></div>
                  <div><Label>Numero</Label><Input value={endereco.numero} onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })} /></div>
                  <div><Label>Complemento</Label><Input value={endereco.complemento} onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })} /></div>
                  <div><Label>Bairro</Label><Input value={endereco.bairro} onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })} /></div>
                  <div><Label>Cidade</Label><Input value={endereco.cidade} onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })} /></div>
                  <div><Label>Estado</Label><Input maxLength={2} value={endereco.estado} onChange={(e) => setEndereco({ ...endereco, estado: e.target.value.toUpperCase() })} /></div>
                </div>
                <Button
                  size="lg" className="w-full rounded-full"
                  disabled={!endereco.nome || !endereco.cpf || !endereco.cep || !endereco.rua || !endereco.numero || !endereco.cidade || !endereco.estado}
                  onClick={() => { if (FRETE_GRATIS_TESTE) setFrete(0); else if (!frete) setFrete(calcFretePorCep(endereco.cep)); setStep(2); }}
                >Continuar para frete</Button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display text-xl font-bold">Calculo de frete</h2>
                <p className="text-sm text-muted-foreground">Entrega para {endereco.cidade}/{endereco.estado}</p>
                <div className="rounded-xl border border-border p-5 flex items-center justify-between bg-secondary/40">
                  <div>
                    <p className="font-display font-bold">Entrega expressa</p>
                    <p className="text-xs text-muted-foreground">2 a 5 dias uteis</p>
                  </div>
                  <p className="font-display text-2xl font-extrabold text-primary">{brl(frete)}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(1)}>Voltar</Button>
                  <Button size="lg" className="flex-1 rounded-full" onClick={() => setStep(3)}>Ir para pagamento</Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display text-xl font-bold">Forma de pagamento</h2>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { v: "pix", icon: QrCode, label: "PIX", sub: "10% OFF" },
                    { v: "cartao", icon: CreditCard, label: "Cartao", sub: "ate 3x" },
                    { v: "boleto", icon: Barcode, label: "Boleto", sub: "3 dias uteis" },
                  ] as const).map((o) => (
                    <button key={o.v} onClick={() => setPgto(o.v)}
                      className={`rounded-xl border-2 p-4 text-left transition ${pgto === o.v ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}>
                      <o.icon className="h-5 w-5 mb-2 text-primary" />
                      <p className="font-display font-bold text-sm">{o.label}</p>
                      <p className="text-xs text-muted-foreground">{o.sub}</p>
                    </button>
                  ))}
                </div>

                {pgto === "pix" && (
                  <div className="rounded-xl border border-border p-6 text-center bg-secondary/40">
                    {pagamentoAprovado ? (
                      <div className="py-8 flex flex-col items-center gap-4">
                        <div className="h-20 w-20 grid place-items-center rounded-full bg-green-500/10">
                          <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                        <div>
                          <p className="font-display text-2xl font-extrabold">Pagamento aprovado!</p>
                          <p className="text-sm text-muted-foreground mt-1">Seu pedido foi confirmado e ja esta sendo preparado.</p>
                        </div>
                        <Button size="lg" className="rounded-full mt-2"
                          onClick={() => pedidoId ? navigate({ to: "/pedido/$id", params: { id: pedidoId } }) : navigate({ to: "/conta" })}>
                          Ver meu pedido
                        </Button>
                      </div>
                    ) : pixData?.qr_code_base64 ? (
                      <>
                        <p className="text-sm font-bold text-green-600 mb-4">10% OFF aplicado automaticamente</p>
                        <div className="inline-block bg-white p-3 rounded-xl shadow-sm">
                          <img alt="QR Code PIX" className="h-56 w-56" src={`data:image/png;base64,${pixData.qr_code_base64}`} />
                        </div>
                        <div className="mt-4 text-left">
                          <Label className="text-xs">Codigo copia e cola</Label>
                          <div className="flex gap-2 mt-1">
                            <Input readOnly value={pixData.qr_code || ""} className="font-mono text-xs" />
                            <Button type="button" variant="outline" size="icon" onClick={copyPix}><Copy className="h-4 w-4" /></Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Escaneie o QR Code ou cole o codigo no seu app bancario</p>
                          <p className="text-xs text-primary font-semibold mt-3 flex items-center gap-2 justify-center">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando confirmacao do pagamento...
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-green-600 mb-3">10% OFF aplicado automaticamente</p>
                        <p className="text-sm text-muted-foreground">Clique em "Confirmar pedido" para gerar o QR Code PIX</p>
                      </>
                    )}
                  </div>
                )}

                {pgto === "cartao" && (
                  <div className="space-y-4">
                    <div><Label>Numero do cartao</Label><Input value={cartao.numero} onChange={(e) => setCartao({ ...cartao, numero: maskCardNumber(e.target.value) })} placeholder="0000 0000 0000 0000" /></div>
                    <div><Label>Nome no cartao</Label><Input value={cartao.nome} onChange={(e) => setCartao({ ...cartao, nome: e.target.value.toUpperCase() })} /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>Validade</Label><Input value={cartao.validade} onChange={(e) => setCartao({ ...cartao, validade: maskCardExp(e.target.value) })} placeholder="MM/AA" /></div>
                      <div><Label>CVV</Label><Input value={cartao.cvv} onChange={(e) => setCartao({ ...cartao, cvv: onlyDigits(e.target.value).slice(0, 4) })} placeholder="000" /></div>
                      <div>
                        <Label>Parcelas</Label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={cartao.parcelas} onChange={(e) => setCartao({ ...cartao, parcelas: parseInt(e.target.value, 10) })}>
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
                        <p className="text-sm font-semibold mb-3">Codigo de barras</p>
                        <div className="bg-white p-4 rounded-lg font-mono text-xs break-all border border-border">{boletoData.barcode}</div>
                        {boletoData.boleto_url && (
                          <Button asChild variant="outline" className="mt-3 w-full rounded-full">
                            <a href={boletoData.boleto_url} target="_blank" rel="noopener noreferrer">Abrir boleto em PDF</a>
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground mt-3">Vencimento em 3 dias uteis</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">Clique em "Confirmar pedido" para gerar o boleto</p>
                    )}
                  </div>
                )}

                {!pagamentoAprovado && (
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(2)} disabled={saving || !!pedidoId}>Voltar</Button>
                    {!pixData && !boletoData ? (
                      <Button size="lg" disabled={saving} className="flex-1 rounded-full" onClick={finalizar}>
                        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</> : `Confirmar pedido · ${brl(total)}`}
                      </Button>
                    ) : (
                      <Button size="lg" className="flex-1 rounded-full"
                        onClick={() => pedidoId ? navigate({ to: "/pedido/$id", params: { id: pedidoId } }) : navigate({ to: "/conta" })}>
                        Ver meus pedidos
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="rounded-2xl border border-border bg-card p-6 h-fit sticky top-32">
            <h3 className="font-display font-bold mb-4">Resumo</h3>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="line-clamp-1">{i.quantidade}x {i.nome}</span>
                  <span className="font-semibold shrink-0 ml-2">{brl(i.preco * i.quantidade)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{brl(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{frete ? brl(frete) : "—"}</span></div>
              {desconto > 0 && <div className="flex justify-between text-green-600"><span>Desconto PIX</span><span>-{brl(desconto)}</span></div>}
            </div>
            <div className="border-t border-border mt-3 pt-3 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-display text-2xl font-extrabold text-primary">{brl(total)}</span>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
