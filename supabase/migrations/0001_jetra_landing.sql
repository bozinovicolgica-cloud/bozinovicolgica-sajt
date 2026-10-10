-- 9 dana spašavanja jetre: porudžbine i lead-ovi iz kviza
-- Pokreni u Supabase SQL editoru (ili `supabase db push`).
-- Upis ide isključivo preko server rute sa service_role ključem, zato RLS
-- nema javnih polisa: anon/authenticated korisnici ne mogu ni da čitaju ni da pišu.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  reference    text not null unique,                 -- poziv na broj
  status       text not null default 'pending'
               check (status in ('pending', 'paid', 'delivered', 'cancelled', 'refunded')),
  product      text not null,
  name         text not null,
  email        text not null,
  phone        text not null,
  country      text not null default 'RS' check (country in ('RS', 'INT')),
  note         text,
  amount_eur   numeric(10, 2) not null,
  amount_rsd   numeric(12, 2),
  source       text,                                 -- koje dugme je otvorilo formu
  quiz_result  text,
  quiz_score   int,
  utm          jsonb not null default '{}'::jsonb,
  page         text,
  user_agent   text,
  consent_at   timestamptz not null,
  paid_at      timestamptz,
  delivered_at timestamptz
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_email_idx on public.orders (lower(email));

create table if not exists public.quiz_leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  name             text,
  email            text,
  consent          boolean not null default false,
  consent_at       timestamptz,
  result           text not null check (result in ('likely', 'ok', 'doctor', 'pregnant')),
  score            int not null,
  tags             text[] not null default '{}',
  answers          jsonb not null,
  answers_readable jsonb not null default '{}'::jsonb,
  page             text,
  user_agent       text
);

create index if not exists quiz_leads_created_at_idx on public.quiz_leads (created_at desc);
create index if not exists quiz_leads_email_idx on public.quiz_leads (lower(email)) where email is not null;

-- automatsko updated_at + datumi plaćanja/isporuke kad se promeni status
create or replace function public.orders_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'paid' and old.status is distinct from 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  if new.status = 'delivered' and old.status is distinct from 'delivered' and new.delivered_at is null then
    new.delivered_at := now();
  end if;
  return new;
end $$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
for each row execute function public.orders_touch();

alter table public.orders enable row level security;
alter table public.quiz_leads enable row level security;
-- (namerno bez polisa)
