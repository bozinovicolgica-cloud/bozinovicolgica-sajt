"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/protokol/track";

/**
 * Cal.com kalendar za zakazivanje poziva, prikazan tek posle poslate prijave.
 *
 * Skripta se učitava tek kad se komponenta pojavi (dakle na koraku 5), da
 * Cal.com ne gleda posetioce koji nisu ni popunili formu. Namerno se ne dodaje
 * paket @calcom/embed-react — ovo je isti zvanični ugradni kod, samo tipizovan,
 * a projekat drži malo zavisnosti.
 *
 * Adresa kalendara stoji u NEXT_PUBLIC_CAL_LINK (npr. "olgica/protokol-poziv").
 * Bez nje se kalendar ne prikazuje, pa forma nastavi po starom (vidi LeadForm).
 */
const SRC = "https://app.cal.com/embed/embed.js";

type CalFn = ((...a: unknown[]) => void) & { q?: unknown[][]; ns?: Record<string, unknown> };

/** Zvanični Cal.com red čekanja: pozivi se skupljaju dok se embed.js ne učita. */
function calApi(): CalFn {
  const w = window as unknown as { Cal?: CalFn };
  if (!w.Cal) {
    const cal = ((...a: unknown[]) => {
      cal.q!.push(a);
    }) as CalFn;
    cal.q = [];
    cal.ns = {};
    w.Cal = cal;
  }
  if (!document.querySelector(`script[src="${SRC}"]`)) {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    document.head.appendChild(s);
  }
  return w.Cal!;
}

export type CalPrefill = { name?: string; email?: string; phone?: string };

// className: okvir kalendara se stilizuje u CSS-u sajta na kom stoji
// (protokol: .lf-cal, program: .ap-cal).
export function CalEmbed({ calLink, prefill, leadId, className = "lf-cal", onBooking }: { calLink: string; prefill?: CalPrefill; leadId?: string; className?: string; onBooking?: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !box.current) return;
    started.current = true;

    const Cal = calApi();
    Cal("init", { origin: "https://cal.com" });
    Cal("inline", {
      elementOrSelector: box.current,
      calLink,
      // Ono što je čovek već upisao u formu ne mora ponovo da kuca.
      config: {
        layout: "month_view",
        ...(prefill?.name ? { name: prefill.name } : {}),
        ...(prefill?.email ? { email: prefill.email } : {}),
        ...(prefill?.phone ? { smsReminderNumber: prefill.phone, attendeePhoneNumber: prefill.phone } : {}),
        // Cal.com vraća metadata u webhook (app/api/cal/webhook): po njemu se nalazi prijava.
        ...(leadId ? { "metadata[leadId]": leadId } : {}),
      },
    });
    // Zaglavlje sa opisom događaja se preskače: čovek je upravo poslao prijavu i
    // zna šta zakazuje, a taj blok gura kalendar ~500px niže.
    Cal("ui", { hideEventTypeDetails: true, layout: "month_view" });
    // Meta Pixel "Schedule" i DataFast protokol_booking (poslednji korak funnela); u bazu upisuje webhook.
    Cal("on", { action: "bookingSuccessfulV2", callback: () => (onBooking ? onBooking() : track("booking")) });
  }, [calLink, prefill, leadId, onBooking]);

  return <div ref={box} className={className} aria-label="Izbor termina za online poziv" />;
}
