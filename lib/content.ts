/**
 * Sav tekst stranice na jednom mestu.
 * Stavke u [uglastim zagradama] su preuzete iz originalnog dizajna i čekaju
 * pravi sadržaj (rok isporuke, garancija...). Izmeni ih ovde i promena se
 * vidi na celom sajtu.
 */

export const PRICE_EUR = 180;
export const PRODUCT_NAME = '9 dana spašavanja jetre';

/**
 * Kružići pored „100+ zadovoljnih klijenata“ u hero sekciji (ukupno 4).
 * Svaka stavka je ili fotografija sa Cloudinary-ja (ime fajla) ili boja (placeholder).
 * Kad stignu nove slike, samo zameni boju imenom fajla.
 */
export const heroAvatars: ({ photo: string } | { color: string })[] = [
  { photo: 'testimonial_image_profile.jpg' },
  { photo: 'random-person.jpg' },
  { photo: 'pexels-photo-1181686.avif' },
  { photo: 'testimonialpic.png' },
];

export const nav = [
  { href: '#simptomi', label: 'Simptomi' },
  { href: '#resenje', label: 'Protokol' },
  { href: '#rezultati', label: 'Rezultati' },
  { href: '#o-meni', label: 'O meni' },
  { href: '#cena', label: 'Cena' },
  { href: '#pitanja', label: 'Pitanja' },
];

export type Symptom = { title: string; desc: string; d: string };

export const CHECK_PATH = 'M40,144l56,56L224,72';

export const symptoms: Symptom[] = [
  { title: 'Nadutost', desc: 'Ujutru ravan stomak, a popodne nadut, čak i kad jedeš „zdravo“.', d: 'M128,208a24,24,0,1,0,24-24H32 M96,72a24,24,0,1,1,24,24H40 M176,104a24,24,0,1,1,24,24H32' },
  { title: 'Umor posle jela', desc: 'Posle ručka te savlada umor i treba ti dremka.', d: 'M32,72H200a16,16,0,0,1,16,16v80a16,16,0,0,1-16,16H32a16,16,0,0,1-16-16V88A16,16,0,0,1,32,72Z M240,104v48 M56,104v48' },
  { title: 'Koža se buni', desc: 'Akne, perutanje, svrab ili osip koji se stalno vraćaju.', d: 'M208,144c0-72-80-128-80-128S48,72,48,144a80,80,0,0,0,160,0Z M136,184a40,40,0,0,0,32-32' },
  { title: 'Zatvor', desc: 'Danima ne ideš u toalet, a stomak je težak.', d: 'M56,32H200 M56,224H200 M72,32V72l56,56,56-56V32 M72,224V184l56-56,56,56v40' },
  { title: '„Magla“ u glavi', desc: 'Teško se fokusiraš, a do popodneva ti je glava kao u vati.', d: 'M76,136H184a40,40,0,0,0,0-80a56,56,0,0,0-104,24a28,28,0,0,0-4,56Z M56,176H200 M88,216H168' },
];

export const symptomFinal = {
  title: 'Nalaz kaže: masna jetra. Šta sad?',
  desc: 'Posle ultrazvuka ili krvne slike dobiješ nalaz, ali ne i plan šta da jedeš.',
  d: 'M160,40h40a8,8,0,0,1,8,8V216a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V48a8,8,0,0,1,8-8H96 M88,72V64a40,40,0,0,1,80,0v8Z M96,152h64 M96,120h64',
};

export const why = [
  { n: '01', title: 'Dijete', desc: 'Brojanje kalorija i merenje na vagi daju kratak rezultat. Možeš da smršaš, a nadutost ostaje.' },
  { n: '02', title: 'Suplementi', desc: 'Popiješ sikavicu ili drugi dodatak za jetru, ali efekat ne traje dugo ako ishrana ostane ista.' },
  { n: '03', title: '„Zdrava ishrana“', desc: 'Izbaciš hleb i testa, trudiš se, a opet ne znaš šta tačno da jedeš.' },
];

export const gets = [
  ['Plan ishrane za 9 dana', 'Tri glavna obroka i užine, za svaki dan.'],
  ['Spisak za kupovinu', 'Sve namirnice na jednom mestu.'],
  ['Recepti', 'Jednostavni, gotovi za desetak minuta.'],
  ['Video lekcije', 'Kratka lekcija svakog dana, na telefonu.'],
  ['Pristup Viber grupi', 'Zajednica ljudi koji prolaze isti protokol.'],
] as const;

export const testimonials = [
  '„Imam energije više, ne spava mi se. Spavam sad po 6 sati i super ustajem.“',
  '„Osećam se jako sito, često idem u toalet, što pre nisam. Kako legnem, tako zaspim. Kada ručam, ne osećam pospanost.“',
  '„Creva su proradila. Što se toga tiče, mnogo je bolje, ima redovnu stolicu.“',
];

