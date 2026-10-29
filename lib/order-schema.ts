import { z } from 'zod';

/** sessionStorage ključ za nacrt forme (briše se na /hvala). */
export const DRAFT_KEY = 'ob_order_draft';

/** Polja forme za porudžbinu; isti opis važi u formi i na serveru. */
export const START_OPTIONS = [
  ['odmah', 'Odmah, čim dobijem materijale'],
  ['7-dana', 'U narednih 7 dana'],
  ['kasnije', 'Za dve nedelje ili kasnije'],
] as const;

const startKeys = START_OPTIONS.map(([k]) => k) as [string, ...string[]];

export const contactSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().toLowerCase().email().max(160),
});

export const detailsSchema = z.object({
  phone: z.string().trim().min(6).max(32).regex(/^[+\d\s()\-/.]+$/),
  startWhen: z.enum(startKeys),
  note: z.string().trim().max(600).optional().default(''),
  /** Napomena o lekovima i dijagnozi je podatak o zdravlju: čuva se samo uz izričit pristanak. */
  healthConsent: z.boolean().optional().default(false),
});

/** Napomena bez pristanka se ne čuva. */
export const noteIfConsented = (d: { note?: string; healthConsent?: boolean }) => (d.healthConsent && d.note ? d.note : '');

export const metaSchema = z.object({
  orderId: z.string().uuid().optional(),
  company: z.string().max(200).optional().default(''), // honeypot
  source: z.string().trim().max(40).optional().default('stranica'),
  quizResult: z.enum(['likely', 'ok', 'doctor', 'pregnant']).optional(),
  quizScore: z.number().int().min(0).max(100).optional(),
  utm: z.record(z.string(), z.string().max(200)).optional().default({}),
  page: z.string().max(500).optional().default(''),
});

export const startLabel = (k: string | null | undefined) => START_OPTIONS.find(([key]) => key === k)?.[1] ?? '';
