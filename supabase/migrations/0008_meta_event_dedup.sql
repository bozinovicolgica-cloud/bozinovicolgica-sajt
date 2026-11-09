-- Meta Pixel: prijava sa programske stranice (program.bozinovicolgica.rs) nosi svoj eventID,
-- koji je isti u Pixel događajima CompleteRegistration i Lead. Uz njega se pamte i _fbp/_fbc,
-- kolačići Pixela, da bi ista prijava mogla da se prepozna ako jednom krene i preko
-- Conversions API-ja (tada Meta po eventID-ju zna da je ne broji dvaput).
-- Kolone su opcione: prijava se upisuje i kad posetilac ne prihvati kolačiće, pa Pixela nema.
-- Pokreni jednom u Supabase SQL Editoru.

alter table public.lp_leads add column if not exists meta_event_id text;
alter table public.lp_leads add column if not exists fbp           text;
alter table public.lp_leads add column if not exists fbc           text;

-- Pretraga prijave po eventID-ju (provera u Events Manageru, ručno spajanje događaja).
create index if not exists lp_leads_meta_event_id_idx on public.lp_leads (meta_event_id)
  where meta_event_id is not null;
