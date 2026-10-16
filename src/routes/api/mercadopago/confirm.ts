import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { paymentMatchesOrder } from "@/lib/payment-validation";

const MP_BASE = "https://api.mercadopago.com";
const PENDING_STATUSES = ["pendente", "aguardando_pagamento", "aguardando_pix", "aguardando_boleto"];

export const Route = createFileRoute("/api/mercadopago/confirm")({
  server: { handlers: {
    POST: async ({ request }) => {
      const authorization = request.headers.get("authorization") ?? "";
      if (!authorization.startsWith("Bearer ")) return Response.json({ error: "Não autorizado" }, { status: 401 });
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(authorization.slice(7).trim());
      if (authError || !authData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

      const body = await request.json().catch(() => null);
      if (typeof body?.order_id !== "string") return Response.json({ error: "Pedido inválido" }, { status: 400 });
      const retryMethod = body?.method;
      const retryPaymentId = typeof body?.payment_id === "string" ? body.payment_id : null;
      if (retryPaymentId && !["pix", "cartao", "boleto"].includes(retryMethod)) {
        return Response.json({ error: "Forma de pagamento inválida" }, { status: 400 });
      }

      const { data: order, error } = await supabaseAdmin.from("pedidos")
        .select("id,user_id,total,subtotal,frete,desconto_pix,email,mercadopago_payment_id,status")
        .eq("id", body.order_id).eq("user_id", authData.user.id).maybeSingle();
      if (error || !order) return Response.json({ error: "Pedido não encontrado" }, { status: 404 });
      if (!order.mercadopago_payment_id && !retryPaymentId) return Response.json({ error: "Pagamento ausente" }, { status: 409 });
      if (retryPaymentId && !PENDING_STATUSES.includes(order.status)) {
        return Response.json({ error: "Este pedido não está aguardando pagamento" }, { status: 409 });
      }

      const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
      if (!token) return Response.json({ error: "Pagamento indisponível" }, { status: 503 });
      const paymentId = retryPaymentId ?? order.mercadopago_payment_id;
      const response = await fetch(MP_BASE + "/v1/payments/" + encodeURIComponent(paymentId), {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) return Response.json({ error: "Não foi possível verificar o pagamento" }, { status: 502 });
      const payment = await response.json();

      let expectedOrder = order;
      if (retryPaymentId) {
        if (payment?.external_reference !== order.id) {
          return Response.json({ error: "Pagamento não está vinculado a este pedido" }, { status: 409 });
        }
        const subtotal = Number(order.subtotal);
        const frete = Number(order.frete);
        const desconto = retryMethod === "pix" ? Math.round(subtotal * 10) / 100 : 0;
        const expectedTotal = Math.round((subtotal + frete - desconto) * 100) / 100;
        expectedOrder = { ...order, total: expectedTotal };
        if (retryMethod === "pix" && payment?.payment_method_id !== "pix") {
          return Response.json({ error: "O pagamento informado não é PIX" }, { status: 409 });
        }
        if (retryMethod === "boleto" && payment?.payment_type_id !== "ticket") {
          return Response.json({ error: "O pagamento informado não é boleto" }, { status: 409 });
        }
        if (retryMethod === "cartao" && !["credit_card", "debit_card", "prepaid_card"].includes(payment?.payment_type_id)) {
          return Response.json({ error: "O pagamento informado não é cartão" }, { status: 409 });
        }
      }

      if (!paymentMatchesOrder(payment, expectedOrder)) {
        return Response.json({ error: "Valor ou e-mail do pagamento não corresponde ao pedido" }, { status: 409 });
      }

      if (retryPaymentId) {
        const approved = payment?.status === "approved";
        if (retryMethod === "cartao" && !approved) {
          return Response.json({ error: `Pagamento ${payment?.status || "pendente"}: ${payment?.status_detail || ""}` }, { status: 409 });
        }
        const subtotal = Number(order.subtotal);
        const frete = Number(order.frete);
        const desconto = retryMethod === "pix" ? Math.round(subtotal * 10) / 100 : 0;
        const total = Math.round((subtotal + frete - desconto) * 100) / 100;
        const status = approved ? "pago" : retryMethod === "pix" ? "aguardando_pix" : "aguardando_boleto";
        const { error: updateError } = await supabaseAdmin.from("pedidos").update({
          forma_pagamento: retryMethod,
          subtotal,
          frete,
          desconto_pix: desconto,
          total,
          status,
          mercadopago_payment_id: paymentId,
        }).eq("id", order.id).eq("user_id", authData.user.id);
        if (updateError) return Response.json({ error: "Não foi possível atualizar o pedido" }, { status: 500 });
        return Response.json({ ok: true, status, payment_id: paymentId });
      }

      if (payment?.status !== "approved") {
        return Response.json({ error: "Pagamento ainda não aprovado para este pedido" }, { status: 409 });
      }
      const { error: updateError } = await supabaseAdmin.from("pedidos").update({ status: "pago" })
        .eq("id", order.id).eq("user_id", authData.user.id).eq("mercadopago_payment_id", paymentId);
      if (updateError) return Response.json({ error: "Não foi possível atualizar o pedido" }, { status: 500 });
      return Response.json({ ok: true, status: "pago" });
    },
  } },
});
