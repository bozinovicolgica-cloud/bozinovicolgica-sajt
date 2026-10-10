export const DISCLAIMER_KEY = 'ob_disclaimer_v1';
export const DISCLAIMER_DAYS = 30; // posle 30 dana se pop-up ponovo prikazuje

export const DISCLAIMER = 'Usluge su edukativnog karaktera i ne predstavljaju medicinski savet, dijagnozu ili lečenje. Za zdravstvene probleme obratite se lekaru.';

/**
 * Skripta za <head>: ako je napomena već prihvaćena, pre prvog iscrtavanja
 * dodaje klasu "dg-ok" na <html>, pa se pop-up uopšte ne prikazuje (bez treptanja).
 */
export const DISCLAIMER_HEAD_SCRIPT = `try{var t=+localStorage.getItem('${DISCLAIMER_KEY}')||0;if(t&&Date.now()-t<${DISCLAIMER_DAYS}*864e5)document.documentElement.classList.add('dg-ok')}catch(e){}`;

