import 'server-only';

// Jednostavno ograničenje po IP adresi (u memoriji instance; dovoljno protiv spama iz forme).
const hits = new Map<string, number[]>();

export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
}
