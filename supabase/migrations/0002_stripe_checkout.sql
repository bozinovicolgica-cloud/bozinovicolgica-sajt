-- Stripe Checkout umesto uplate na račun + forma u koracima.
-- Red u `orders` nastaje već posle 1. koraka forme (status 'started'), pa se vide i kupci koji nisu završili.
-- Tok statusa: started -> checkout (otišao na Stripe) -> paid -> delivered
--              checkout -> expired (Stripe sesija istekla bez plaćanja, posle 24 h) / failed

alter table public.orders alter column phone drop not null;
alter table public.orders alter column consent_at drop not null;
alter table public.orders alter column status set default 'started';

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('started', 'checkout', 'paid', 'delivered', 'expired', 'failed', 'cancelled', 'refunded', 'pending'));

alter table public.orders
  add column if not exists step                  int,
  add column if not exists start_when            text,           -- kada planira da počne
  add column if not exists checkout_at           timestamptz,
  add column if not exists stripe_session_id     text unique,
  add column if not exists stripe_payment_intent text,
  add column if not exists stripe_customer       text,
  add column if not exists amount_paid           numeric(10, 2),
  add column if not exists currency              text;

create index if not exists orders_stripe_session_idx on public.orders (stripe_session_id);
