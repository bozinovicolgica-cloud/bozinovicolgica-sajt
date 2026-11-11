-- Kviz korak po korak: jedan red po prolazu kroz kviz (od klika na „Započni kviz“),
-- sa najdaljim korakom do kog je posetilac stigao i odgovorima do tog trenutka.
-- Upisuje /api/quiz-step posle svakog koraka; posle 10 min bez novog koraka red ide u
-- Airtable „Kviz koraci“ (api/lp/followup, pg_cron svake minute).
-- Kontakt (ime, telefon, email) se ovde ne čuva; ako ga ostavi, contact = true i lead_id
-- pokazuje na prijavu u lp_leads. Pokreni jednom u Supabase SQL Editoru.

create table if not exists public.quiz_sessions (
  id           uuid primary key,                 -- generiše browser pri „Započni kviz“
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  visitor_id   uuid,
  is_qa        boolean not null default false,
  last_step    int not null default 0,           -- 0..10 pitanje, 11 kontakt forma, 12 rezultat
  answered     int not null default 0,           -- koliko pitanja ima odgovor
  answers      jsonb not null default '{}',      -- čitljivi odgovori do tog koraka
  finished     boolean not null default false,
  contact      boolean not null default false,
  lead_id      uuid,
  page         text,
  user_agent   text,
  dirty        boolean not null default true,    -- ima promenu koja još nije u Airtable-u
  airtable_id  text
);

create index if not exists quiz_sessions_sync_idx on public.quiz_sessions (updated_at) where dirty;
create index if not exists quiz_sessions_created_idx on public.quiz_sessions (created_at desc);

-- Upis i čitanje samo sa servera (service role).
alter table public.quiz_sessions enable row level security;
