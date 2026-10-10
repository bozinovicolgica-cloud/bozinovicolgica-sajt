import 'server-only';
import QRCode from 'qrcode';

/** "160-5100000001234-56" -> "160510000000123456" (18 cifara, NBS format) */
export function normalizeAccount(acc: string): string | null {
  const parts = acc.replace(/\s/g, '').split('-');
  let digits: string;
  if (parts.length === 3) digits = parts[0] + parts[1].padStart(13, '0') + parts[2];
  else digits = acc.replace(/\D/g, '');
  return /^\d{18}$/.test(digits) ? digits : null;
}

const clean = (s: string, max: number) => s.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * NBS IPS QR kod (standard "PR" – nalog za prenos) za plaćanje skeniranjem
 * u aplikaciji banke. Vraća SVG ili null ako podaci nisu kompletni.
 */
export async function ipsQrSvg(o: {
  account: string | null; recipient: string; recipientAddress?: string; amountRsd: number | null;
  payer?: string; code: string; purpose: string; model: string; reference: string;
}): Promise<string | null> {
  if (!o.account || !o.amountRsd) return null;
  const r = normalizeAccount(o.account);
  if (!r) return null;
  const amount = o.amountRsd.toFixed(2).replace('.', ',');
  const name = clean(o.recipient, 70) + (o.recipientAddress ? '\r\n' + clean(o.recipientAddress, 70) : '');
  const ro = (o.model === '97' || o.model === '00' ? o.model : '00') + o.reference.replace(/\D/g, '');
  const fields = [
    'K:PR', 'V:01', 'C:1', `R:${r}`, `N:${name.slice(0, 70)}`, `I:RSD${amount}`,
    ...(o.payer ? [`P:${clean(o.payer, 70)}`] : []),
    `SF:${/^\d{3}$/.test(o.code) ? o.code : '289'}`, `S:${clean(o.purpose, 35)}`, `RO:${ro.slice(0, 25)}`,
  ];
  try {
    return await QRCode.toString(fields.join('|'), { type: 'svg', errorCorrectionLevel: 'M', margin: 0, color: { dark: '#24211D', light: '#FFFFFF' } });
  } catch {
    return null;
  }
}
