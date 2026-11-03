-- Protokol ishrane: posle prijave posetilac zakazuje online poziv (Cal.com, stranica /zakazi).
--   booked_at / booking_start / booking_uid: iz Cal.com webhook-a (app/api/cal/webhook)
--   followup_sent_at: kad je Olgici na Telegram otišlo „nije zakazala, pozovi“ (app/api/lp/followup)

alter table public.lp_leads
  add column if not exists booked_at         timestamptz,
  add column if not exists booking_start     timestamptz,
  add column if not exists booking_uid       text,
  add column if not exists followup_sent_at  timestamptz;

create index if not exists lp_leads_followup_idx on public.lp_leads (created_at) where booked_at is null and followup_sent_at is null;

-- A/B rezultati: i koliko je posetilaca zakazalo poziv (događaj 'booking' upisuje webhook).
create or replace view public.lp_ab_results
with (security_invoker = true) as
with ev as (
  select * from public.lp_events
  where not is_qa
    and coalesce(user_agent, '') !~* '(bot|crawl|spider|facebookexternalhit|preview|headless)'
)
select
  experiment,
  variant,
  count(distinct visitor_id) filter (where event = 'view')        as posetioci,
  count(distinct visitor_id) filter (where event = 'form_start')  as zapoceli_formu,
  count(distinct visitor_id) filter (where event = 'form_step' and (props->>'step')::int >= 4) as stigli_do_kontakta,
  count(distinct visitor_id) filter (where event = 'lead')        as prijave,
  round(100.0 * count(distinct visitor_id) filter (where event = 'lead')
        / nullif(count(distinct visitor_id) filter (where event = 'view'), 0), 2) as konverzija_pct,
  round(100.0 * count(distinct visitor_id) filter (where event = 'form_start')
        / nullif(count(distinct visitor_id) filter (where event = 'view'), 0), 2) as zapoceli_pct,
  count(distinct visitor_id) filter (where event = 'booking')     as zakazali
from ev
group by experiment, variant
order by experiment, variant;

-- Na svakih 5 minuta: prijave bez zakazanog poziva starije od LEAD_FOLLOWUP_MINUTES -> Telegram Olgici.
-- Ruta je bezbedna za javno pozivanje: svaka prijava se javlja tačno jednom.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'protokol-followup',
  '*/5 * * * *',
  $$ select net.http_post(
       url := 'https://protokol.bozinovicolgica.rs/api/lp/followup',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);
