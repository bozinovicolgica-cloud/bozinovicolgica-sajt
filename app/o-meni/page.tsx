import type { Metadata } from 'next';
import SubPage from '@/components/SubPage';
import { ProtocolCta } from '@/components/PostExtras';
import { breadcrumbs, graph, jsonLd, organization, personNode, website } from '@/lib/schema';
import { EMAIL, ID, SITE, SOCIAL, person } from '@/lib/site';

const DESC = 'Olgica Božinović, inženjer biotehnologije, savetnica za ishranu i suplementaciju i sertifikovani coach. Obrazovanje, iskustvo i kontakt.';

export const metadata: Metadata = {
  title: 'O meni | Olgica Božinović, savetnica za ishranu',
  description: DESC,
  alternates: { canonical: '/o-meni' },
  openGraph: { type: 'profile', locale: 'sr_RS', siteName: 'Olgica Božinović', title: 'Olgica Božinović', description: DESC, images: [{ url: person.photo, alt: person.name }] },
};

export default function Page() {
  const ld = graph(
    {
      '@type': 'ProfilePage',
      '@id': `${SITE}/o-meni#stranica`,
      url: `${SITE}/o-meni`,
      name: 'O meni',
      inLanguage: 'sr',
      isPartOf: { '@id': ID.website },
      mainEntity: { '@id': ID.person },
    },
    breadcrumbs([['Početna', '/'], ['O meni', '/o-meni']]),
    personNode(),
    organization(),
    website(),
  );
  return (
    <SubPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <main className="sec legal">
        <article className="container legal__wrap">
          <p className="eyebrow">O meni</p>
          <h1 className="h2" style={{ marginTop: 12 }}>Olgica Božinović</h1>
          <p className="legal__updated">{person.jobTitle} · inženjer biotehnologije · sertifikovani coach</p>
          <p className="post__lead">
            Moja misija je da pomognem što većem broju ljudi da se izvuče iz kandži bolesti. Uvođenjem zdravije ishrane, sa opštim preporukama zdravlja, vodim te putem isceljenja.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="post__img" src={person.photo} alt="Olgica Božinović" width={1100} height={1650} />
          <div className="legal__body">
            <h2>Kako sam počela</h2>
            <p>Godinama sam se borila sa vrtoglavicom i lošim varenjem. Niko mi nije rekao da u pozadini može da stoji troma jetra. Kada sam počela da čistim telo od teških metala i da jačam imunitet, telo je počelo da sarađuje. Tada sam odlučila da pomažem ljudima koji se bore sa sličnim simptomima.</p>

            <h2>Obrazovanje</h2>
            <ul>
              <li>Završila sam <strong>Tehnološki fakultet u Beogradu</strong> (inženjer biotehnologije) i oduvek gajila naklonost ka biotehnologiji i zaštiti životne sredine.</li>
              <li>Imam i znanje iz farmacije, jer sam pohađala <strong>srednju farmaceutsku školu</strong>.</li>
              <li>Da bih usavršila komunikaciju sa klijentima, 2022. godine sam završila <strong>Coaching akademiju</strong>.</li>
              <li>Na <strong>DIF-u u Novom Sadu</strong> pohađam edukaciju za ishranu i suplementaciju sportista.</li>
            </ul>

            <h2>Sa kim radim</h2>
            <p>Iza sebe imam nekoliko stotina klijenata. Moje programe pohađaju ljudi sa hroničnim tegobama, kao i zdravi ljudi koji žele da ishranom i zdravim stilom života preveniraju bolesti.</p>
            <ul>
              <li>Škole i vrtići me pozivaju da držim predavanja roditeljima i deci o značaju ishrane za razvoj dece i omladine.</li>
              <li>Odazivam se pozivima sportskih klubova, gde govorim o ishrani sportista.</li>
              <li>Držim korporativna predavanja o zdravoj hrani.</li>
              <li>Na radionicama pripreme zdrave hrane učim mlade majke kako da pripreme zdrave užine i obroke svojoj deci.</li>
            </ul>

            <h2 id="kontakt">Kontakt</h2>
            <ul className="bio__facts">
              <li>Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
              <li>Instagram: <a href={SOCIAL.instagram} rel="me">@bozinovic.olgica</a></li>
              <li>TikTok: <a href={SOCIAL.tiktok} rel="me">@bozinovic.olgica</a></li>
              <li>YouTube: <a href={SOCIAL.youtube} rel="me">@bozinovic.olgica</a></li>
              <li>Facebook: <a href={SOCIAL.facebook} rel="me">Olgica Božinović</a></li>
            </ul>
          </div>
          <ProtocolCta />
        </article>
      </main>
    </SubPage>
  );
}
