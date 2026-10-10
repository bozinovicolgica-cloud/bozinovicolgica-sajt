# 9 dana spašavanja jetre — Next.js

Landing stranica za Olgicu Božinović, prebačena iz statičnog HTML dizajna u Next.js 16 (App Router, TypeScript).
Desktop (≥1081px) je 1:1 sa originalnim dizajnom; tablet i mobilni imaju posebne rasporede (breakpointi 1180 / 1080 / 860 / 640 / 380).

## Pokretanje

```powershell
npm install
copy .env.example .env.local   # pa popuni vrednosti
npm run dev                     # http://localhost:3000
npm run build; npm start        # produkcija
```

Deploy: Vercel → Import projekta → u Settings → Environment Variables unesi sve iz `.env.example`.

## Šta radi

| Deo | Kako |
|---|---|
| Dugmad „Započni 9-dnevni protokol“ | Otvaraju formu za porudžbinu (ime, email, telefon, Srbija/inostranstvo, napomena, saglasnost). Dugmad u meniju i hero sekciji vode na sekciju sa cenom, kao u originalu. |
| Posle porudžbine | Kupac odmah vidi podatke za uplatu + poziv na broj + **IPS QR kod** (skeniranje u aplikaciji banke), dobija isti email, Olgica dobija obaveštenje. |
| Kviz o jetri | Sva pitanja i bodovanje iz originala. Pre rezultata je opcioni korak „Gde da ti pošaljem rezultat?“ (ime + email + saglasnost). Odgovori se čuvaju i kad se korak preskoči (bez ličnih podataka). Dugme iz rezultata otvara formu za porudžbinu i prenosi rezultat kviza. |
| Supabase | Tabele `orders` i `quiz_leads` → pokreni `supabase/migrations/0001_jetra_landing.sql`. RLS uključen bez javnih polisa; upis samo preko server rute sa service_role ključem. Status porudžbine menjaš u Table editoru (`pending` → `paid` → `delivered`), datumi se upisuju sami. |
| Email | Resend.com (`RESEND_API_KEY`, `EMAIL_FROM` sa verifikovanim domenom). |
| Webhook | `ORDER_WEBHOOK_URL` / `QUIZ_WEBHOOK_URL` – JSON za n8n, Make, Airtable ili CRM; header `X-Webhook-Secret`. |
| Analitika | `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`. Događaji: `order_form_open` (Meta: InitiateCheckout), `order_submit` (Lead), `liver_quiz_open/start/lead/complete/cta`, `video_play`. UTM parametri se pamte i upisuju uz porudžbinu. |
| Slike | Sve slike i logo idu sa Cloudinary-ja (`lib/images.ts`, cloud `ozdkiori`). Fotografije (hero, o meni, završna) Cloudinary smanjuje po ekranu i šalje kao AVIF/WebP, kvalitet 90 (`lib/cloudinary-loader.ts`). Screenshotovi poruka idu kao originali, bez kompresije. Slika za deljenje na mrežama je 1200×630 isečena oko lica. Kopije su i u `public/images` (`NEXT_PUBLIC_IMAGES=local`). Kad zameniš sliku na Cloudinary-ju, promeni broj verzije (`v…`) u `lib/images.ts`. |
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
- Podaci za uplatu u `.env` (račun, `PRICE_RSD`, IBAN/SWIFT)
