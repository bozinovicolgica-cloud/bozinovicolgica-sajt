'use client';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { OrderContext } from './OrderModal';

// Kviz i forma se učitavaju tek kad zatrebaju (manje JavaScript-a na prvom učitavanju)
const loadQuiz = () => import('./Quiz');
const loadOrder = () => import('./OrderModal');
const Quiz = dynamic(loadQuiz, { ssr: false });
const OrderModal = dynamic(loadOrder, { ssr: false });

declare global {
  interface Window { openLiverQuiz?: () => void; openOrderForm?: (source?: string) => void }
}

/**
 * Kviz se otvara klikom na bilo koji link sa href="#kviz",
 * a forma za porudžbinu klikom na element sa atributom data-order.
 */
export default function Modals() {
  const [active, setActive] = useState<'quiz' | 'order' | null>(null);
  const [ctx, setCtx] = useState<OrderContext>({ source: 'stranica' });
  const [used, setUsed] = useState({ quiz: false, order: false });

  const openQuiz = useCallback(() => { setUsed((u) => ({ ...u, quiz: true })); setActive('quiz'); }, []);
  const openOrder = useCallback((c: OrderContext) => { setCtx(c); setUsed((u) => ({ ...u, order: true })); setActive('order'); }, []);
  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || !t.closest) return;
      const q = t.closest('a[href="#kviz"]');
      if (q) { e.preventDefault(); e.stopPropagation(); openQuiz(); return; }
      const o = t.closest<HTMLElement>('[data-order]');
      if (o) { e.preventDefault(); e.stopPropagation(); openOrder({ source: o.dataset.order || 'stranica' }); }
    };
    document.addEventListener('click', onClick, true);
    window.openLiverQuiz = openQuiz;
    window.openOrderForm = (source = 'js') => openOrder({ source });

    // UTM parametri iz reklama se pamte do kraja posete (šalju se uz porudžbinu)
    try {
      const p = new URLSearchParams(location.search);
      const keep: Record<string, string> = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'].forEach((k) => { const v = p.get(k); if (v) keep[k] = v.slice(0, 200); });
      if (Object.keys(keep).length) sessionStorage.setItem('ob_utm', JSON.stringify(keep));
    } catch {}

    // direktan link: /#kviz ili /#porudzbina
    if (location.hash === '#porudzbina') openOrder({ source: 'link' });
    else if (location.hash === '#kviz') openQuiz();

    // kad je stranica mirna, unapred preuzmi kod za kviz i formu (bez blokiranja)
    let idle = 0;
    const prefetch = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      idle = ric ? ric(() => { loadQuiz(); loadOrder(); }) : window.setTimeout(() => { loadQuiz(); loadOrder(); }, 1);
    };
    const t = window.setTimeout(prefetch, 5000);
    return () => { document.removeEventListener('click', onClick, true); clearTimeout(t); void idle; };
  }, [openQuiz, openOrder]);

  return (
    <>
      {used.quiz && <Quiz
        open={active === 'quiz'}
        onClose={close}
        onBuy={(r) => {
          setActive(null);
          setTimeout(() => openOrder({ source: 'kviz', quizResult: r.result, quizScore: r.score }), 280);
        }}
      />}
      {used.order && <OrderModal open={active === 'order'} ctx={ctx} onClose={close} />}
    </>
  );
}
