import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase as supabaseBrowser } from "@/integrations/supabase/client";

// Client-side: explicitly attach the current user's bearer token to the request.
// Refreshes the session if needed so we never send a stale/expired access_token.
const attachBearer = createMiddleware({ type: "function" }).client(async ({ next }) => {
  let { data } = await supabaseBrowser.auth.getSession();
  let token = data.session?.access_token;
  const expiresAt = data.session?.expires_at;
  const nowSec = Math.floor(Date.now() / 1000);
  if (!token || (expiresAt && expiresAt - nowSec < 30)) {
    const { data: refreshed } = await supabaseBrowser.auth.refreshSession();
    token = refreshed.session?.access_token ?? token;
  }
  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return next({ headers: { Authorization: `Bearer ${token}` } });
});

// Server-side: read the bearer token and validate it remotely via
// supabaseAdmin.auth.getUser(token). More reliable than local JWKS validation.
const requireAdmin = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  const authHeader = request?.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: missing bearer token");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) throw new Error("Unauthorized: empty token");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error("Unauthorized: invalid session");
  }
  const userId = data.user.id;

  const { data: roleRow, error: rErr } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (rErr) throw new Error(rErr.message);
  if (!roleRow) throw new Error("Acesso restrito a administradores");

  return next({ context: { userId } });
});

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito a administradores");
}

export const createFuncionario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      nome: z.string().min(1).max(120),
      email: z.string().email(),
      senha: z.string().min(6).max(72),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar conta");

    const uid = created.user.id;
    // upgrade role: remove default 'user', add 'funcionario'
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: uid, role: "funcionario" });
    if (rErr) throw new Error(rErr.message);

    return { id: uid };
  });

export const updateFuncionario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      nome: z.string().min(1).max(120).optional(),
      senha: z.string().min(6).max(72).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const updates: { password?: string; user_metadata?: { nome: string } } = {};
    if (data.senha) updates.password = data.senha;
    if (data.nome) updates.user_metadata = { nome: data.nome };
    if (Object.keys(updates).length) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, updates);
      if (error) throw new Error(error.message);
    }
    if (data.nome) {
      await supabaseAdmin.from("profiles").update({ nome: data.nome }).eq("id", data.id);
    }
    return { ok: true };
  });

export const setAccountActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      ativo: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ ativo: data.ativo })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    // Revoke sessions when deactivating
    if (!data.ativo) {
      await supabaseAdmin.auth.admin.signOut(data.id).catch(() => {});
    }
    return { ok: true };
  });

export const listFuncionarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "funcionario");
    if (error) throw new Error(error.message);
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return { funcionarios: [] as Array<{ id: string; nome: string | null; email: string | null; ativo: boolean }> };
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, email, ativo")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    return { funcionarios: profiles ?? [] };
  });

export const listClientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    // Clientes = users without admin/funcionario role
    const { data: staffRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "funcionario"]);
    const staffIds = new Set((staffRows ?? []).map((r) => r.user_id));

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, email, created_at, ativo")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const clientes = (profiles ?? []).filter((p) => !staffIds.has(p.id));

    // Count pedidos per cliente
    const { data: pedidos } = await supabaseAdmin
      .from("pedidos")
      .select("user_id");
    const counts = new Map<string, number>();
    for (const p of pedidos ?? []) {
      if (!p.user_id) continue;
      counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1);
    }
    return {
      clientes: clientes.map((c) => ({ ...c, pedidos_count: counts.get(c.id) ?? 0 })),
    };
  });

export const deleteFuncionario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
