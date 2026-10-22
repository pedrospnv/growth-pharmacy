// Envio de emails via Resend
// Adicione RESEND_API_KEY nas variáveis de ambiente do Cloudflare

export async function sendEmail({
  to, subject, html,
}: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY não configurada, email não enviado");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Farma Pro <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] erro ao enviar:", err);
  }
}

export function emailConfirmacaoPedido({
  nome, pedidoId, itens, total, endereco, formaPagamento,
}: {
  nome: string;
  pedidoId: string;
  itens: Array<{ nome: string; quantidade: number; preco: number }>;
  total: number;
  endereco: string;
  formaPagamento: string;
}) {
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const itensHtml = itens.map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${i.quantidade}x ${i.nome}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${brl(i.preco * i.quantidade)}</td>
    </tr>
  `).join("");

  const pgtoLabel: Record<string, string> = { pix: "PIX", cartao: "Cartão de crédito", boleto: "Boleto" };

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a3a5c;padding:32px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">farmapro</p>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Sua farmácia online</p>
          </td>
        </tr>

        <!-- Título -->
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#1a3a5c;">Pedido confirmado!</p>
            <p style="margin:8px 0 0;font-size:14px;color:#666;">Olá, ${nome}! Recebemos seu pedido e já estamos preparando tudo.</p>
            <p style="margin:12px 0 0;display:inline-block;background:#f0f4f8;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;color:#1a3a5c;font-family:monospace;">
              Pedido #${pedidoId.slice(0, 8).toUpperCase()}
            </p>
          </td>
        </tr>

        <!-- Itens -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700;">Itens do pedido</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itensHtml}
              <tr>
                <td style="padding:12px 0 0;font-weight:800;font-size:16px;color:#1a3a5c;">Total</td>
                <td style="padding:12px 0 0;font-weight:800;font-size:16px;color:#1a3a5c;text-align:right;">${brl(total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Detalhes -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;padding-right:8px;vertical-align:top;">
                  <div style="background:#f8f9fa;border-radius:10px;padding:16px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700;">Entrega</p>
                    <p style="margin:0;font-size:13px;color:#333;">${endereco}</p>
                  </div>
                </td>
                <td style="width:50%;padding-left:8px;vertical-align:top;">
                  <div style="background:#f8f9fa;border-radius:10px;padding:16px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:700;">Pagamento</p>
                    <p style="margin:0;font-size:13px;color:#333;">${pgtoLabel[formaPagamento] ?? formaPagamento}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px 32px;">
            <a href="https://growth-pharmacy.pedroandrad006.workers.dev/pedidos"
               style="display:block;background:#1a3a5c;color:#ffffff;text-decoration:none;text-align:center;padding:14px;border-radius:50px;font-weight:700;font-size:14px;">
              Acompanhar meu pedido
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">Dúvidas? Fale conosco pelo WhatsApp: (12) 99251-2045</p>
            <p style="margin:4px 0 0;font-size:11px;color:#ccc;">© 2026 Farma Pro. Todos os direitos reservados.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const enviarEmailPedido = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      to: z.string().email(),
      nome: z.string(),
      pedidoId: z.string(),
      itens: z.array(z.object({ nome: z.string(), quantidade: z.number(), preco: z.number() })),
      total: z.number(),
      endereco: z.string(),
      formaPagamento: z.string(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    await sendEmail({
      to: data.to,
      subject: `Pedido #${data.pedidoId.slice(0, 8).toUpperCase()} confirmado — Farma Pro`,
      html: emailConfirmacaoPedido(data),
    });
    return { ok: true };
  });
