-- „Hot lead nije zakazao poziv“: provera svake minute umesto na 5 minuta.
-- Uz LEAD_FOLLOWUP_MINUTES=5 Olgica dobija Telegram 5-6 minuta posle prijave (kad se otvori kalendar),
-- umesto 15-20 minuta kao do sada.
-- Pokreni jednom u Supabase SQL Editoru. cron.schedule sa istim imenom zamenjuje postojeći posao.

select cron.schedule(
  'protokol-followup',
  '* * * * *',
  $$ select net.http_post(
       url := 'https://protokol.bozinovicolgica.rs/api/lp/followup',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);

-- Provera: treba da vrati jedan red sa schedule = '* * * * *'
-- select jobid, jobname, schedule, active from cron.job where jobname = 'protokol-followup';
-- Poslednja izvršavanja (status 'succeeded'):
-- select status, start_time from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'protokol-followup')
--   order by start_time desc limit 5;
