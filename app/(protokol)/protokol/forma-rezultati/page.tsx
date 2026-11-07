import type { Metadata } from "next";
import { supabase } from "@/lib/server/integrations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analitika sajta i forme", robots: { index: false, follow: false } };

/*
 * protokol.bozinovicolgica.rs/forma-rezultati?key=AB_RESULTS_KEY&period=month|7|30|90
 * Za oba sajta: posete, vreme na sajtu, klik na dugme, koraci forme, otvoren kalendar, zakazan poziv,
 * „hot lead“ alarmi i prodaje. Podaci iz Supabase funkcije form_report (0007_form_funnel.sql).
 */

type Step = { form: "protokol" | "program"; step: number; label: string; visitors: number };
type Report = {
  since: string;
  steps: Step[];
  site: Record<string, { visits: number; avg_sec: number | null; median_sec: number | null }>;
  leads: Record<string, { prijave: number; zakazali: number; alarmi: number }>;
  sales: { prodaje: number; iznos: number };
};

const FORMS = [
  { id: "protokol", title: "Protokol ishrane", site: "protokol.bozinovicolgica.rs", goal: "cilj: zakazan poziv" },
  { id: "program", title: "9 dana spašavanja jetre", site: "program.bozinovicolgica.rs", goal: "cilj: prodaja" },
] as const;

const PERIODS = [
  { id: "month", label: "Ovaj mesec" },
  { id: "7", label: "7 dana" },
  { id: "30", label: "30 dana" },
  { id: "90", label: "90 dana" },
];

const pct = (a: number, b: number) => (b ? Math.round((1000 * a) / b) / 10 : 0);
const dur = (s: number | null | undefined) => {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m ? `${m} min ${sec} s` : `${sec} s`;
};
const eur = (n: number) => `${new Intl.NumberFormat("sr-Latn-RS", { maximumFractionDigits: 0 }).format(n)} €`;

