import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type CloudflareEnv = {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  MERCADOPAGO_ACCESS_TOKEN?: string;
};

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

const g = globalThis as Record<string, string | undefined>;

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const cfEnv = (env ?? {}) as CloudflareEnv;

      // Inject into globalThis so SSR code can read them
      if (cfEnv.SUPABASE_URL) g.SUPABASE_URL = cfEnv.SUPABASE_URL;
      if (cfEnv.SUPABASE_PUBLISHABLE_KEY) g.SUPABASE_PUBLISHABLE_KEY = cfEnv.SUPABASE_PUBLISHABLE_KEY;
      if (cfEnv.VITE_SUPABASE_URL) g.VITE_SUPABASE_URL = cfEnv.VITE_SUPABASE_URL;
      if (cfEnv.VITE_SUPABASE_PUBLISHABLE_KEY) g.VITE_SUPABASE_PUBLISHABLE_KEY = cfEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (cfEnv.MERCADOPAGO_ACCESS_TOKEN) g.MERCADOPAGO_ACCESS_TOKEN = cfEnv.MERCADOPAGO_ACCESS_TOKEN;

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
