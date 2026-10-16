import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/mercadopago/confirm")({
  server: { handlers: {
    POST: async ({ request }) => {
      const authorization = request.headers.get("authorization") ?? "";
      if (!authorization.startsWith("Bearer ")) return Response.json({ error: "Não autorizado" }, { status: 401 });
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(authorization.slice(7).trim());
      if (authError || !authData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });
      const body = await request.json().catch(() => null);
      if (typeof body?.order_id !== "string") return Response.json({ error: "Pedido inválido" }, { status: 400 });

      const { data: order, error } = await supabaseAdmin.from("pedidos")
        .select("id,user_id,total,email,mercadopago_payment_id").eq("id", body.order_id)
        .eq("user_id", authData.user.id).maybeSingle();
      if (error || !order) return Response.json({ error: "Pedido não encontrado" }, { status: 404 });
      if (!order.mercadopago_payment_id) return Response.json({ error: "Pagamento ausente" }, { status: 409 });
      const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!token) return Response.json({ error: "Pagamento indisponível" }, { status: 503 });
      const response = await fetch("https://api.mercadopago.com/v1/payments/" + encodeURIComponent(order.mercadopago_payment_id),
        { headers: { Authorization: "Bearer " + token } });
      if (!response.ok) return Response.json({ error: "Não foi possível verificar o pagamento" }, { status: 502 });
      const payment = await response.json();
      const amountMatches = Math.round(Number(payment?.transaction_amount) * 100) === Math.round(Number(order.total) * 100);
      const payerMatches = String(payment?.payer?.email ?? "").toLowerCase() === String(order.email).toLowerCase();
      if (payment?.status !== "approved" || !amountMatches || !payerMatches)
        return Response.json({ error: "Pagamento ainda não aprovado para este pedido" }, { status: 409 });
      const { error: updateError } = await supabaseAdmin.from("pedidos").update({ status: "pago" })
        .eq("id", order.id).eq("user_id", authData.user.id).eq("mercadopago_payment_id", order.mercadopago_payment_id);
      if (updateError) return Response.json({ error: "Não foi possível atualizar o pedido" }, { status: 500 });
      return Response.json({ ok: true, status: "pago" });
    },
  } },
});