export default async function Page({ searchParams }: { searchParams: Promise<{ key?: string; period?: string }> }) {
  const { key, period: rawPeriod } = await searchParams;
  const period = PERIODS.some((p) => p.id === rawPeriod) ? rawPeriod! : "month";

  const wrap = (children: React.ReactNode) => (
    <main className="container" style={{ padding: "64px 0", fontFamily: "var(--sans)", color: "var(--ink)" }}>
      <h1 className="h2">Analitika sajta i forme</h1>
      {children}
    </main>
  );

  if (!process.env.AB_RESULTS_KEY || key !== process.env.AB_RESULTS_KEY) return wrap(<p style={{ marginTop: 32 }}>Nemaš pristup. Dodaj ?key=... u adresu.</p>);
  const db = supabase();
  if (!db) return wrap(<p style={{ marginTop: 32 }}>Supabase nije podešen.</p>);

  const { data, error } = await db.rpc("form_report", { p_period: period });
  if (error || !data) {
    return wrap(
      <p style={{ marginTop: 32 }}>
        Ne mogu da pročitam podatke ({error?.message ?? "prazan odgovor"}). Da li je pokrenuta migracija <code>0007_form_funnel.sql</code>?
      </p>,
    );
  }
  const r = data as Report;
  const sinceLabel = new Intl.DateTimeFormat("sr-Latn-RS", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Belgrade" }).format(new Date(r.since));

  const th: React.CSSProperties = { textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600, fontSize: 14, color: "var(--text)" };
  const td: React.CSSProperties = { padding: "12px 16px", borderBottom: "1px solid var(--line)", fontSize: 16, verticalAlign: "middle" };
  const tile: React.CSSProperties = { padding: "14px 18px", borderRadius: 16, background: "#fff", border: "1px solid var(--line)", minWidth: 150 };
  const Tile = ({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) => (
    <div style={tile}>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
      {note && <div style={{ fontSize: 12, color: "var(--muted)" }}>{note}</div>}
    </div>
  );

  return wrap(
    <>
      <p style={{ marginTop: 8, color: "var(--text)" }}>
        {PERIODS.map((p, i) => (
          <span key={p.id}>
            {i > 0 && " · "}
            {p.id === period ? <b>{p.label}</b> : <a href={`?key=${encodeURIComponent(key!)}&period=${p.id}`}>{p.label}</a>}
          </span>
        ))}
        <span style={{ color: "var(--muted)" }}> (od {sinceLabel})</span>
      </p>

      {FORMS.map((f) => {
        const steps = r.steps.filter((s) => s.form === f.id).map((s) => ({ ...s, visitors: Number(s.visitors) }));
        const start = steps[0]?.visitors ?? 0;
        const site = r.site?.[f.id];
        const leads = r.leads?.[f.id] ?? { prijave: 0, zakazali: 0, alarmi: 0 };
        // najveći pad između dva susedna koraka: mesto koje prvo treba popraviti
        let worst = -1;
        let worstDrop = 0;
        steps.forEach((s, i) => {
          if (i === 0 || !steps[i - 1].visitors) return;
          const drop = 100 - pct(s.visitors, steps[i - 1].visitors);
          if (drop > worstDrop) { worstDrop = drop; worst = i; }
        });

        return (
          <section key={f.id} style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600 }}>{f.title}</h2>
            <p style={{ marginTop: 4, color: "var(--muted)", fontSize: 14 }}>{f.site} · {f.goal}</p>

            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Tile label="Posetioci" value={start} note="jedinstveni" />
              <Tile label="Posete" value={site?.visits ?? 0} note="otvaranja stranice" />
              <Tile label="Prosečno vreme na sajtu" value={dur(site?.avg_sec)} note={`polovina posetilaca do ${dur(site?.median_sec)}`} />
              <Tile label="Otvorili kalendar" value={leads.prijave} note="poslali prijavu" />
              <Tile label="Zakazali poziv" value={`${leads.zakazali} (${pct(leads.zakazali, leads.prijave)}%)`} />
              <Tile label="Nisu zakazali" value={Math.max(leads.prijave - leads.zakazali, 0)} note={`hot lead alarm Olgici: ${leads.alarmi}`} />
              {f.id === "program" && <Tile label="Prodaje (Stripe)" value={r.sales.prodaje} note={eur(Number(r.sales.iznos) || 0)} />}
            </div>

            {worst > 0 && start > 0 && (
              <div style={{ marginTop: 16, padding: 20, borderRadius: 20, background: "var(--mint-bg)", border: "1px solid var(--sage-light)", fontSize: 17 }}>
                Najviše ljudi odustaje između <b>„{steps[worst - 1].label}“</b> i <b>„{steps[worst].label}“</b>: {worstDrop.toFixed(1)}% ne nastavi.
              </div>
            )}

            <div style={{ marginTop: 16, overflowX: "auto", background: "#fff", borderRadius: 24, border: "1px solid var(--line)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr>
                    <th style={th}>Korak</th>
                    <th style={th}>Ljudi</th>
                    <th style={{ ...th, width: "28%" }}>Od posetilaca</th>
                    <th style={th}>Nastavilo od prethodnog</th>
                    <th style={th}>Odustalo</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s, i) => {
                    const prev = i ? steps[i - 1].visitors : s.visitors;
                    const ofStart = pct(s.visitors, start);
                    const bad = i === worst;
                    return (
                      <tr key={s.step} style={bad ? { background: "#fff4f2" } : undefined}>
                        <td style={td}>{s.step}. {s.label}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{s.visitors}</td>
                        <td style={td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, height: 10, borderRadius: 5, background: "var(--line)" }}>
                              <div style={{ width: `${Math.min(ofStart, 100)}%`, height: "100%", borderRadius: 5, background: "var(--sage)" }} />
                            </div>
                            <span style={{ fontSize: 14, minWidth: 48 }}>{ofStart}%</span>
                          </div>
                        </td>
                        <td style={td}>{i ? `${pct(s.visitors, prev)}%` : "—"}</td>
                        <td style={{ ...td, color: bad ? "var(--red)" : undefined, fontWeight: bad ? 600 : 400 }}>{i ? Math.max(prev - s.visitors, 0) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <p style={{ marginTop: 40, fontSize: 14, color: "var(--muted)", maxWidth: 820 }}>
        Posetilac = jedinstveni anonimni cookie; ne broje se botovi ni probne posete (?v=a, ?v=b, ?qa=1). Vreme na sajtu se
        broji samo dok je stranica otvorena ispred posetioca. Na protokolu forma u hero delu (varijanta B) može da se počne i
        bez klika na dugme, pa korak 3 ponekad bude veći od koraka 2. Otvorili kalendar, zakazali i prodaje su iz same baze
        prijava i porudžbina (isto što ide u Airtable), pa su tačniji od brojeva u tabeli koraka.
      </p>
    </>,
  );
}
