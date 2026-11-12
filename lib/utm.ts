/**
 * UTM parametri reklame za ovu posetu. components/Modals.tsx ih pamti u sessionStorage (`ob_utm`)
 * čim posetilac uđe sa reklame, pa ostaju i kad prošeta po sajtu i adresa ih više nema.
 */
export function storedUtm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const v = JSON.parse(sessionStorage.getItem('ob_utm') || '{}');
    return v && typeof v === 'object' ? (v as Record<string, string>) : {};
  } catch {
    return {};
  }
}
