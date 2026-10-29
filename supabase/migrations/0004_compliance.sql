-- Compliance (29. 10. 2026): dokaz o odricanju od prava na odustanak i pristanak za podatke o zdravlju.
--   waiver_at / waiver_version: kupac je na checkout-u štiklirao „Tražim da program počne odmah…
--     znam da gubim pravo na odustanak kada program bude u potpunosti izvršen“ (tekst: lib/legal.ts WAIVER_TEXT)
--   health_consent_at: izričit pristanak za napomenu o lekovima i dijagnozi (bez njega se napomena ne čuva)
--   first_video_at / last_video_at: kad je stigao prvi i poslednji video (upisuje se ručno ili iz alata za slanje)

alter table public.orders
  add column if not exists waiver_at          timestamptz,
  add column if not exists waiver_version     text,
  add column if not exists health_consent_at  timestamptz,
  add column if not exists first_video_at     timestamptz,
  add column if not exists last_video_at      timestamptz;

-- Protokol ishrane: pristanak roditelja kad je upitnik za dete.
alter table public.lp_leads
  add column if not exists guardian_consent     boolean,
  add column if not exists guardian_consent_at  timestamptz;
