import { createFileRoute } from "@tanstack/react-router";

const MP_BASE = "https://api.mercadopago.com";

export const Route = createFileRoute("/api/mercadopago/refund")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) {
          return Response.json({ error: "config ausente" }, { status: 500 });
        }

        const body = await request.json().catch(() => null);
        const paymentId = body?.payment_id;
        if (!paymentId) {
          return Response.json({ error: "payment_id obrigatorio" }, { status: 400 });
        }

        // Estorno total via API do MP
        const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}/refunds`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("[mp-refund] erro:", data);
          return Response.json({ error: data?.message || "Falha no estorno" }, { status: res.status });
        }

        console.log("[mp-refund] estorno realizado:", data?.id, "payment_id:", paymentId);
        return Response.json({ ok: true, refund_id: data?.id });
      },
    },
  },
});
