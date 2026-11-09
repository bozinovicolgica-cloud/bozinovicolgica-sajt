/*
 * Meta Pixel za oba poddomena: program.bozinovicolgica.rs (9 dana jetre) i
 * protokol.bozinovicolgica.rs (protokol ishrane). Jedan dataset za sve oglase.
 *
 * ID se podešava na Vercelu, u NEXT_PUBLIC_META_PIXEL_ID_PROGRAM. Vrednost u kodu
 * je samo rezerva ako promenljiva nije postavljena; ako je postavljena, ona važi.
 * Stari piksel 1680087597127024 je zamenjen ovim i više se ne koristi.
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID_PROGRAM || '1417798157181175';
