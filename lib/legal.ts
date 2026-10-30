/**
 * Pravni tekstovi koji se ponavljaju na sajtu (footer, checkout, forme, kviz).
 * Izvor: dokument „Olgica: compliance i disklejmeri“ (15. 10. 2026), sekcija „Gotovi tekstovi“.
 * Stavke u [uglastim zagradama] čekaju prave podatke.
 */
import { COMPANY, EMAIL, SITE } from './site';

/** Datum poslednje izmene pravnih stranica. */
export const LEGAL_UPDATED = '29. 10. 2026.';

export const LINKS = {
  terms: `${SITE}/uslovi-kupovine`,
  privacy: `${SITE}/politika-privatnosti`,
  cookies: `${SITE}/politika-kolacica`,
  withdrawal: `${SITE}/odustanak`,
};

/** Kratka verzija, u footeru svake stranice. */
export const FOOTER_DISCLAIMER =
  'Sadržaj ovog sajta i programi Olgice Božinović su edukativnog karaktera i ne predstavljaju medicinski savet, dijagnozu ni lečenje. Pre promene ishrane ili uvođenja suplemenata posavetujte se sa svojim lekarom.';

/** Pun zdravstveni disklejmer (Uslovi korišćenja). */
export const HEALTH_DISCLAIMER =
  'Olgica Božinović nije lekar. Programi, protokoli i konsultacije služe za vođenje kroz promenu ishrane i navika i ne zamenjuju pregled, dijagnozu ni terapiju koju određuje lekar. Olgica ne postavlja dijagnoze i ne propisuje lekove. Ne prekidajte i ne menjajte terapiju bez dogovora sa lekarom. Ako imate hroničnu bolest, uzimate lekove, trudni ste ili dojite, obavestite o tome Olgicu i svog lekara pre početka programa. Rezultati se razlikuju od osobe do osobe i nisu zagarantovani. Ako se simptomi pogoršaju, odmah se obratite lekaru.';

/** Ispod dugmeta za kupovinu na landing stranicama. */
export const BUY_NOTE =
  'Program je podrška kroz ishranu i navike, ne medicinski tretman. Rezultati nisu zagarantovani i razlikuju se od osobe do osobe.';

/** Uz utiske klijenata. */
export const TESTIMONIAL_NOTE =
  'Utisci su stvarni, objavljeni anonimno uz pristanak klijenata. Opisuju lično iskustvo i nisu garancija istog rezultata.';

/** Uz rezultat kviza. */
export const QUIZ_NOTE =
  'Ovaj kviz nije dijagnoza. Pokazuje samo koliko znakova preopterećenja prepoznajete kod sebe. Za procenu zdravstvenog stanja obratite se lekaru.';

/** Checkout: obavezan čekboks za odustanak (Jetra i Protokol ishrane). */
export const WAIVER_TEXT =
  'Tražim da program počne odmah, pre isteka roka od 14 dana za odustanak. Znam da gubim pravo na odustanak kada program bude u potpunosti izvršen.';
/** Verzija teksta koja se čuva uz porudžbinu, kao dokaz šta je kupac štiklirao. */
export const WAIVER_VERSION = 'odustanak-v1-2026-10-29';

/** Mentorski program: obavezan čekboks (kad se bude prodavao preko sajta). */
export const WAIVER_MENTOR_TEXT =
  'Tražim da mentorski program počne odmah. Znam da u slučaju odustanka u roku od 14 dana plaćam srazmerni deo za usluge koje sam već dobio/la. Upoznat/a sam da je program ugovoren na 3 meseca, a da se cena plaća u 3 mesečne rate.';

/** Pristanak za podatke o zdravlju (obavezan u svakom upitniku). */
export const HEALTH_CONSENT_TEXT = `Izričito pristajem da Olgica Božinović i ${COMPANY.name} obrađuju podatke o mom zdravlju iz ovog upitnika radi pripreme i praćenja mog programa. Odgovore vidi samo Olgica [i tim podrške]. Pristanak mogu da povučem u svakom trenutku na ${EMAIL}.`;

/** Upitnik za dete: dodatni čekboks. */
export const KID_CONSENT_TEXT =
  'Ja sam roditelj ili zakonski zastupnik deteta čije podatke unosim i dajem pristanak u njegovo ime. Znam da program ne zamenjuje pregled kod pedijatra i da ću se kod temperature duže od 3 dana, otežanog disanja ili gutanja odmah obratiti lekaru.';

/** Alati van Srbije koji vide podatke (Politika privatnosti). */
export const US_TOOLS = 'Stripe, Vercel, Supabase, Resend, Airtable, Meta i Google';
