import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { PRICE_EUR, PRODUCT_NAME } from '@/lib/content';

export const metadata: Metadata = { title: 'Uslovi kupovine | Olgica Božinović', alternates: { canonical: '/uslovi-kupovine' } };

export default function Page() {
  return (
    <LegalPage title="Uslovi kupovine" updated="[datum]">
      <p>Ovi uslovi važe za kupovinu digitalnog programa „{PRODUCT_NAME}“ preko ove stranice. Prodavac je [naziv firme / preduzetnika], [adresa], PIB [PIB], matični broj [MB], email [email] (u daljem tekstu: prodavac).</p>
      <h2>Proizvod</h2>
      <p>„{PRODUCT_NAME}“ je digitalni program koji sadrži plan ishrane za 9 dana, spisak za kupovinu, recepte, video lekcije i podršku putem WhatsApp-a tokom trajanja programa. Program je informativnog karaktera i ne zamenjuje savet lekara, dijagnozu ni lečenje.</p>
      <h2>Cena i plaćanje</h2>
      <p>Cena programa je {PRICE_EUR} EUR (za uplate iz Srbije u dinarskoj protivvrednosti navedenoj u podacima za uplatu). Plaćanje se vrši uplatom na račun prodavca, po podacima koje kupac dobija odmah nakon slanja porudžbine i na email. Prilikom uplate obavezno je navesti poziv na broj iz porudžbine.</p>
      <h2>Isporuka</h2>
      <p>Materijali se šalju na email adresu navedenu u porudžbini [rok, npr. u roku od 24 časa] od evidentiranja uplate. Ako materijali ne stignu, proveri spam folder ili se javi na [email].</p>
      <h2>Odustanak od ugovora</h2>
      <p>[Uslovi odustanka i povraćaja novca. Napomena: kod digitalnog sadržaja, pravo na odustanak se po Zakonu o zaštiti potrošača gubi kada isporuka počne uz izričitu saglasnost kupca. Uskladiti sa pravnikom.]</p>
      <h2>Garancija</h2>
      <p>[Garancija, ako postoji.]</p>
      <h2>Zdravstvena napomena</h2>
      <p>Program nije namenjen trudnicama i dojiljama. Ako piješ lekove ili imaš dijagnostikovano oboljenje, pre početka razgovaraj sa svojim lekarom. Rezultati se razlikuju od osobe do osobe.</p>
      <h2>Reklamacije i kontakt</h2>
      <p>Reklamacije i pitanja šalji na [email]. Odgovor stiže najkasnije u roku od 8 dana.</p>
    </LegalPage>
  );
}