/** Screenshot poruke klijenata: [broj fajla, širina pri visini 304px] */
export const marqueeLeft: [string, number][] = [['01', 225], ['10', 191], ['09', 160], ['03', 210], ['08', 364], ['07', 241]];
export const marqueeRight: [string, number][] = [['02', 299], ['05', 298], ['06', 370], ['11', 234], ['04', 220]];

export const steps = [
  ['Odmah', 'Kupiš protokol', 'Popuniš kratku formu u 3 koraka i platiš karticom.'],
  ['[Rok, npr. isti dan]', 'Dobiješ materijale', 'Plan ishrane, spisak za kupovinu, recepte i video lekcije.'],
  ['Pre prvog dana', 'Nabaviš i pripremiš', 'Sa spiskom u ruci nabaviš namirnice i pripremiš se za početak.'],
  ['Dan 1-9', '9 dana protokola', 'Pratiš plan i lekcije i svakog dana znaš šta je na redu.'],
  ['Tokom i posle 9 dana', 'Rezultati', 'Beležiš kako se osećaš: da li se vraća energija i šta kaže stomak.'],
] as const;

export const fitYes = [
  'želiš da se rešiš simptoma koji te muče',
  'popodne te muči nadutost, a ništa do sada nije pomoglo',
  'želiš jasan plan i da tačno znaš šta te koji dan čeka',
  'možeš da odvojiš 9 dana za sebe',
];

export const fitNo = [
  'si trudna ili dojiš',
  'tražiš brzo rešenje, a ne želiš da menjaš ishranu',
  'ti je lekar zabranio neki od prirodnih preparata koji se pominju u protokolu',
];

/**
 * Stavke paketa sa pojedinačnom vrednošću (EUR), za karticu sa cenom.
 * Ukupna vrednost i ušteda se računaju automatski iz ovih brojeva i PRICE_EUR.
 */
export const included: { label: string; value: number }[] = [
  { label: 'Plan ishrane za svih 9 dana, sa spiskom za kupovinu', value: 149 },
  { label: 'Recepti za svako jelo iz plana', value: 29 },
  { label: 'Video lekcija za svaki dan', value: 59 },
  { label: 'Pristup Viber grupi', value: 39 },
];

/** Zbir vrednosti stavki ("Ukupna vrednost") i ušteda u odnosu na PRICE_EUR. */
export const VALUE_TOTAL_EUR = included.reduce((sum, i) => sum + i.value, 0);
export const SAVE_EUR = VALUE_TOTAL_EUR - PRICE_EUR;

export const faqs: [string, string][] = [
  ['Hoće li me mučiti glad?', 'Ne. Protokol nije gladovanje: imaš tri glavna obroka i užine i tačno znaš šta jedeš i kada.'],
  ['Mogu li normalno da radim tokom 9 dana?', 'Da. Protokol je napravljen tako da ga radiš uz posao i svakodnevne obaveze. Recepti su jednostavni i gotovi za desetak minuta, a obroke možeš da spremiš uveče i poneseš sa sobom.'],
  ['Koliko će koštati namirnice?', 'Zavisi od toga gde kupuješ, ali nema egzotičnih ni skupih namirnica: sve nalaziš u marketu i na pijaci. Spisak za kupovinu dobijaš unapred, pa pre prvog dana tačno znaš šta ti treba i koliko će te koštati.'],
  ['Šta ako pogrešim 4. dana?', 'Ništa strašno i ne kreće se ispočetka. Vratiš se planu već sa sledećim obrokom i nastaviš dalje. Ako ti nešto nije jasno, pišeš mi na WhatsApp i zajedno vidimo šta dalje.'],
  ['Kada ću osetiti razliku?', 'Kod svakog je drugačije. Neki promenu u varenju i energiji primete već u prvim danima, a drugima treba više vremena. Zato tokom protokola beležiš kako se osećaš, pa jasno vidiš šta se menja iz dana u dan.'],
  ['Mogu li da radim protokol ako pijem lekove?', 'Zavisi od lekova koje piješ. Pre početka razgovaraj sa svojim lekarom i pokaži mu spisak namirnica i preparata iz protokola. Kada dobiješ zeleno svetlo, piši mi pa zajedno vidimo kako da kreneš.'],
  ['Zašto se u protokolu govori o teškim metalima?', 'U svom radu polazim od toga da teški metali i toksini opterećuju jetru, a da se njima hrane virusi i bakterije. Zato je protokol usmeren na to da podrži jetru u tom poslu.'],
];
