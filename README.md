# 9 dana spašavanja jetre — Next.js

Landing stranica za Olgicu Božinović, prebačena iz statičnog HTML dizajna u Next.js 16 (App Router, TypeScript).
Desktop (≥1081px) je 1:1 sa originalnim dizajnom; tablet i mobilni imaju posebne rasporede (breakpointi 1180 / 1080 / 860 / 640 / 380).

## Pokretanje (PowerShell)

```powershell
npm install
Copy-Item .env.example .env.local   # pa popuni vrednosti
npm run dev                         # http://localhost:3000
npm run typecheck                   # provera tipova
npm run build; npm start            # produkcija
```

Potreban je Node 20.9+ (preporučeno 22, vidi `.nvmrc`).

## GitHub + Vercel

```powershell
git remote add origin https://github.com/<korisnik>/<repo>.git
git push -u origin main
```

- `.env.local` se nikad ne šalje na GitHub (zaštićeno u `.gitignore`); tajni ključevi idu samo u Vercel → Settings → Environment Variables.
- GitHub Actions (`.github/workflows/ci.yml`) na svaki push proverava tipove i radi build.
- Vercel: New Project → Import repo → Framework se prepoznaje sam → unesi env promenljive → Deploy. Svaki push na `main` automatski ide u produkciju.

## Šta radi

| Deo | Kako |
|---|---|
| Dugmad „Započni 9-dnevni protokol“ | Otvaraju formu u 3 koraka: (1) ime + email, (2) telefon, kada počinje, lekovi/dijagnoze, (3) pregled + saglasnost → **Stripe Checkout** (kartica). Posle svakog koraka podaci se čuvaju (`/api/order`), pa se vide i kupci koji nisu stigli do plaćanja. Nacrt forme ostaje u browseru ako se kupac vrati sa Stripe-a. |
| Plaćanje | `/api/checkout` pravi Stripe Checkout sesiju (cena `STRIPE_PRICE_ID`, firma OB METHOD PUT ZDRAVLJA LLC). `/api/stripe/webhook` na uspešno plaćanje upisuje `paid`, šalje kupcu potvrdu i Olgici obaveštenje (`OWNER_EMAIL`), isteklu sesiju (24 h) beleži kao `expired`. Kupac se vraća na `/hvala` (beleži Purchase za Meta/GTM). |
| Kviz o jetri | Sva pitanja i bodovanje iz originala. Pre rezultata je opcioni korak „Gde da ti pošaljem rezultat?“ (ime + email + saglasnost). Odgovori se čuvaju i kad se korak preskoči (bez ličnih podataka). Dugme iz rezultata otvara formu za porudžbinu i prenosi rezultat kviza. |
| Supabase | Tabele `orders` i `quiz_leads` → pokreni `supabase/migrations/0001_jetra_landing.sql`. Pokreni i `0002_stripe_checkout.sql`. RLS uključen bez javnih polisa; upis samo preko server rute sa service_role ključem. Statusi: `started` (popunio 1. korak) → `checkout` (otišao na Stripe) → `paid` (webhook) → `delivered` (menjaš ručno kad pošalješ materijale); `expired` = napustio plaćanje. |
| Email | Resend.com (`RESEND_API_KEY`, `EMAIL_FROM` sa verifikovanim domenom). |
| Webhook | `ORDER_WEBHOOK_URL` / `QUIZ_WEBHOOK_URL` – JSON za n8n, Make, Airtable ili CRM; header `X-Webhook-Secret`. Porudžbine šalju polje `event`: `order.started`, `order.updated`, `checkout.started`, `order.paid`, `checkout.expired`, `payment.failed` (ključ reda je `id`). |
| Analitika | `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`. Događaji: `order_form_open` (Meta: InitiateCheckout), `order_step` 1 (Lead) i 2, `begin_checkout`, `purchase` na `/hvala` (Meta: Purchase), `liver_quiz_open/start/lead/complete/cta`, `video_play`. UTM parametri se pamte i upisuju uz porudžbinu. |
| Slike | Sve slike i logo idu sa Cloudinary-ja (`lib/images.ts`, cloud `ozdkiori`). Fotografije (hero, o meni, završna) Cloudinary smanjuje po ekranu i šalje kao AVIF/WebP, kvalitet 90 (`lib/cloudinary-loader.ts`). Screenshotovi poruka idu kao originali, bez kompresije. Slika za deljenje na mrežama je 1200×630 isečena oko lica. Kopije su i u `public/images` (`NEXT_PUBLIC_IMAGES=local`). Kad zameniš sliku na Cloudinary-ju, promeni broj verzije (`v…`) u `lib/images.ts`. |
| Blog | Tekstovi su Markdown fajlovi u `content/blog/<slug>.md` (zaglavlje: naslov, opis, datumi, slika) i prikazuju se na `/blog/<slug>`. Novi tekst = novi `.md` fajl + slika u `public/images/blog/`; sitemap, llms.txt i schema se ažuriraju sami. |
| AEO / SEO | Povezan schema.org graf (`lib/schema.ts`): Organization, WebSite, Person (Olgica, sa obrazovanjem i mrežama), Product, FAQPage, BlogPosting, ProfilePage, BreadcrumbList. `/llms.txt` je sažetak sajta za AI asistente. Podaci o Olgici i mrežama su u `lib/site.ts`. |
| Stari WordPress | Arhiviran u `archive/wordpress` (ne ide na Vercel, vidi `.vercelignore`). Svi stari URL-ovi se preusmeravaju u `next.config.mjs` → `redirects()`. |
| Video | `NEXT_PUBLIC_VIDEO_SRC` = .mp4, YouTube ili Vimeo link; `NEXT_PUBLIC_VIDEO_POSTER` = slika pre puštanja. |

Ako nijedna integracija (Supabase, webhook, email Olgici) nije podešena, porudžbina u produkciji vraća grešku umesto da se tiho izgubi.

## Gde se menja sadržaj

- Sav tekst stranice: `lib/content.ts`
- Kviz (pitanja, poeni, tekstovi): `lib/quiz-data.ts`
- Stilovi: `app/globals.css` (desktop gore, responsive na dnu), `app/quiz.css`, `app/order.css`
- Pravne stranice: `app/uslovi-kupovine`, `app/politika-privatnosti`

## Pre objave – za popunjavanje

- `[Rok, npr. isti dan]` u koraku 2 timeline-a (`lib/content.ts` → `steps`)
- `[Garancija, ako postoji]` u kartici sa cenom (`lib/content.ts` → `included`)
- Poster za video: `[Poster: kadar iz videa...]` nestaje kad se postavi `NEXT_PUBLIC_VIDEO_POSTER`
- Podaci u `[zagradama]` na stranicama Uslovi kupovine i Politika privatnosti (firma, PIB, rokovi) – proveriti sa pravnikom
- Stripe ključevi u Vercel env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (vidi `.env.example`)
- Adresa i EIN firme na stranicama Uslovi kupovine i Politika privatnosti
