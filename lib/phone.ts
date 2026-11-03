/**
 * Pozivni brojevi država za polje telefona (WhatsApp).
 *
 * Prvo idu Srbija, region i zemlje u kojima živi najviše naših klijenata, pa
 * onda sve ostalo po abecedi — da dijaspora ne mora da skroluje kroz ceo spisak.
 * Imena su na srpskom (latinica), bez zastavica: Windows ne crta emoji zastavice
 * nego ispisuje dva slova, pa bi spisak izgledao polomljeno na desktopu.
 */
export type Country = { iso: string; name: string; dial: string };

export const DEFAULT_DIAL = "+381";

/** Srbija, region i najčešće zemlje dijaspore. */
export const TOP_COUNTRIES: Country[] = [
  { iso: "RS", name: "Srbija", dial: "+381" },
  { iso: "BA", name: "Bosna i Hercegovina", dial: "+387" },
  { iso: "ME", name: "Crna Gora", dial: "+382" },
  { iso: "HR", name: "Hrvatska", dial: "+385" },
  { iso: "MK", name: "Severna Makedonija", dial: "+389" },
  { iso: "SI", name: "Slovenija", dial: "+386" },
  { iso: "AT", name: "Austrija", dial: "+43" },
  { iso: "DE", name: "Nemačka", dial: "+49" },
  { iso: "CH", name: "Švajcarska", dial: "+41" },
  { iso: "SE", name: "Švedska", dial: "+46" },
  { iso: "FR", name: "Francuska", dial: "+33" },
  { iso: "IT", name: "Italija", dial: "+39" },
  { iso: "GB", name: "Ujedinjeno Kraljevstvo", dial: "+44" },
  { iso: "US", name: "Sjedinjene Američke Države", dial: "+1" },
  { iso: "CA", name: "Kanada", dial: "+1" },
  { iso: "AU", name: "Australija", dial: "+61" },
  { iso: "AE", name: "Ujedinjeni Arapski Emirati", dial: "+971" },
];

