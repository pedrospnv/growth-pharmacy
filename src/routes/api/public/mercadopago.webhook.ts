import { createFileRoute } from "@tanstack/react-router";

const MP_BASE = "https://api.mercadopago.com";

function mapStatus(mpStatus: string): string | null {
  switch (mpStatus) {
    case "approved":
      return "pago";
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
    return new Response("config ausente", { status: 500 });
  }

  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error("[mp-webhook] falha ao consultar pagamento", paymentId, res.status);
    return new Response("ok", { status: 200 });
  }

  const payment = await res.json();
  console.log("[mp-webhook] payment_id:", paymentId, "| mp_status:", payment?.status);

  const novoStatus = mapStatus(payment?.status ?? "");
  if (!novoStatus) {
    console.log("[mp-webhook] status ignorado:", payment?.status);
    return new Response("ok", { status: 200 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .update({ status: novoStatus })
    .eq("mercadopago_payment_id", String(paymentId))
    .select("id");

  if (error) {
    console.error("[mp-webhook] erro ao atualizar pedido:", error.message);
  } else {
    console.log("[mp-webhook] pedidos atualizados:", data?.length ?? 0, "| novo status:", novoStatus);
  }

  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/public/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
        let eventType = url.searchParams.get("type") || url.searchParams.get("topic");

        try {
          const body = await request.json().catch(() => null as any);
          if (body) {
            if (!paymentId) {
              paymentId =
                body?.data?.id ||
                body?.resource?.toString().split("/").pop() ||
                String(body?.id || "");
            }
            if (!eventType) {
              eventType = body?.type || body?.topic;
            }
          }
        } catch { /* ignora */ }

        if (eventType && !String(eventType).toLowerCase().includes("payment")) {
          console.log("[mp-webhook] evento ignorado:", eventType);
          return new Response("ignored", { status: 200 });
        }

        if (!paymentId || paymentId === "0") {
          console.warn("[mp-webhook] paymentId ausente ou invalido");
          return new Response("missing id", { status: 200 });
        }

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
