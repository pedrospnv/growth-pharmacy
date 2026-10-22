create table if not exists public.cupons (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo = lower(btrim(codigo))),
  desconto_percentual integer not null check (desconto_percentual between 1 and 100),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.pedidos
  add column if not exists cupom text,
  add column if not exists desconto_cupom numeric(10,2) not null default 0
    check (desconto_cupom >= 0);

alter table public.cupons enable row level security;
revoke all on public.cupons from anon, authenticated;
grant select on public.cupons to anon, authenticated;

create policy cupons_active_read on public.cupons
  for select to anon, authenticated
  using (ativo = true);

insert into public.cupons (codigo, desconto_percentual, ativo)
values ('off10', 10, true)
on conflict (codigo) do update
set desconto_percentual = excluded.desconto_percentual, ativo = true;
