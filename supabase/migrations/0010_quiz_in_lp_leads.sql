-- Kviz sa ostavljenim telefonom postaje i prijava u lp_leads (experiment = 'kviz-jetra'),
-- pa za njega važe isti hot lead alarm (5 min bez termina), Cal.com webhook i Airtable red
-- u „Protokol prijave“ kao za prijavu sa programske stranice.
-- Ocena, rezultat i odgovori stoje uz prijavu da bi alarm i poruka o zakazanom pozivu
-- mogli da ih pokažu Olgici (samo kad je QUIZ_DETAILS uključen).
-- Pokreni jednom u Supabase SQL Editoru (posle 0009_quiz_lead_phone.sql).

alter table public.lp_leads add column if not exists quiz_score   integer;
alter table public.lp_leads add column if not exists quiz_rating  integer;  -- 0–100, 100 = najgore
alter table public.lp_leads add column if not exists quiz_result  text;     -- likely / ok / doctor / pregnant
alter table public.lp_leads add column if not exists quiz_answers jsonb;    -- čitljivi odgovori, kao quiz_leads.answers_readable
