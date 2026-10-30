import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';
import { PRICE_EUR, PRICE_RSD, PRODUCT_NAME, rsd } from '@/lib/content';
import { HEALTH_DISCLAIMER, LEGAL_UPDATED, WAIVER_MENTOR_TEXT, WAIVER_TEXT } from '@/lib/legal';
import { pricing } from '@/lib/protokol/content';
import { COMPANY } from '@/lib/site';

export const metadata: Metadata = { title: 'Uslovi korišćenja i kupovine | Olgica Božinović', alternates: { canonical: '/uslovi-kupovine' } };

const mail = <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>;

// Primer srazmernog povraćaja za jetru: 9 dana, zadržava se deo za dane koji su već dobijeni.
const perDay = PRICE_EUR / 9;
const refundAfter = (days: number) => Math.round(PRICE_EUR - perDay * days);

export default function Page() {
  return (
    <LegalPage title="Uslovi korišćenja i kupovine" updated={LEGAL_UPDATED}>
      <p>Ovi uslovi važe za korišćenje sajtova bozinovicolgica.rs (uključujući program. i protokol. poddomen) i za kupovinu programa Olgice Božinović. Kupovinom kupac potvrđuje da je uslove pročitao i da ih prihvata.</p>

      <h2>Prodavac</h2>
      <ul>
        <li>Naziv: {COMPANY.name}</li>
        <li>Sedište: {COMPANY.addressLine}</li>
        <li>Registar: {COMPANY.registry}, registracioni broj {COMPANY.registrationNumber}</li>
        <li>Email: {mail}, telefon: {COMPANY.phone}</li>
      </ul>
      <p>Programe vodi Olgica Božinović u ime prodavca. Prodavac izdaje račun i naplaćuje preko servisa Stripe. Prodavac nije upisan u registre u Srbiji, pa nema srpski matični broj ni PIB.</p>

      <h2>Programi</h2>
      <p><b>„{PRODUCT_NAME}“</b> je program ishrane i navika koji traje 9 dana. Uključuje plan ishrane za svih 9 dana sa spiskom za kupovinu, recepte, kratku video lekciju za svaki dan, pristup Viber grupi i podršku na WhatsApp-u tokom programa. Cena je {rsd(PRICE_RSD)} ({PRICE_EUR} EUR), jednokratno.</p>
      <p><b>Protokol ishrane</b> je individualni program ishrane i navika. Uključuje online poziv, plan ishrane po obrocima napravljen na osnovu nalaza i terapije koje kupac pošalje, plan suplementacije, biljne tinkture, preporuke za kozmetiku, posuđe i limfu i dva meseca praćenja na WhatsApp-u. Cena je {pricing.priceRsd} RSD ({pricing.price} EUR). Ugovara se posle online poziva, a [način plaćanja].</p>
      <p><b>Mentorski program</b> traje 3 meseca i uključuje [šta je uključeno]. Cena je oko 211.000 RSD (1.800 EUR) i plaća se u 3 mesečne rate od oko 70.300 RSD (600 EUR). Ugovor se zaključuje na 3 meseca: rata nije pretplata koja se otkazuje, nego deo cene celog programa.</p>
      <p>Preporučujemo samo registrovane dijetetske suplemente, bez lekova na recept. [Ako Olgica dobija proviziju od nekog brenda, to se ovde navodi.]</p>

      <h2>Cena i plaćanje</h2>
      <p>Cene su istaknute u dinarima, uz iznos u evrima, sa svim troškovima prodavca. Naplata ide u evrima: iznos u dinarima je preračunat po kursu oko 117,2 dinara za evro, a banka kupca preračunava po svom kursu. Plaćanje ide platnom karticom (i drugim načinima koje Stripe ponudi na stranici za plaćanje). Podatke o kartici kupac unosi direktno kod Stripe-a; prodavac ih ne vidi i ne čuva. Ako banka kupca naplaćuje konverziju valute, taj trošak snosi kupac.</p>
      <p>Ugovor je zaključen kad je plaćanje uspelo. Kupac tada dobija potvrdu na email.</p>

      <h2>Isporuka i početak programa</h2>
      <p>Materijali se šalju na email naveden u porudžbini [rok, npr. u roku od 24 časa] od uspešnog plaćanja. Program počinje danom kada kupac dobije prvi video, a završava se posle 9. dana. Ako materijali ne stignu, kupac treba da proveri spam folder ili da se javi na {mail}.</p>

      <h2 id="odustanak">Pravo na odustanak</h2>
      <p>Kupac koji je potrošač ima pravo da odustane od ugovora u roku od 14 dana od dana zaključenja, bez navođenja razloga. Za odustanak je dovoljno da pošalje <Link href="/odustanak">obrazac za odustanak</Link> ili bilo kakvu jasnu izjavu na {mail}. Novac vraćamo u roku od 14 dana od prijema izjave, istim načinom plaćanja.</p>
      <p><b>Program koji počinje odmah.</b> Na stranici za plaćanje kupac posebnim čekboksom izričito traži da program počne pre isteka roka za odustanak i potvrđuje: „{WAIVER_TEXT}“ Zato važi sledeće:</p>
      <ul>
        <li>ako odustane pre početka programa, dobija ceo iznos;</li>
        <li>ako odustane tokom programa, plaća srazmerni deo za ono što je već dobio, a ostatak mu se vraća;</li>
        <li>kad je program u potpunosti izvršen, pravo na odustanak prestaje.</li>
      </ul>
      <p>Primer za „{PRODUCT_NAME}“ ({PRICE_EUR} EUR):</p>
      <table>
        <thead><tr><th>Kada kupac odustane</th><th>Koliko vraćamo</th></tr></thead>
        <tbody>
          <tr><td>Pre prvog dana (program nije počeo)</td><td>Ceo iznos, {PRICE_EUR} EUR</td></tr>
          <tr><td>Usred programa, npr. 4. dan</td><td>{refundAfter(4)} EUR (zadržavamo 4/9, tj. {PRICE_EUR - refundAfter(4)} EUR)</td></tr>
          <tr><td>Posle 9. dana (program završen)</td><td>Ništa, pravo na odustanak je prestalo</td></tr>
        </tbody>
      </table>
      <p>Isto važi za Protokol ishrane (srazmerno dva meseca podrške) i za video lekcije i drugi digitalni sadržaj na sajtu.</p>
      <p><b>Mentorski program.</b> Kupac pri prijavi potvrđuje: „{WAIVER_MENTOR_TEXT}“ U roku od 14 dana kupac može da odustane i plaća srazmerni deo usluga koje je već dobio. Posle tog roka važi ugovor na 3 meseca i ugovorene rate.</p>
      <p>Kao dokaz čuvamo datum i vreme kupovine, potvrdu da je čekboks štikliran i datume kada su stigli prvi i poslednji video.</p>

      <h2 id="povracaj">Povraćaj novca</h2>
      <p>Novac vraćamo istim načinom plaćanja (na karticu preko Stripe-a), najkasnije 14 dana od dana kada primimo izjavu o odustanku. Vraćamo iznos u evrima koji je naplaćen; kurs i troškove konverzije određuje banka kupca. Kupac ne plaća nikakvu naknadu za odustanak. Za reklamaciju sa umanjenjem cene vraćamo dogovoreni deo iznosa na isti način.</p>

      <h2>Reklamacije</h2>
      <p>Reklamacija je posebno pravo i ne zavisi od odustanka. Ako nešto što je obećano nije isporučeno (na primer, video za neki dan nije stigao ili podrška nije odgovarala), kupac može da traži da se to ispravi ili da se cena umanji, i posle završetka programa. Reklamaciju šalje na {mail}, a odgovor stiže najkasnije u roku od 8 dana.</p>
      <p>Ako spor ne rešimo dogovorom, kupac može da se obrati telu za vansudsko rešavanje potrošačkih sporova sa liste ministarstva nadležnog za zaštitu potrošača u Srbiji. [Merodavno pravo i nadležni sud: proveriti sa advokatom.]</p>

      <h2>Zdravstvena napomena</h2>
      <p>{HEALTH_DISCLAIMER}</p>
      <p>Programi nisu namenjeni trudnicama i dojiljama. Ako imaš bolest jetre ili žuči, dijabetes ili piješ lekove, pre kupovine se javi na {mail}: kupovinu nastavljaš tek kada Olgica potvrdi da program može da se prilagodi.</p>
      <p>Programi za decu namenjeni su roditeljima. Upitnik popunjava roditelj ili staratelj, a pedijatar treba da zna za plan. Antibiotike i drugu terapiju koju je odredio lekar program ne zamenjuje.</p>

      <h2>Korišćenje sajta i materijala</h2>
      <p>Tekstovi, video lekcije, planovi i recepti služe samo za ličnu upotrebu kupca. Nije dozvoljeno da se dele, preprodaju ili javno objavljuju bez pisane saglasnosti prodavca. Sadržaj sajta i bloga je edukativan i ne predstavlja medicinski savet.</p>

      <h2>Kontakt</h2>
      <p>Pitanja, odustanak i reklamacije: {mail}, telefon {COMPANY.phone}.</p>
    </LegalPage>
  );
}
