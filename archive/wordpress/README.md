# Arhiva starog WordPress sajta (bozinovicolgica.rs)

Snimljeno **13. 10. 2026**, pre nego što je Next.js sajt zamenio WordPress na domenu. Služi samo za pregled; sajt ovo ne koristi.

| Folder | Šta je unutra |
|---|---|
| `content/` | Svaki tekst, stranica, proizvod, kurs i usluga kao Markdown (`.md`, sa naslovom, URL-om i datumima) + originalni HTML iz WordPress-a (`.html`). Slike u `.md` pokazuju na `media/`. |
| `html/` | Ceo HTML svake javne stranice onako kako ju je WordPress prikazivao (bez CSS/JS fajlova). Putanja = stari URL, npr. `html/o-meni/index.html`. |
| `media/` | Svi fajlovi iz WordPress biblioteke (slike, PDF-ovi protokola i jelovnika, font), po strukturi `godina/mesec/` kao u `wp-content/uploads`. |
| `api/` | Sirovi JSON iz WordPress REST API-ja (posts, pages, media, proizvodi, kursevi, usluge, kategorije, WooCommerce cene). |
| `urls.tsv` | Svi URL-ovi iz starog sitemap-a: status, preusmerenje i naslov. |

Šta nije snimljeno: sadržaj lekcija iz kurseva (Tutor LMS) vidljiv samo ulogovanim korisnicima, porudžbine, kupci i korisnici (traže admin pristup), podešavanja tema i plugin-a.

Šta je preneto na novi sajt: tekstovi sa bloga (`content/blog/`, osim „Lekovitost lista maline“), biografija na `/o-meni`. Svi stari URL-ovi se preusmeravaju (301/308) na nove stranice, vidi `redirects()` u `next.config.mjs`.
