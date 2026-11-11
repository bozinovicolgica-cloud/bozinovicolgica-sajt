/**
 * Prekidači za delove sajta koji se povremeno sklanjaju i vraćaju.
 *
 * Kod ostaje tu gde jeste, samo se ne prikazuje, pa su i sklanjanje i vraćanje
 * jedna izmena u ovom fajlu — ne mora ništa da se piše ispočetka.
 */

/**
 * Kviz o jetri (lead magnet) i sekundarni CTA „Proveri da li je protokol za
 * tebe“, koji svuda vodi na njega. Dok je `true`, vide se na svih šest mesta:
 * dugme u herou, blok ispod simptoma, kartica „Još se dvoumiš?“ uz cenu,
 * rečenica u čestim pitanjima, link u završnom bloku i CTA na blogu. Uz njih
 * i podnaslov iznad cene, i red o kvizu u `/llms.txt`.
 *
 * Vrati na `false` i sve to nestane, a kviz se više ne otvara ni klikom na
 * `#kviz`, ni preko `/#kviz`, ni iz konzole preko `window.openLiverQuiz`;
 * njegov chunk se tada ne preuzima unapred. Kartica sa cenom ostaje sama u
 * mreži, pa je `price__grid--solo` centrira.
 *
 * Pitanja i bodovanje (`lib/quiz-data.ts`), ruta `/api/quiz-lead`, tabela
 * `quiz_leads` i mejl sa rezultatom ne zavise od ovog prekidača.
 */
export const QUIZ_VISIBLE = true;
