import { createFileRoute } from "@tanstack/react-router";

const MP_BASE = "https://api.mercadopago.com";

function mapStatus(status: string): string | null {
  if (status === "approved") return "pago";
  if (["rejected", "cancelled", "refunded", "charged_back"].includes(status)) return "cancelado";
  return null;
}

async function verificarAssinatura(request: Request, secret: string): Promise<boolean> {
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  const dataId = new URL(request.url).searchParams.get("data.id");
  if (!signature || !requestId || !dataId) return false;
  const parts = Object.fromEntries(signature.split(",").map((part) => {
    const [key, ...value] = part.trim().split("=");
    return [key, value.join("=")];
  }));
  const ts = parts.ts, v1 = parts.v1;
  if (!ts || !v1 || !/^[a-f0-9]{64}$/i.test(v1)) return false;
  const manifest = "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computed = Array.from(new Uint8Array(signatureBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === v1;
}

async function handleNotification(paymentId: string) {
  if (!/^\d+$/.test(paymentId)) return new Response("invalid id", { status: 400 });
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return new Response("config ausente", { status: 503 });
  const res = await fetch(MP_BASE + "/v1/payments/" + paymentId, { headers: { Authorization: "Bearer " + token } });
  if (!res.ok) return new Response("payment lookup failed", { status: 502 });
  const payment = await res.json();
  const nextStatus = mapStatus(payment?.status);
  if (!nextStatus) return new Response("ok", { status: 200 });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error: lookupError } = await supabaseAdmin.from("pedidos")
    .select("id,total,email").eq("mercadopago_payment_id", paymentId).maybeSingle();
  if (lookupError) return new Response("order lookup failed", { status: 500 });
  if (!order) return new Response("ok", { status: 200 });
  const paidCents = Math.round(Number(payment?.transaction_amount) * 100);
  const orderCents = Math.round(Number(order.total) * 100);
  const payerEmail = String(payment?.payer?.email ?? "").toLowerCase();
  if (paidCents !== orderCents || payerEmail !== String(order.email).toLowerCase()) {
    console.warn("[mp-webhook] pagamento não corresponde ao pedido", paymentId);
    return new Response("ok", { status: 200 });
  }
  const { error } = await supabaseAdmin.from("pedidos").update({ status: nextStatus })
    .eq("id", order.id).eq("mercadopago_payment_id", paymentId);
  if (error) return new Response("order update failed", { status: 500 });
  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/public/mercadopago/webhook")({
  server: { handlers: {
    POST: async ({ request }) => {
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
      if (!secret) return new Response("webhook secret not configured", { status: 503 });
      if (!(await verificarAssinatura(request, secret))) return new Response("unauthorized", { status: 401 });
      const url = new URL(request.url);
      let paymentId = url.searchParams.get("data.id");
      const type = url.searchParams.get("type") || url.searchParams.get("topic");
      try {
        const body = await request.json();
        if (!paymentId && body?.data?.id) paymentId = String(body.data.id);
        const eventType = type || body?.type || body?.topic;
        if (eventType && !String(eventType).includes("payment")) return new Response("ignored", { status: 200 });
      } catch { /* Mercado Pago may send only query parameters. */ }
      if (!paymentId) return new Response("missing id", { status: 400 });
      return handleNotification(String(paymentId));
    },
    GET: async () => new Response("method not allowed", { status: 405 }),
  } },
});
