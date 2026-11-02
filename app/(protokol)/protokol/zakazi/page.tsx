import type { Metadata } from "next";
import { Booking } from "@/components/protokol/Booking";
import { Footer } from "@/components/protokol/Sections";
import { booking } from "@/lib/protokol/content";

// protokol.bozinovicolgica.rs/zakazi: posle prijave (LeadForm) posetilac bira termin za online poziv.
export const metadata: Metadata = {
  title: "Zakaži online poziv | Olgica Božinović",
  robots: { index: false, follow: false },
  alternates: { canonical: "/zakazi" },
};

export default function Page() {
  return (
    <>
      <header className="booking-top container">
        <a href="/" className="brand" aria-label="Olgica Božinović, početna">
          <span className="brand-mark" aria-hidden="true" />
        </a>
      </header>
      <main className="booking container">
        <p className="eyebrow">{booking.eyebrow}</p>
        <h1 className="h2">{booking.title}</h1>
        <p className="lead">{booking.text}</p>
        <Booking />
      </main>
      <Footer />
    </>
  );
}
