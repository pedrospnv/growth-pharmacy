# Farma Pro

Projeto de portfólio: uma loja virtual demonstrativa de produtos de farmácia, criada com React, TypeScript, TanStack Start, Supabase e Mercado Pago.

> **Status:** protótipo para demonstração. Não use para vender medicamentos, receber pagamentos reais ou armazenar dados reais de clientes. Catálogo e marca são ilustrativos; o frete está zerado no checkout demonstrativo.

## Funcionalidades

- Catálogo com busca, categorias, promoções e disponibilidade em estoque.
- Carrinho persistido no navegador e checkout demonstrativo.
- Autenticação, área do cliente e histórico de pedidos.
- Painel de administração para produtos, pedidos e equipe.
- Integração demonstrativa de pagamentos via Mercado Pago.

## Tecnologias

React 19 · TypeScript · TanStack Start/Router · Supabase · Tailwind CSS · Mercado Pago · Bun

## Rodar localmente

1. Instale [Bun](https://bun.sh/).
2. Copie `.env.example` para `.env` e configure seu ambiente de teste.
3. Instale dependências e inicie o servidor:

```sh
bun install
bun run dev
```

O Vite inicia em `http://localhost:8080`. A aplicação precisa de um projeto Supabase com as migrações de `supabase/migrations` aplicadas.

Para testar pagamentos, use credenciais e cartões de teste do Mercado Pago. Nunca use credenciais de produção neste protótipo.

## Verificações

```sh
bun test
bun run lint
bun run build
```

## Variáveis de ambiente

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `RESEND_API_KEY` (opcional, para e-mails)

A chave publicável do Supabase pode ser usada no cliente. A chave service role e as credenciais do Mercado Pago e Resend devem permanecer somente no servidor. Configure o webhook do Mercado Pago em `/api/public/mercadopago/webhook`.

## Demonstração e limitações

Não há URL de demonstração pública configurada neste repositório. Grave uma demonstração em ambiente isolado, com dados fictícios, antes de compartilhar o projeto. O frete está zerado para demonstração; catálogo, marca e conteúdo são fictícios. O projeto não implementa requisitos operacionais ou regulatórios para uma farmácia real.
