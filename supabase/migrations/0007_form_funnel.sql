-- Analitika sajta i forme (posete, vreme na sajtu, klik na dugme, koraci forme, kalendar, zakazivanje, prodaje),
-- za oba sajta, u našoj bazi (ne zavisi od DataFast naloga):
--   protokol.bozinovicolgica.rs  -> događaji u lp_events (view, cta_click, form_start, form_step 2-4, lead, booking, leave)
--   program.bozinovicolgica.rs   -> nova tabela form_events (upisuje /api/form-event)
-- Rezultati: https://protokol.bozinovicolgica.rs/forma-rezultati?key=AB_RESULTS_KEY
-- Pokreni jednom u Supabase SQL Editoru.

create table if not exists public.form_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  form        text not null,          -- 'program'
  visitor_id  uuid not null,          -- cookie lp_vid (postavlja proxy.ts)
  event       text not null,          -- view, form_open, form_step, lead, booking, leave
  step        int,
  props       jsonb not null default '{}',   -- leave: {s: id posete, sec: sekunde na stranici}
  is_qa       boolean not null default false,
  user_agent  text
);

create index if not exists form_events_form_idx on public.form_events (form, created_at desc);
create index if not exists lp_events_created_idx on public.lp_events (created_at desc);

-- Upis i čitanje samo sa servera (service role), kao lp_events.
alter table public.form_events enable row level security;

drop function if exists public.form_funnel(int);

-- Ceo izveštaj za jedan period, kao JSON. p_period: 'month' (ovaj mesec, beogradsko vreme), '7', '30', '90' (dana).
-- Bez QA posetilaca (?v=a / ?v=b / ?qa=1) i botova.
create or replace function public.form_report(p_period text default 'month')
returns jsonb
language sql
stable
set search_path = public
as $$
  with since as (
    select case p_period
      when '7'  then now() - interval '7 days'
      when '30' then now() - interval '30 days'
      when '90' then now() - interval '90 days'
      else date_trunc('month', now() at time zone 'Europe/Belgrade') at time zone 'Europe/Belgrade'
    end as t
  ),
  pe as (
    select e.visitor_id, e.event, e.props
    from lp_events e, since
    where e.created_at >= since.t
      and not e.is_qa
      and coalesce(e.user_agent, '') !~* '(bot|crawl|spider|facebookexternalhit|preview|headless)'
  ),
  fe as (
    select e.visitor_id, e.event, e.props
    from form_events e, since
    where e.form = 'program'
      and e.created_at >= since.t
      and not e.is_qa
      and coalesce(e.user_agent, '') !~* '(bot|crawl|spider|facebookexternalhit|preview|headless)'
  ),
  steps (form, step, label, visitors) as (
    select 'protokol'::text, 1, 'Otvorili stranicu'::text,               count(distinct visitor_id) filter (where event = 'view') from pe
    union all select 'protokol', 2, 'Kliknuli dugme za protokol',          count(distinct visitor_id) filter (where event = 'cta_click') from pe
    union all select 'protokol', 3, 'Počeli formu (korak 1: za koga je)',  count(distinct visitor_id) filter (where event = 'form_start') from pe
    union all select 'protokol', 4, 'Korak 2 (tegobe)',                    count(distinct visitor_id) filter (where event = 'form_step' and props->>'step' = '2') from pe
    union all select 'protokol', 5, 'Korak 3 (nalazi i dokumenta)',        count(distinct visitor_id) filter (where event = 'form_step' and props->>'step' = '3') from pe
    union all select 'protokol', 6, 'Korak 4 (kontakt)',                   count(distinct visitor_id) filter (where event = 'form_step' and props->>'step' = '4') from pe
    union all select 'protokol', 7, 'Poslali prijavu, otvorili kalendar',  count(distinct visitor_id) filter (where event = 'lead') from pe
    union all select 'protokol', 8, 'Zakazali poziv',                      count(distinct visitor_id) filter (where event = 'booking') from pe
    union all select 'program', 1, 'Otvorili stranicu',                    count(distinct visitor_id) filter (where event = 'view') from fe
    union all select 'program', 2, 'Kliknuli dugme, otvorili prijavu',     count(distinct visitor_id) filter (where event = 'form_open') from fe
    union all select 'program', 3, 'Korak 2 (kontakt)',                    count(distinct visitor_id) filter (where event = 'form_step') from fe
    union all select 'program', 4, 'Poslali prijavu, otvorili kalendar',   count(distinct visitor_id) filter (where event = 'lead') from fe
    union all select 'program', 5, 'Zakazali poziv',                       count(distinct visitor_id) filter (where event = 'booking') from fe
  ),
  -- vreme na stranici: za svaku posetu (props.s) najveći poslati broj sekundi aktivnog gledanja
  visit_time as (
    select 'protokol'::text as form, max((props->>'sec')::int) as sec
    from pe where event = 'leave' and props->>'s' is not null and props->>'sec' ~ '^[0-9]+$'
    group by props->>'s'
    union all
    select 'program', max((props->>'sec')::int)
    from fe where event = 'leave' and props->>'s' is not null and props->>'sec' ~ '^[0-9]+$'
    group by props->>'s'
  ),
  site as (
    select f.form,
           (select count(*) from pe where event = 'view' and f.form = 'protokol')
             + (select count(*) from fe where event = 'view' and f.form = 'program') as visits,
           (select round(avg(sec)) from visit_time v where v.form = f.form) as avg_sec,
           (select percentile_cont(0.5) within group (order by sec) from visit_time v where v.form = f.form) as median_sec
    from (values ('protokol'), ('program')) as f(form)
  ),
  leads as (
    select case when l.experiment = 'program-9-dana' then 'program' else 'protokol' end as form,
           count(*) as prijave, count(l.booked_at) as zakazali, count(l.followup_sent_at) as alarmi
    from lp_leads l, since
    where l.created_at >= since.t and not l.is_qa
    group by 1
  ),
  sales as (
    select count(*) as prodaje, coalesce(sum(coalesce(o.amount_paid, o.amount_eur)), 0) as iznos
    from orders o, since
    where o.status in ('paid', 'delivered') and o.paid_at >= since.t
  )
  select jsonb_build_object(
    'since', (select t from since),
    'steps', (select coalesce(jsonb_agg(jsonb_build_object('form', form, 'step', step, 'label', label, 'visitors', visitors) order by form, step), '[]'::jsonb) from steps),
    'site',  (select jsonb_object_agg(form, jsonb_build_object('visits', visits, 'avg_sec', avg_sec, 'median_sec', median_sec)) from site),
    'leads', (select coalesce(jsonb_object_agg(form, jsonb_build_object('prijave', prijave, 'zakazali', zakazali, 'alarmi', alarmi)), '{}'::jsonb) from leads),
    'sales', (select jsonb_build_object('prodaje', prodaje, 'iznos', iznos) from sales)
  )
$$;

-- Funkciju zove samo server (stranica /forma-rezultati), ne browser.
revoke execute on function public.form_report(text) from public, anon, authenticated;
grant execute on function public.form_report(text) to service_role;
