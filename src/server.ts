import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type CloudflareEnv = Record<string, string | undefined>;

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function injectEnv(env: CloudflareEnv) {
  // Cloudflare Workers passes vars via the `env` arg, not process.env / import.meta.env.
  // Mirror them to process.env AND globalThis so generated Supabase/MP clients can read them.
  const g = globalThis as Record<string, unknown>;
  // Ensure process.env exists (nodejs_compat usually provides it, but be defensive)
  if (typeof (globalThis as any).process === "undefined") {
    (globalThis as any).process = { env: {} };
  } else if (!(globalThis as any).process.env) {
    (globalThis as any).process.env = {};
  }
  const pEnv = (globalThis as any).process.env as Record<string, string | undefined>;

  const set = (key: string, value: string | undefined) => {
    if (!value) return;
    if (!pEnv[key]) pEnv[key] = value;
    if (!g[key]) g[key] = value;
  };

  // Copy everything passed in
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "string") set(k, v);
  }

  // Derive non-VITE names from VITE_* fallbacks (and vice versa)
  set("SUPABASE_URL", env.SUPABASE_URL ?? env.VITE_SUPABASE_URL);
  set("SUPABASE_PUBLISHABLE_KEY", env.SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY);
  set("SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY);
  set("VITE_SUPABASE_URL", env.VITE_SUPABASE_URL ?? env.SUPABASE_URL);
  set("VITE_SUPABASE_PUBLISHABLE_KEY", env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY);
  set("MERCADOPAGO_ACCESS_TOKEN", env.MERCADOPAGO_ACCESS_TOKEN);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      injectEnv((env ?? {}) as CloudflareEnv);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
