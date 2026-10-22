import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/coupons/validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization") ?? "";
        if (!authorization.startsWith("Bearer ")) {
          return Response.json({ error: "Não autorizado" }, { status: 401 });
        }
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(authorization.slice(7).trim());
        if (authError || !authData.user) {
          return Response.json({ error: "Sessão inválida" }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        const codigo = typeof body?.codigo === "string" ? body.codigo.trim().toLowerCase() : "";
        if (!/^[a-z0-9_-]{1,32}$/.test(codigo)) {
          return Response.json({ error: "Código de cupom inválido" }, { status: 400 });
        }

        const { data: coupon, error } = await supabaseAdmin.from("cupons")
          .select("codigo,desconto_percentual")
          .eq("codigo", codigo)
          .eq("ativo", true)
          .maybeSingle();
        if (error || !coupon) {
          return Response.json({ error: "Cupom inválido ou inativo" }, { status: 404 });
        }
        return Response.json(coupon);
      },
    },
  },
});
