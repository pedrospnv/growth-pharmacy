import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, HeadContent, Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Farma Pro — Sua farmácia online" },
      { name: "description", content: "Medicamentos, manipulação, vitaminas, suplementos e dermocosméticos com entrega rápida e 10% OFF no PIX." },
      { property: "og:title", content: "Farma Pro — Sua farmácia online" },
      { property: "og:description", content: "Medicamentos, manipulação, vitaminas, suplementos e dermocosméticos com 10% OFF no PIX." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Farma Pro — Sua farmácia online" },
      { name: "twitter:description", content: "Medicamentos, manipulação, vitaminas, suplementos e dermocosméticos com 10% OFF no PIX." },

      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-7xl font-display font-extrabold text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
        <a href="/" className="mt-6 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Voltar à loja</a>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-2xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <a href="/" className="mt-6 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Voltar</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
