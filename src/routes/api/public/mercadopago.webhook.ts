import { createFileRoute } from "@tanstack/react-router";

const MP_BASE = "https://api.mercadopago.com";

function mapStatus(mpStatus: string): string | null {
  switch (mpStatus) {
    case "approved": return "pago";
    case "in_process":
    case "pending":
    case "authorized": return null;
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back": return "cancelado";
    default: return null;
  }
}

async function verificarAssinatura(request: Request, secret: string): Promise<boolean> {
  // MP envia x-signature: ts=....,v1=....
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id");

  if (!xSignature) return false;

  const parts = Object.fromEntries(xSignature.split(",").map((p) => p.split("=")));
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId ?? ""};request-id:${xRequestId ?? ""};ts:${ts};`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computed = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === v1;
}

async function handleNotification(paymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    console.error("[mp-webhook] MERCADOPAGO_ACCESS_TOKEN ausente");
    return new Response("Config ausente", { status: 500 });
  }

  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error("[mp-webhook] Falha ao consultar pagamento", paymentId, res.status);
    return new Response("ok", { status: 200 });
  }
  const payment = await res.json();
  const novoStatus = mapStatus(payment?.status);
  if (!novoStatus) return new Response("ok", { status: 200 });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("pedidos")
    .update({ status: novoStatus })
    .eq("mercadopago_payment_id", String(paymentId));

  if (error) console.error("[mp-webhook] erro update pedido", error.message);
  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/public/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

        // Valida assinatura se o secret estiver configurado
        if (webhookSecret) {
          const valido = await verificarAssinatura(request.clone(), webhookSecret);
          if (!valido) {
            console.warn("[mp-webhook] assinatura inválida");
            return new Response("unauthorized", { status: 401 });
          }
        }

        const url = new URL(request.url);
        let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
        const type = url.searchParams.get("type") || url.searchParams.get("topic");

        try {
          const body = await request.json().catch(() => null as any);
          if (!paymentId && body) {
            paymentId = body?.data?.id || body?.resource?.toString().split("/").pop() || body?.id;
          }
          const eventType = type || body?.type || body?.topic;
          if (eventType && !String(eventType).includes("payment")) {
            return new Response("ignored", { status: 200 });
          }
        } catch { /* ignore */ }

        if (!paymentId) return new Response("missing id", { status: 200 });
        return handleNotification(String(paymentId));
      },
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
        if (!paymentId) return new Response("ok", { status: 200 });
        return handleNotification(paymentId);
      },
    },
  },
});
