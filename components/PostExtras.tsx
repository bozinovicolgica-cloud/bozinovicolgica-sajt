import Link from 'next/link';
import { person } from '@/lib/site';
import { PRODUCT_NAME } from '@/lib/content';
import { Pill } from './ui';

export function AuthorBox() {
  return (
    <aside className="author" aria-label="O autorki">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="author__img" src={person.photo} alt={person.name} width={72} height={72} loading="lazy" />
      <div>
        <p className="author__name">{person.name}</p>
        <p className="author__role">{person.jobTitle}, inženjer biotehnologije, sertifikovani coach</p>
        <Link href="/o-meni" className="author__link">Više o meni</Link>
      </div>
    </aside>
  );
}

export function HealthNote() {
  return (
    <p className="note">
      Tekst je edukativnog karaktera i ne predstavlja medicinski savet, dijagnozu ni lečenje. Ako piješ lekove, trudna si, dojiš ili imaš dijagnostikovano oboljenje, pre bilo kakve promene ishrane ili suplementacije razgovaraj sa svojim lekarom.
    </p>
  );
}

export function ProtocolCta() {
  return (
    <section className="cta" aria-labelledby="cta-h">
      <h2 className="cta__h" id="cta-h">{PRODUCT_NAME}</h2>
      <p className="cta__p">Pojednostavljeni protokol čišćenja jetre: za svaki od 9 dana dobijaš plan ishrane, spisak za kupovinu, recepte i video lekciju, uz podršku na WhatsApp-u.</p>
      <div className="cta__row">
        <Pill href="/#cena" light>Pogledaj protokol</Pill>
        <a href="/#kviz" className="cta__link">Proveri da li je za tebe</a>
      </div>
    </section>
  );
}
