'use client';
import type { ReactNode } from 'react';
import { useConsent } from '@/lib/consent';

/** Prikazuje decu (skripte za analitiku i oglašavanje) tek posle klika na „Prihvati“. */
export default function ConsentGate({ children }: { children: ReactNode }) {
  return useConsent() === 'all' ? <>{children}</> : null;
}
