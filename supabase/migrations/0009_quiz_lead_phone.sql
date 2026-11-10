-- Broj telefona je sada obavezno polje u svakoj formi na sajtu, pa ga i kviz šalje uz
-- ime i email (kad posetilac ne preskoči korak sa kontaktom i da saglasnost).
-- Kolona je opciona: stari upisi je nemaju, a prijava sme da prođe i pre ove migracije.
-- Pokreni jednom u Supabase SQL Editoru.

alter table public.quiz_leads add column if not exists phone text;

-- Spajanje istog čoveka iz kviza i porudžbine po poslednjih 8 cifara broja.
create index if not exists quiz_leads_phone_idx on public.quiz_leads (right(regexp_replace(phone, '[^0-9]', '', 'g'), 8))
  where phone is not null;
