'use client';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { OrderContext } from './OrderModal';

// Kviz i forme se učitavaju tek kad zatrebaju (manje JavaScript-a na prvom učitavanju)
const loadQuiz = () => import('./Quiz');
const loadApply = () => import('./ApplyModal');
const loadOrder = () => import('./OrderModal');
const Quiz = dynamic(loadQuiz, { ssr: false });
const ApplyModal = dynamic(loadApply, { ssr: false });
const OrderModal = dynamic(loadOrder, { ssr: false });

declare global {
  interface Window { openLiverQuiz?: () => void; openApplyForm?: (source?: string) => void; openOrderForm?: (source?: string) => void }
}

/**
 * Kviz se otvara klikom na bilo koji link sa href="#kviz", a kvalifikaciona
 * forma (prijava + izbor termina na Cal.com-u) klikom na element sa atributom
 * data-order. Dugmići na stranici više ne vode direktno na plaćanje.
 *
 * Stara forma za porudžbinu sa Stripe plaćanjem ostaje dostupna preko adrese
 * /#porudzbina, da se link za plaćanje može poslati posle poziva i da povratak
 * sa Stripe-a (?placanje=otkazano) nastavi tamo gde je stao.
 */
export default function Modals() {
  const [active, setActive] = useState<'quiz' | 'apply' | 'order' | null>(null);
  const [source, setSource] = useState('stranica');
  const [ctx, setCtx] = useState<OrderContext>({ source: 'stranica' });
  const [used, setUsed] = useState({ quiz: false, apply: false, order: false });

  const openQuiz = useCallback(() => { setUsed((u) => ({ ...u, quiz: true })); setActive('quiz'); }, []);
  const openApply = useCallback((s: string) => { setSource(s); setUsed((u) => ({ ...u, apply: true })); setActive('apply'); }, []);
  const openOrder = useCallback((c: OrderContext) => { setCtx(c); setUsed((u) => ({ ...u, order: true })); setActive('order'); }, []);
  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || !t.closest) return;
      const q = t.closest('a[href="#kviz"]');
      if (q) { e.preventDefault(); e.stopPropagation(); openQuiz(); return; }
      const o = t.closest<HTMLElement>('[data-order]');
      if (o) { e.preventDefault(); e.stopPropagation(); openApply(o.dataset.order || 'stranica'); }
    };
    document.addEventListener('click', onClick, true);
    window.openLiverQuiz = openQuiz;
    window.openApplyForm = (s = 'js') => openApply(s);
    window.openOrderForm = (s = 'js') => openOrder({ source: s });

    // UTM parametri iz reklama se pamte do kraja posete (šalju se uz prijavu)
    try {
      const p = new URLSearchParams(location.search);
      const keep: Record<string, string> = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach((k) => { const v = p.get(k); if (v) keep[k] = v.slice(0, 200); });
      if (Object.keys(keep).length) sessionStorage.setItem('ob_utm', JSON.stringify(keep));
    } catch {}

    // direktan link: /#kviz, /#prijava ili /#porudzbina (plaćanje)
    const cancelled = new URLSearchParams(location.search).get('placanje') === 'otkazano';
    if (location.hash === '#porudzbina' || cancelled) openOrder({ source: 'link' });
    else if (location.hash === '#prijava') openApply('link');
    else if (location.hash === '#kviz') openQuiz();

    // kad je stranica mirna, unapred preuzmi kod za kviz i formu (bez blokiranja)
    let idle = 0;
    const prefetch = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      idle = ric ? ric(() => { loadQuiz(); loadApply(); }) : window.setTimeout(() => { loadQuiz(); loadApply(); }, 1);
    };
    const t = window.setTimeout(prefetch, 5000);
    return () => { document.removeEventListener('click', onClick, true); clearTimeout(t); void idle; };
  }, [openQuiz, openApply, openOrder]);

  return (
    <>
      {used.quiz && <Quiz
        open={active === 'quiz'}
        onClose={close}
        onBuy={() => {
          setActive(null);
          setTimeout(() => openApply('kviz'), 280);
        }}
      />}
      {used.apply && <ApplyModal open={active === 'apply'} source={source} onClose={close} />}
      {used.order && <OrderModal open={active === 'order'} ctx={ctx} onClose={close} />}
    </>
  );
}
