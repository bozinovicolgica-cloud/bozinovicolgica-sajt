/**
 * Privremeno sakriveni delovi sajta.
 *
 * Kod ostaje tu gde jeste, samo se ne prikazuje, pa je vraćanje jedna izmena
 * u ovom fajlu — ne mora ništa da se piše ispočetka.
 */

/**
 * Kviz o jetri (lead magnet) i sekundarni CTA „Proveri da li je protokol za
 * tebe“, koji svuda vodi na njega. Vrati na `true` i oboje se pojavi tačno
 * kao pre: dugme u herou, blok ispod simptoma, kartica „Još se dvoumiš?“ uz
 * cenu, rečenica u čestim pitanjima, link u završnom bloku i na blogu.
 *
 * Sakriveno je samo ono što posetilac vidi. Pitanja i bodovanje
 * (`lib/quiz-data.ts`), ruta `/api/quiz-lead`, tabela `quiz_leads` i mejl sa
 * rezultatom ostaju netaknuti, pa stari rezultati i dalje stoje.
 *
 * Odeljak „Za koga je“ zadržava `id="kviz"`: stari link na `/#kviz` iz mejla
 * ili sa bloga tako i dalje vodi na nešto smisleno umesto da ne uradi ništa.
 */
export const QUIZ_VISIBLE = false;