/** Sve ostale države, po abecedi. */
export const OTHER_COUNTRIES: Country[] = [
  { iso: "AF", name: "Avganistan", dial: "+93" },
  { iso: "AL", name: "Albanija", dial: "+355" },
  { iso: "DZ", name: "Alžir", dial: "+213" },
  { iso: "AD", name: "Andora", dial: "+376" },
  { iso: "AO", name: "Angola", dial: "+244" },
  { iso: "AG", name: "Antigva i Barbuda", dial: "+1" },
  { iso: "AR", name: "Argentina", dial: "+54" },
  { iso: "AW", name: "Aruba", dial: "+297" },
  { iso: "AZ", name: "Azerbejdžan", dial: "+994" },
  { iso: "BS", name: "Bahami", dial: "+1" },
  { iso: "BH", name: "Bahrein", dial: "+973" },
  { iso: "BD", name: "Bangladeš", dial: "+880" },
  { iso: "BB", name: "Barbados", dial: "+1" },
  { iso: "BE", name: "Belgija", dial: "+32" },
  { iso: "BZ", name: "Belize", dial: "+501" },
  { iso: "BY", name: "Belorusija", dial: "+375" },
  { iso: "BJ", name: "Benin", dial: "+229" },
  { iso: "BM", name: "Bermuda", dial: "+1" },
  { iso: "BO", name: "Bolivija", dial: "+591" },
  { iso: "BW", name: "Bocvana", dial: "+267" },
  { iso: "BR", name: "Brazil", dial: "+55" },
  { iso: "BN", name: "Brunej", dial: "+673" },
  { iso: "BG", name: "Bugarska", dial: "+359" },
  { iso: "BF", name: "Burkina Faso", dial: "+226" },
  { iso: "BI", name: "Burundi", dial: "+257" },
  { iso: "BT", name: "Butan", dial: "+975" },
  { iso: "CF", name: "Centralnoafrička Republika", dial: "+236" },
  { iso: "CY", name: "Kipar", dial: "+357" },
  { iso: "CZ", name: "Češka", dial: "+420" },
  { iso: "TD", name: "Čad", dial: "+235" },
  { iso: "CL", name: "Čile", dial: "+56" },
  { iso: "DK", name: "Danska", dial: "+45" },
  { iso: "CD", name: "Demokratska Republika Kongo", dial: "+243" },
  { iso: "DM", name: "Dominika", dial: "+1" },
  { iso: "DO", name: "Dominikanska Republika", dial: "+1" },
  { iso: "DJ", name: "Džibuti", dial: "+253" },
  { iso: "EG", name: "Egipat", dial: "+20" },
  { iso: "EC", name: "Ekvador", dial: "+593" },
  { iso: "GQ", name: "Ekvatorijalna Gvineja", dial: "+240" },
  { iso: "ER", name: "Eritreja", dial: "+291" },
  { iso: "EE", name: "Estonija", dial: "+372" },
  { iso: "SZ", name: "Esvatini", dial: "+268" },
  { iso: "ET", name: "Etiopija", dial: "+251" },
  { iso: "FJ", name: "Fidži", dial: "+679" },
  { iso: "PH", name: "Filipini", dial: "+63" },
  { iso: "FI", name: "Finska", dial: "+358" },
  { iso: "GA", name: "Gabon", dial: "+241" },
  { iso: "GM", name: "Gambija", dial: "+220" },
  { iso: "GH", name: "Gana", dial: "+233" },
  { iso: "GI", name: "Gibraltar", dial: "+350" },
  { iso: "GR", name: "Grčka", dial: "+30" },
  { iso: "GD", name: "Grenada", dial: "+1" },
  { iso: "GL", name: "Grenland", dial: "+299" },
  { iso: "GE", name: "Gruzija", dial: "+995" },
  { iso: "GT", name: "Gvatemala", dial: "+502" },
  { iso: "GN", name: "Gvineja", dial: "+224" },
  { iso: "GW", name: "Gvineja Bisao", dial: "+245" },
  { iso: "GY", name: "Gvajana", dial: "+592" },
  { iso: "HT", name: "Haiti", dial: "+509" },
  { iso: "NL", name: "Holandija", dial: "+31" },
  { iso: "HN", name: "Honduras", dial: "+504" },
  { iso: "HK", name: "Hongkong", dial: "+852" },
  { iso: "IN", name: "Indija", dial: "+91" },
  { iso: "ID", name: "Indonezija", dial: "+62" },
  { iso: "IQ", name: "Irak", dial: "+964" },
  { iso: "IR", name: "Iran", dial: "+98" },
  { iso: "IE", name: "Irska", dial: "+353" },
  { iso: "IS", name: "Island", dial: "+354" },
  { iso: "IL", name: "Izrael", dial: "+972" },
  { iso: "JM", name: "Jamajka", dial: "+1" },
  { iso: "JP", name: "Japan", dial: "+81" },
  { iso: "YE", name: "Jemen", dial: "+967" },
  { iso: "AM", name: "Jermenija", dial: "+374" },
  { iso: "JO", name: "Jordan", dial: "+962" },
  { iso: "ZA", name: "Južna Afrika", dial: "+27" },
  { iso: "KR", name: "Južna Koreja", dial: "+82" },
  { iso: "KH", name: "Kambodža", dial: "+855" },
  { iso: "CM", name: "Kamerun", dial: "+237" },
  { iso: "QA", name: "Katar", dial: "+974" },
  { iso: "KZ", name: "Kazahstan", dial: "+7" },
  { iso: "KE", name: "Kenija", dial: "+254" },
  { iso: "CN", name: "Kina", dial: "+86" },
  { iso: "KG", name: "Kirgistan", dial: "+996" },
  { iso: "CO", name: "Kolumbija", dial: "+57" },
  { iso: "KM", name: "Komori", dial: "+269" },
  { iso: "CG", name: "Kongo", dial: "+242" },
  { iso: "CR", name: "Kostarika", dial: "+506" },
  { iso: "CU", name: "Kuba", dial: "+53" },
  { iso: "KW", name: "Kuvajt", dial: "+965" },
  { iso: "LA", name: "Laos", dial: "+856" },
  { iso: "LS", name: "Lesoto", dial: "+266" },
  { iso: "LV", name: "Letonija", dial: "+371" },
  { iso: "LB", name: "Liban", dial: "+961" },
  { iso: "LR", name: "Liberija", dial: "+231" },
  { iso: "LY", name: "Libija", dial: "+218" },
  { iso: "LI", name: "Lihtenštajn", dial: "+423" },
  { iso: "LT", name: "Litvanija", dial: "+370" },
  { iso: "LU", name: "Luksemburg", dial: "+352" },
  { iso: "HU", name: "Mađarska", dial: "+36" },
  { iso: "MG", name: "Madagaskar", dial: "+261" },
  { iso: "MW", name: "Malavi", dial: "+265" },
  { iso: "MV", name: "Maldivi", dial: "+960" },
  { iso: "MY", name: "Malezija", dial: "+60" },
  { iso: "ML", name: "Mali", dial: "+223" },
  { iso: "MT", name: "Malta", dial: "+356" },
  { iso: "MA", name: "Maroko", dial: "+212" },
  { iso: "MU", name: "Mauricijus", dial: "+230" },
  { iso: "MR", name: "Mauritanija", dial: "+222" },
  { iso: "MX", name: "Meksiko", dial: "+52" },
  { iso: "MM", name: "Mjanmar", dial: "+95" },
  { iso: "MD", name: "Moldavija", dial: "+373" },
  { iso: "MC", name: "Monako", dial: "+377" },
  { iso: "MN", name: "Mongolija", dial: "+976" },
  { iso: "MZ", name: "Mozambik", dial: "+258" },
  { iso: "NA", name: "Namibija", dial: "+264" },
  { iso: "NP", name: "Nepal", dial: "+977" },
  { iso: "NE", name: "Niger", dial: "+227" },
  { iso: "NG", name: "Nigerija", dial: "+234" },
  { iso: "NI", name: "Nikaragva", dial: "+505" },
  { iso: "NO", name: "Norveška", dial: "+47" },
  { iso: "NZ", name: "Novi Zeland", dial: "+64" },
  { iso: "CI", name: "Obala Slonovače", dial: "+225" },
  { iso: "OM", name: "Oman", dial: "+968" },
  { iso: "PK", name: "Pakistan", dial: "+92" },
  { iso: "PS", name: "Palestina", dial: "+970" },
  { iso: "PA", name: "Panama", dial: "+507" },
  { iso: "PG", name: "Papua Nova Gvineja", dial: "+675" },
  { iso: "PY", name: "Paragvaj", dial: "+595" },
  { iso: "PE", name: "Peru", dial: "+51" },
  { iso: "PL", name: "Poljska", dial: "+48" },
  { iso: "PT", name: "Portugal", dial: "+351" },
  { iso: "PR", name: "Portoriko", dial: "+1" },
  { iso: "RO", name: "Rumunija", dial: "+40" },
  { iso: "RU", name: "Rusija", dial: "+7" },
  { iso: "RW", name: "Ruanda", dial: "+250" },
  { iso: "SV", name: "Salvador", dial: "+503" },
  { iso: "WS", name: "Samoa", dial: "+685" },
  { iso: "SM", name: "San Marino", dial: "+378" },
  { iso: "SA", name: "Saudijska Arabija", dial: "+966" },
  { iso: "SC", name: "Sejšeli", dial: "+248" },
  { iso: "SN", name: "Senegal", dial: "+221" },
  { iso: "KP", name: "Severna Koreja", dial: "+850" },
  { iso: "SL", name: "Sijera Leone", dial: "+232" },
  { iso: "SG", name: "Singapur", dial: "+65" },
  { iso: "SY", name: "Sirija", dial: "+963" },
  { iso: "SK", name: "Slovačka", dial: "+421" },
  { iso: "SO", name: "Somalija", dial: "+252" },
  { iso: "ES", name: "Španija", dial: "+34" },
  { iso: "LK", name: "Šri Lanka", dial: "+94" },
  { iso: "SD", name: "Sudan", dial: "+249" },
  { iso: "SR", name: "Surinam", dial: "+597" },
  { iso: "TJ", name: "Tadžikistan", dial: "+992" },
  { iso: "TH", name: "Tajland", dial: "+66" },
  { iso: "TW", name: "Tajvan", dial: "+886" },
  { iso: "TZ", name: "Tanzanija", dial: "+255" },
  { iso: "TG", name: "Togo", dial: "+228" },
  { iso: "TT", name: "Trinidad i Tobago", dial: "+1" },
  { iso: "TN", name: "Tunis", dial: "+216" },
  { iso: "TM", name: "Turkmenistan", dial: "+993" },
  { iso: "TR", name: "Turska", dial: "+90" },
  { iso: "UG", name: "Uganda", dial: "+256" },
  { iso: "UA", name: "Ukrajina", dial: "+380" },
  { iso: "UY", name: "Urugvaj", dial: "+598" },
  { iso: "UZ", name: "Uzbekistan", dial: "+998" },
  { iso: "VE", name: "Venecuela", dial: "+58" },
  { iso: "VN", name: "Vijetnam", dial: "+84" },
  { iso: "ZM", name: "Zambija", dial: "+260" },
  { iso: "CV", name: "Zelenortska Ostrva", dial: "+238" },
  { iso: "ZW", name: "Zimbabve", dial: "+263" },
];

