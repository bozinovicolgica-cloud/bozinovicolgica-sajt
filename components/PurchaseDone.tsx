'use client';
import { useEffect } from 'react';
import { track } from '@/lib/track';
import { DRAFT_KEY } from '@/lib/order-schema';

/** Na stranici /hvala: beleži kupovinu (GTM + Meta Purchase) jednom po sesiji i briše sačuvanu formu. */
export default function PurchaseDone({ sessionId, value, currency, reference }: { sessionId: string; value: number; currency: string; reference: string }) {
  useEffect(() => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    const key = `ob_purchase_${sessionId}`;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch {}
    track('purchase', { value, currency, transaction_id: reference }, 'Purchase');
  }, [sessionId, value, currency, reference]);
  return null;
}
