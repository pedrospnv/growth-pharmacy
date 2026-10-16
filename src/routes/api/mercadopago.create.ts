import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MP_BASE = "https://api.mercadopago.com";

type PayerInput = {
  email: string;
  nome: string;
  cpf: string;
};

type CreateBody = {
  method: "pix" | "cartao" | "boleto";
  amount: number;
  description?: string;
  payer: PayerInput;
  address?: {
    cep: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  card?: {
    numero: string;
    nome: string;
    validade: string; // MM/AA
    cvv: string;
    parcelas?: number;
  };
};

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  const first_name = parts.shift() ?? "Cliente";
  const last_name = parts.join(" ") || "MercadoPago";
  return { first_name, last_name };
}

function digits(s: string) {
  return (s || "").replace(/\D/g, "");
}

async function mpFetch(path: string, token: string, init: RequestInit & { idempotencyKey?: string } = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (init.idempotencyKey) headers["X-Idempotency-Key"] = init.idempotencyKey;
  const res = await fetch(`${MP_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, json, text };
}

async function tokenizeCard(token: string, card: NonNullable<CreateBody["card"]>, payer: PayerInput) {
  const [mm, aa] = card.validade.split("/");
  const year = aa.length === 2 ? 2000 + parseInt(aa, 10) : parseInt(aa, 10);
  const body = {
    card_number: digits(card.numero),
    security_code: digits(card.cvv),
    expiration_month: parseInt(mm, 10),
    expiration_year: year,
    cardholder: {
      name: card.nome,
      identification: { type: "CPF", number: digits(payer.cpf) },
    },
  };
  return mpFetch("/v1/card_tokens", token, { method: "POST", body: JSON.stringify(body) });
}

async function detectPaymentMethodId(token: string, bin: string) {
  const res = await mpFetch(`/v1/payment_methods/search?bin=${bin}`, token, { method: "GET" });
  const results = res.json?.results;
  if (Array.isArray(results) && results.length > 0) return results[0].id as string;
  return null;
}

export const Route = createFileRoute("/api/mercadopago/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) {
          return Response.json({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado" }, { status: 500 });
        }

        let body: CreateBody;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "JSON inválido" }, { status: 400 });
        }

        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) return Response.json({ error: "Não autorizado" }, { status: 401 });
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(authHeader.slice(7).trim());
        if (authError || !authData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

        const { method, amount, payer, description = "Pedido Farma Pro" } = body;
        if (String(payer?.email ?? "").toLowerCase() !== String(authData.user.email ?? "").toLowerCase()) {
          return Response.json({ error: "E-mail do pagamento deve corresponder à conta" }, { status: 403 });
        }
        if (!method || !amount || amount <= 0) {
          return Response.json({ error: "Parâmetros inválidos" }, { status: 400 });
        }
        if (!payer?.email || !payer?.nome || !digits(payer?.cpf || "")) {
          return Response.json({ error: "Dados do pagador incompletos (nome, email, cpf)" }, { status: 400 });
        }

        const { first_name, last_name } = splitName(payer.nome);
        const cpf = digits(payer.cpf);
        const idempotencyKey = crypto.randomUUID();

        // --- PIX ---
        if (method === "pix") {
          const payload = {
            transaction_amount: Number(amount.toFixed(2)),
            description,
            payment_method_id: "pix",
            payer: {
              email: payer.email,
              first_name, last_name,
              identification: { type: "CPF", number: cpf },
            },
          };
          const r = await mpFetch("/v1/payments", token, {
            method: "POST",
            body: JSON.stringify(payload),
            idempotencyKey,
          });
          if (!r.ok) return Response.json({ error: r.json?.message || "Falha ao criar PIX", details: r.json }, { status: r.status });
          const td = r.json?.point_of_interaction?.transaction_data;
          return Response.json({
            id: r.json?.id,
            status: r.json?.status,
            method: "pix",
            qr_code_base64: td?.qr_code_base64,
            qr_code: td?.qr_code,
            ticket_url: td?.ticket_url,
            amount: r.json?.transaction_amount,
          });
        }

        // --- Boleto ---
        if (method === "boleto") {
          if (!body.address) {
            return Response.json({ error: "Endereço obrigatório para boleto" }, { status: 400 });
          }
          const a = body.address;
          const payload = {
            transaction_amount: Number(amount.toFixed(2)),
            description,
            payment_method_id: "bolbradesco",
            payer: {
              email: payer.email,
              first_name, last_name,
              identification: { type: "CPF", number: cpf },
              address: {
                zip_code: digits(a.cep),
                street_name: a.rua,
                street_number: a.numero,
                neighborhood: a.bairro,
                city: a.cidade,
                federal_unit: a.estado,
              },
            },
          };
          const r = await mpFetch("/v1/payments", token, {
            method: "POST",
            body: JSON.stringify(payload),
            idempotencyKey,
          });
          if (!r.ok) return Response.json({ error: r.json?.message || "Falha ao gerar boleto", details: r.json }, { status: r.status });
          const td = r.json?.transaction_details;
          return Response.json({
            id: r.json?.id,
            status: r.json?.status,
            method: "boleto",
            barcode: r.json?.barcode?.content || td?.payment_method_reference_id,
            boleto_url: td?.external_resource_url,
            amount: r.json?.transaction_amount,
          });
        }

        // --- Cartão ---
        if (method === "cartao") {
          if (!body.card) return Response.json({ error: "Dados do cartão ausentes" }, { status: 400 });
          const bin = digits(body.card.numero).slice(0, 6);
          const tok = await tokenizeCard(token, body.card, payer);
          if (!tok.ok) return Response.json({ error: tok.json?.message || "Falha ao tokenizar cartão", details: tok.json }, { status: tok.status });
          const paymentMethodId = await detectPaymentMethodId(token, bin);
          const payload = {
            transaction_amount: Number(amount.toFixed(2)),
            token: tok.json.id,
            description,
            installments: body.card.parcelas || 1,
            payment_method_id: paymentMethodId || undefined,
            payer: {
              email: payer.email,
              identification: { type: "CPF", number: cpf },
            },
          };
          const r = await mpFetch("/v1/payments", token, {
            method: "POST",
            body: JSON.stringify(payload),
            idempotencyKey,
          });
          if (!r.ok) return Response.json({ error: r.json?.message || "Falha ao processar cartão", details: r.json }, { status: r.status });
          return Response.json({
            id: r.json?.id,
            status: r.json?.status,
            status_detail: r.json?.status_detail,
            method: "cartao",
            amount: r.json?.transaction_amount,
          });
        }

        return Response.json({ error: "Método inválido" }, { status: 400 });
      },
    },
  },
});
