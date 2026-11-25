-- Zemlja iz URL parametra reklame (country ili utm_country): Veljko ga je 25.11. dodao u Meta ads.
-- Ide u lp_leads uz ostale utm_* kolone, a odatle u Airtable „Protokol prijave“ > „Zemlja“.
-- PUSTITI PRE deploya koda koji je upisuje, inače insert prijave pada na nepoznatoj koloni.
alter table public.lp_leads add column if not exists utm_country text;
