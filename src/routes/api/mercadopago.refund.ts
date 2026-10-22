import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MP_BASE = "https://api.mercadopago.com";

export const Route = createFileRoute("/api/mercadopago/refund")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) {
          return Response.json({ error: "config ausente" }, { status: 500 });
        }

        // Verifica se quem chama é admin via bearer token
        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "Não autorizado" }, { status: 401 });
        }
        const bearerToken = authHeader.slice("Bearer ".length).trim();
        const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(bearerToken);
        if (authError || !userData?.user) {
          return Response.json({ error: "Sessão inválida" }, { status: 401 });
        }
        const { data: roleRow } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleRow) {
          return Response.json({ error: "Acesso restrito a administradores" }, { status: 403 });
        }

        const body = await request.json().catch(() => null);
        const paymentId = body?.payment_id;
        if (!paymentId) {
          return Response.json({ error: "payment_id obrigatorio" }, { status: 400 });
        }

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
