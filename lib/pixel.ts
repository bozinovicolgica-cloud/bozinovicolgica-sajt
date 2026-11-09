/*
 * Meta Pixel za oba poddomena: program.bozinovicolgica.rs (9 dana jetre) i
 * protokol.bozinovicolgica.rs (protokol ishrane). Jedan dataset za sve oglase.
 *
 * ID stoji u kodu, a ne u env-u, jer je stari piksel 1680087597127024 zamenjen ovim,
 * a env-ovi NEXT_PUBLIC_META_PIXEL_ID, _PROGRAM i _PROTOKOL na Vercelu nose stari ID
 * i tiho bi pregazili zamenu. Zato se više ne čitaju; menja se samo ovde.
 */
export const META_PIXEL_ID = '1417798157181175';
