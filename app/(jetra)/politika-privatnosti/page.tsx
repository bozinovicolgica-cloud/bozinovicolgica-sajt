import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';
import { LEGAL_UPDATED } from '@/lib/legal';
import { COMPANY } from '@/lib/site';

export const metadata: Metadata = { title: 'Politika privatnosti | Olgica Božinović', alternates: { canonical: '/politika-privatnosti' } };

const mail = <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>;

export default function Page() {
  return (
    <LegalPage title="Politika privatnosti" updated={LEGAL_UPDATED}>
      <p>Ova politika važi za sajtove bozinovicolgica.rs (uključujući program. i protokol. poddomen), za upitnike i za komunikaciju sa Olgicom Božinović. Podatke obrađujemo u skladu sa Zakonom o zaštiti podataka o ličnosti Republike Srbije (ZZPL).</p>

      <h2>Ko je rukovalac</h2>
      <p>Rukovalac je {COMPANY.name}, {COMPANY.addressLine}, email {mail}. Programe vodi Olgica Božinović u ime rukovaoca.</p>
      <p>Predstavnik rukovaoca u Srbiji (čl. 44 ZZPL): {COMPANY.representative}. Predstavniku možeš da se obratiš za sva pitanja o tvojim podacima, a on komunicira i sa Poverenikom. Odgovornost za podatke ostaje na rukovaocu.</p>

      <h2>Koje podatke prikupljamo i zašto</h2>
      <ul>
        <li><b>Porudžbina:</b> ime i prezime, email, broj telefona i kada planiraš da počneš. Podatke čuvamo već dok popunjavaš formu (posle svakog koraka), da bismo mogli da ti se javimo ako zapneš pre plaćanja. Svrha: obrada porudžbine, slanje materijala i podrška tokom programa. Osnov: izvršenje ugovora i radnje pre zaključenja ugovora.</li>
        <li><b>Napomena o lekovima i dijagnozi:</b> podatak o zdravlju. Čuvamo je samo ako je upišeš i posebnim čekboksom izričito pristaneš, da bismo program prilagodili tebi. Osnov: tvoj izričit pristanak.</li>
        <li><b>Dokaz o kupovini:</b> datum i vreme kupovine, potvrda da si tražila da program počne odmah (čekboks za odustanak) i datumi kada su stigli prvi i poslednji video. Osnov: zakonska obaveza i zaštita naših prava.</li>
        <li><b>Plaćanje:</b> obrađuje ga Stripe. Podatke o kartici unosiš direktno kod Stripe-a; mi ih ne vidimo. Od Stripe-a dobijamo potvrdu plaćanja, iznos, email i ime sa kartice.</li>
        <li><b>Kviz o jetri:</b> odgovori su podaci o zdravlju. Bez imena i emaila čuvamo ih anonimno, za statistiku. Ime i email čuvamo uz odgovore samo ako ih ostaviš i štikliraš izričit pristanak; tada ti šaljemo rezultat i savete za ishranu na email. Rezultat kviza se računa automatski, ali nije dijagnoza i nema nikakve posledice po tebe.</li>
        <li><b>Prijava za Protokol ishrane:</b> za koga je protokol, tegobe koje izabereš, koje nalaze imaš, ime, telefon i email. Posle prijave na online pozivu i u porukama šalješ nalaze, izveštaj lekara i terapiju. Osnov: tvoj izričit pristanak za podatke o zdravlju.</li>
        <li><b>Podaci o detetu:</b> unosi ih samo roditelj ili zakonski zastupnik, uz izričit pristanak u ime deteta.</li>
        <li><b>Poruke:</b> email, WhatsApp, Viber i Instagram poruke koje nam pošalješ. Svrha: podrška i odgovor na pitanja.</li>
        <li><b>Utisci:</b> objavljujemo ih anonimno (npr. „M., 42“), bez imena i fotografije, samo uz tvoj poseban pristanak, koji možeš da povučeš u svakom trenutku.</li>
        <li><b>Analitika i oglašavanje:</b> Google Analytics / Google Tag Manager, DataFast i Meta Pixel, samo ako u baneru klikneš „Prihvati“. Ne šaljemo im odgovore iz kviza ni upitnika. Više u <Link href="/politika-kolacica">Politici kolačića</Link>.</li>
      </ul>

      <h2>Ko još vidi podatke</h2>
      <p>Odgovore iz upitnika vidi samo Olgica [i tim podrške: navesti ko]. Za rad koristimo ove pružaoce usluga (obrađivače), sa kojima imamo ugovore o obradi podataka:</p>
      <ul>
        <li>Vercel (hosting sajta, SAD)</li>
        <li>Supabase (baza porudžbina i prijava, [region])</li>
        <li>Stripe (plaćanje, SAD i Irska)</li>
        <li>Resend (slanje emailova, SAD; slanje iz EU)</li>
        <li>Airtable (evidencija klijenata, SAD): samo ime, kontakt i status porudžbine, bez podataka o zdravlju</li>
        <li>Meta (Meta Pixel uz pristanak; WhatsApp i Instagram poruke) i Google (analitika uz pristanak)</li>
        <li>DataFast (analitika poseta, uz pristanak)</li>
        <li>[Tally, ManyChat i alat za newsletter, ako se koriste: navesti šta tačno vide]</li>
      </ul>
      <p>Podatke ne prodajemo i ne ustupamo trećim licima u druge svrhe.</p>

      <h2>Prenos podataka u SAD</h2>
      <p>Deo navedenih pružalaca usluga čuva podatke u SAD. SAD nisu na listi država sa primerenim nivoom zaštite podataka, pa nivo zaštite tamo nije isti kao u Srbiji. Prenos zasnivamo na standardnim ugovornim klauzulama koje je usvojio Poverenik, odnosno ugovorima o obradi koji ih sadrže [proveriti za svakog pružaoca], a gde to nije moguće, na tvom izričitom pristanku. Podatke o zdravlju držimo u što manje alata.</p>

      <h2>Automatizovani asistent</h2>
      <p>U porukama i podršci ponekad odgovara Olgičin automatizovani asistent, i to se jasno kaže u prvoj poruci. Asistent ne daje medicinske savete: pitanja o simptomima, lekovima ili pogoršanju prosleđuje Olgici.</p>

      <h2>Koliko dugo čuvamo podatke</h2>
      <ul>
        <li>Porudžbine i dokaz o kupovini: koliko propisi o računovodstvu i porezima zahtevaju [rok].</li>
        <li>Podaci o zdravlju iz upitnika i napomena o lekovima: brišemo ih 12 meseci posle kraja programa, osim ako zatražiš da ih čuvamo duže ili da ih obrišemo ranije.</li>
        <li>Prijava za Protokol ishrane koja ne postane saradnja: 12 meseci od prijave.</li>
        <li>Kviz uz email: dok ne povučeš pristanak, a najduže [rok]. Anonimni odgovori iz kviza: [rok].</li>
        <li>Kolačići: rokovi su u <Link href="/politika-kolacica">Politici kolačića</Link>.</li>
      </ul>

      <h2>Tvoja prava</h2>
      <p>Imaš pravo na uvid u svoje podatke, ispravku, brisanje, ograničenje obrade, prenosivost i prigovor. Pristanak možeš da povučeš u svakom trenutku; to ne utiče na obradu pre povlačenja. Za sve to piši na {mail} ili odgovori „odjava“ na bilo koji naš email. Odgovaramo najkasnije u roku od 30 dana.</p>
      <p>Ako misliš da podatke obrađujemo protivno zakonu, možeš da podneseš pritužbu Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti, Bulevar kralja Aleksandra 15, 11120 Beograd, <a href="https://www.poverenik.rs" target="_blank" rel="noopener">www.poverenik.rs</a>.</p>
    </LegalPage>
  );
}
