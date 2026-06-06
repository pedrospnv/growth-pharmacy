import { createFileRoute } from "@tanstack/react-router";

const MP_BASE = "https://api.mercadopago.com";

// Mapeia o status do Mercado Pago para o status interno do pedido
function mapStatus(mpStatus: string): string | null {
  switch (mpStatus) {
    case "approved":
      return "pago";
    case "in_process":
    case "pending":
    case "authorized":
      return null; // mantém status atual
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelado";
    default:
      return null;
  }
}

async function handleNotification(paymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    console.error("[mp-webhook] MERCADOPAGO_ACCESS_TOKEN ausente");
    return new Response("Config ausente", { status: 500 });
  }

  // Consulta o pagamento na API do MP para confirmar o status real
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

  // Atualiza o pedido vinculado a este pagamento
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
        const url = new URL(request.url);
        // MP envia tanto na query (?type=payment&data.id=123) quanto no body
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
