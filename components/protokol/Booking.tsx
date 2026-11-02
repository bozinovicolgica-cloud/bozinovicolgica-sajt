"use client";

import { useEffect, useRef, useState } from "react";
import { COOKIE_VARIANT, isVariant } from "@/lib/protokol/ab";
import { booking, responseTime } from "@/lib/protokol/content";
import { track } from "@/lib/protokol/track";

// Cal.com događaj za online poziv, npr. "olgica-bozinovic/poziv" (cal.com/olgica-bozinovic/poziv).
const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK || "";
const CAL_ORIGIN = (process.env.NEXT_PUBLIC_CAL_ORIGIN || "https://cal.com").replace(/\/$/, "");
const CAL_EMBED = `${CAL_ORIGIN.replace("://", "://app.")}/embed/embed.js`;
const NS = "poziv";

/** Prijava sačuvana u LeadForm-u posle uspešnog slanja (samo u ovom tabu). */
export const LEAD_KEY = "lp_lead";
export type StoredLead = { id: string; name: string; email: string; phone: string };

declare global {
  interface Window {
    Cal?: any;
  }
}

/** Zvanični Cal.com loader (embed.js se učitava jednom, pozivi čekaju u redu). */
function loadCal() {
  /* eslint-disable */
  (function (C: any, A: string, L: string) {
    const p = function (a: any, ar: any) { a.q.push(ar); };
    const d = C.document;
    C.Cal = C.Cal || function () {
      const cal = C.Cal; const ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        const api: any = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || [];
        if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, CAL_EMBED, "init");
  /* eslint-enable */
}

function readLead(): StoredLead | null {
  try {
    return JSON.parse(sessionStorage.getItem(LEAD_KEY) || "null");
  } catch {
    return null;
  }
}

export function Booking() {
  const started = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!CAL_LINK || started.current) return;
    started.current = true;
    // varijanta za Pixel/GA4 (cookie "eksperiment:varijanta" koji postavlja proxy.ts)
    const raw = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_VARIANT}=`))?.slice(COOKIE_VARIANT.length + 1) ?? "";
    const variant = decodeURIComponent(raw).split(":")[1];
    if (isVariant(variant)) window.__lpVariant = variant;

    const lead = readLead();
    // Popunjava formu u kalendaru; leadId ide u booking metadata, pa ga Cal.com vraća u webhook.
    const config: Record<string, string> = { layout: "month_view", theme: "light" };
    if (lead?.name) config.name = lead.name;
    if (lead?.email) config.email = lead.email;
    if (lead?.phone) config.attendeePhoneNumber = lead.phone;
    if (lead?.id) config["metadata[leadId]"] = lead.id;

    loadCal();
    const Cal = window.Cal;
    Cal("init", NS, { origin: CAL_ORIGIN });
    Cal.ns[NS]("inline", { elementOrSelector: "#cal-inline", calLink: CAL_LINK, config });
    Cal.ns[NS]("ui", { theme: "light", hideEventTypeDetails: false, layout: "month_view", cssVarsPerTheme: { light: { "cal-brand": "#3A5139" }, dark: { "cal-brand": "#3A5139" } } });
    Cal.ns[NS]("on", {
      action: "bookingSuccessfulV2",
      callback: () => {
        setDone(true);
        track("booking");
        try {
          sessionStorage.removeItem(LEAD_KEY);
        } catch {
          /* private mode */
        }
      },
    });
  }, []);

  return (
    <>
      <p className="lead booking-note" role="status">
        {done ? booking.done : CAL_LINK ? booking.noSlot : `Javiću ti se na WhatsApp ${responseTime} da dogovorimo online poziv.`}
      </p>
      {CAL_LINK && <div id="cal-inline" className="booking-cal" />}
    </>
  );
}
