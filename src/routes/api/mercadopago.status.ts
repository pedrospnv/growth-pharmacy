import { createFileRoute } from "@tanstack/react-router";

const MP_BASE = "https://api.mercadopago.com";

export const Route = createFileRoute("/api/mercadopago/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) {
          return Response.json({ error: "config ausente" }, { status: 500 });
        }

        const url = new URL(request.url);
        const paymentId = url.searchParams.get("payment_id");
        if (!paymentId) {
          return Response.json({ error: "payment_id obrigatorio" }, { status: 400 });
        }

        const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          return Response.json({ error: "falha ao consultar MP" }, { status: res.status });
        }

        const payment = await res.json();
        return Response.json({
          status: payment?.status,
          status_detail: payment?.status_detail,
        });
      },
    },
  },
});
