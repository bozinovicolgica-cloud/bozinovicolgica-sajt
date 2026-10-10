import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { emailConfig, supabaseConfig, webhookConfig } from './config';

let sb: SupabaseClient | null | undefined;
export function supabase(): SupabaseClient | null {
  if (sb !== undefined) return sb;
  const { url, key } = supabaseConfig();
  sb = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return sb;
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
  const { apiKey, from, replyTo } = emailConfig();
  if (!apiKey || !to) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, text, reply_to: replyTo }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error('[email] Resend error', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (e) {
    console.error('[email] failed', e);
    return false;
  }
}

export async function postWebhook(kind: 'order' | 'quiz', payload: unknown): Promise<boolean> {
  const cfg = webhookConfig();
  const url = kind === 'order' ? cfg.order : cfg.quiz;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cfg.secret ? { 'X-Webhook-Secret': cfg.secret } : {}) },
      body: JSON.stringify({ type: kind, ...(payload as object) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[webhook:${kind}]`, res.status);
    return res.ok;
  } catch (e) {
    console.error(`[webhook:${kind}] failed`, e);
    return false;
  }
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