const BY_ISO = new Map([...TOP_COUNTRIES, ...OTHER_COUNTRIES].map((c) => [c.iso, c]));

/** Kolačić u koji proxy.ts upisuje državu posetioca (x-vercel-ip-country). */
export const CTRY_COOKIE = "ctry";

export const DEFAULT_ISO = "RS";

export const countryByIso = (iso: string | null | undefined) => (iso ? BY_ISO.get(iso.toUpperCase()) : undefined);

/** Pozivni broj za ISO oznaku države, ili Srbija ako je država nepoznata. */
export function dialForCountry(iso: string | null | undefined) {
  return countryByIso(iso)?.dial || DEFAULT_DIAL;
}

/** Svi pozivni brojevi, od najdužeg — da "+381" pobedi "+38" pri prepoznavanju. */
const DIALS_BY_LENGTH = [...BY_ISO.values()].map((c) => c.dial).sort((a, b) => b.length - a.length);

/**
 * Spaja pozivni broj i ono što je čovek ukucao u jedan broj za WhatsApp.
 *
 * Rešava dva česta slučaja: vodeću nulu ("064 123 4567" je kod nas normalno,
 * ali "+381 064..." nije ispravno) i nalepljen pun broj sa pozivnim brojem
 * ("+381 64..." ili "00381 64...") koji bi inače ostao udvojen.
 */
export function fullPhone(dial: string, local: string) {
  let n = local.trim().replace(/^00/, "+");
  if (n.startsWith("+")) {
    const hit = DIALS_BY_LENGTH.find((d) => n.startsWith(d));
    if (hit) n = n.slice(hit.length);
    else return n.replace(/\s+/g, " ");
  }
  n = n.replace(/^0+/, "").replace(/\s+/g, " ").trim();
  return `${dial} ${n}`.trim();
}
