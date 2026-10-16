/**
 * Vokativ imena za obraćanje ("Hvala, Jeleno!", "Zdravo Milice,").
 * Uzima prvo ime iz unosa i vraća ga sa velikim početnim slovom, latinicom ili ćirilicom kako je upisano.
 * Kad pravilo nije sigurno (strana imena, ženska imena na suglasnik...), ime ostaje u nominativu.
 */

// imena koja ostaju ista iako bi ih pravilo promenilo (muška na -a/-ija, ženska na suglasnik, ustaljena upotreba)
const KEEP = new Set([
  'nikola', 'nemanja', 'luka', 'sava', 'saša', 'andrija', 'ilija', 'jeremija', 'zaharija', 'mija',
  'ivana', 'jovana', 'katja', 'ines', 'nives', 'karmen', 'ester', 'rut', 'doris', 'iris', 'agnes', 'jasmin', 'mirjam', 'miriam',
]);

// nepravilni oblici
const SPECIAL: Record<string, string> = {
  petar: 'petre',
  aleksandar: 'aleksandre',
  dimitar: 'dimitre',
  katarina: 'katarino',
  vuk: 'vuče',
};

const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm',
  н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š',
};
const LAT = Object.fromEntries(Object.entries(CYR).map(([c, l]) => [l, c]));

const toLatin = (s: string) => [...s].map((ch) => CYR[ch] ?? ch).join('');
const toCyrillic = (s: string) => s.replace(/lj|nj|dž|[a-zčćđšž]/g, (m) => LAT[m] ?? m);
const syllables = (s: string) => (s.match(/[aeiou]/g) || []).length;

function vocativeLatin(n: string): string {
  if (KEEP.has(n)) return n;
  if (SPECIAL[n]) return SPECIAL[n];
  if (n.endsWith('ica')) return n.slice(0, -1) + 'e'; // Milica → Milice
  if (n.endsWith('ija')) return n; // Marija, Sofija ostaju ista
  if (n.endsWith('a')) {
    // dvosložna (Ana, Maja, Vesna), na -ka (Branka), -ina (Kristina), -ela/-ea (Danijela, Andrea) ostaju ista
    if (syllables(n) <= 2 || /(ka|ina|ela|ea)$/.test(n)) return n;
    return n.slice(0, -1) + 'o'; // Jelena → Jeleno, Svetlana → Svetlano
  }
  if (/[bcdfhlmnprstvzčćđšž]$/.test(n)) return n + 'e'; // Milan → Milane, Miloš → Miloše
  return n; // Marko, Đorđe, Matej...
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('sr') + s.slice(1);

/** "jelena petrović" → "Jeleno"; prazan unos → "". */
export function vocative(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] || '';
  if (!first) return '';
  return first
    .split('-')
    .map((part) => {
      const lower = part.toLocaleLowerCase('sr');
      const cyrillic = /[Ѐ-ӿ]/.test(lower);
      const latin = cyrillic ? toLatin(lower) : lower;
      if (!/^[a-zčćđšž]+$/.test(latin) || /[qwxy]/.test(latin)) return capitalize(lower); // strana imena, brojevi: bez promene
      const v = vocativeLatin(latin);
      return capitalize(cyrillic ? toCyrillic(v) : v);
    })
    .join('-');
}
