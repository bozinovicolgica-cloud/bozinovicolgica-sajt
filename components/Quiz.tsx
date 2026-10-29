'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { PRICE_RSD, thousands } from '@/lib/content';
import {
  Q, WHY, RESULT_TITLES, TIPS_LIKELY, TIPS_OK, TIPS_DOCTOR,
  evaluate, loadHabits, readableAnswers,
  type Answers, type Evaluation, type WhyKey,
} from '@/lib/quiz-data';
import { QUIZ_NOTE } from '@/lib/legal';
import { COMPANY, EMAIL } from '@/lib/site';
import { track } from '@/lib/track';
import ModalShell from './ModalShell';
import { img } from '@/lib/images';

type Step = number | 'lead' | 'loading' | 'result';

const IconX = () => (<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="#3A5139" strokeWidth="20" strokeLinecap="round"><path d="M64,64L192,192 M192,64L64,192" /></svg>);
const IconBack = () => (<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"><polyline points="160 208 80 128 160 48" /></svg>);
const IconCheck = ({ stroke = '#FFFFFF' }: { stroke?: string }) => (<svg width="14" height="14" viewBox="0 0 256 256" fill="none" stroke={stroke} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round"><path d="M40,144l56,56L224,72" /></svg>);
const Arrow = ({ color }: { color: string }) => (
  <span className="oq-ar"><svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"><line x1="64" y1="192" x2="192" y2="64" /><polyline points="88 64 192 64 192 168" /></svg></span>
);

function StepsList({ list, check }: { list: string[]; check?: boolean }) {
  return (
    <ol className={`oq-steps${check ? ' oq-check' : ''}`}>
      {list.map((t, i) => (
        <li key={t}><span className="oq-n">{check ? <IconCheck stroke="#3A5139" /> : i + 1}</span><span>{t}</span></li>
      ))}
    </ol>
  );
}

function Meter({ pos }: { pos: number }) {
  const [left, setLeft] = useState(2);
  useEffect(() => {
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setLeft(pos)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [pos]);
  return (
    <div className="oq-meter">
      <div className="oq-track"><span className="oq-dot" style={{ left: `${left.toFixed(1)}%` }} /></div>
      <div className="oq-scale"><span>Jetra je u dobrom stanju</span><span>Jetra je preopterećena</span></div>
    </div>
  );
}

function Chips({ list }: { list: string[] }) {
  return <div className="oq-chips">{list.map((t) => <span key={t} className="oq-chip">{t}</span>)}</div>;
}

function WhyList({ keys, ans }: { keys: WhyKey[]; ans: Answers }) {
  const habits = loadHabits(ans);
  const items = keys.slice(0, 4).map((k) => {
    const [title, body0] = WHY[k];
    let body = body0;
    if (k === 'load') body = body.replace('{x}', habits.length ? (habits.length > 1 ? habits.slice(0, -1).join(', ') + ' i ' + habits[habits.length - 1] : habits[0]) : 'svakodnevne navike');
    return <li key={k}><b>{title}</b><span>{body}</span></li>;
  });
  if (!keys.includes('load')) {
    items.unshift(<li key="filter"><b>Jetra je filter tvog tela</b><span>Svakog dana prerađuje sve što unosimo kroz hranu, vodu, vazduh, lekove i kozmetiku. Kad se nagomila više nego što stigne da izbaci, rad joj se usporava, a telo to pokazuje kroz simptome.</span></li>);
  }
  return <ul className="oq-why">{items}</ul>;
}

const Fine = () => <p className="oq-fine">{QUIZ_NOTE}</p>;

export default function Quiz({ open, onClose, onBuy }: { open: boolean; onClose: () => void; onBuy: (r: Evaluation) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(-1);
  const [ans, setAns] = useState<Answers>({});
  const [lead, setLead] = useState({ name: '', email: '', consent: false });
  const [leadErr, setLeadErr] = useState('');
  const [emailed, setEmailed] = useState(false);
  const saved = useRef(false);

  // kao u originalu: ako je kviz završen, sledeće otvaranje kreće od početka
  useEffect(() => {
    if (!open) return;
    if (step === 'result' || step === 'loading') { setStep(-1); setAns({}); setEmailed(false); saved.current = false; }
    track('liver_quiz_open');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // fokus i skrol na vrh pri svakom koraku
  useEffect(() => {
    const card = cardRef.current; if (!card || !open) return;
    card.scrollTop = 0;
    const f = card.querySelector<HTMLElement>('.oq-opt[aria-checked="true"]') || card.querySelector<HTMLElement>('.oq-opt') || card.querySelector<HTMLElement>('[data-oq="start"]') || card.querySelector<HTMLElement>('[data-oq="lead-name"]') || card.querySelector<HTMLElement>('[data-oq="buy"]') || card.querySelector<HTMLElement>('[data-oq="see"]');
    if (f && (typeof step === 'number' || step === 'lead' || step === 'result')) try { f.focus({ preventScroll: true }); } catch {}
  }, [step, open]);

  const restart = () => { setAns({}); setStep(0); setEmailed(false); saved.current = false; };

  const showResult = () => {
    setStep('loading');
    setTimeout(() => {
      setStep('result');
      const r = evaluate(ans);
      track('liver_quiz_complete');
    }, 1400);
  };

  const save = (withContact: boolean) => {
    if (saved.current) return;
    saved.current = true;
    const r = evaluate(ans);
    const body = {
      name: withContact ? lead.name.trim() : '',
      email: withContact ? lead.email.trim() : '',
      consent: withContact ? lead.consent : false,
      answers: ans,
      readable: readableAnswers(ans),
      score: r.score,
      result: r.result,
      tags: r.tags,
      page: typeof location !== 'undefined' ? location.href : '',
    };
    fetch('/api/quiz-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true })
      .then((res) => res.json())
      .then((j) => { if (j?.emailed) setEmailed(true); })
      .catch(() => {});
  };

  const goNext = (s: number) => {
    if (s < Q.length - 1) { setStep(s + 1); return; }
    setStep('lead');
  };

  const choose = (i: number) => {
    if (typeof step !== 'number') return;
    const q = Q[step];
    if (q.type === 'single') {
      setAns((a) => ({ ...a, [q.id]: i }));
      const s = step;
      setTimeout(() => goNext(s), 260);
      return;
    }
    setAns((prev) => {
      let a = ((prev[q.id] as number[]) || []).slice();
      const o = q.opts[i], k = a.indexOf(i);
      if (k > -1) a.splice(k, 1);
      else if (o.none) a = [i];
      else { a = a.filter((j) => !q.opts[j].none); a.push(i); }
      return { ...prev, [q.id]: a };
    });
  };

  const submitLead = (e: React.FormEvent) => {
    e.preventDefault();
    const email = lead.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setLeadErr('Upiši ispravnu email adresu.'); return; }
    if (!lead.consent) { setLeadErr('Potrebna je tvoja saglasnost da bih ti poslala rezultat na email. Ili preskoči ovaj korak.'); return; }
    setLeadErr('');
    track('liver_quiz_lead', {}, 'Lead');
    save(true);
    showResult();
  };

  const skipLead = () => { track('liver_quiz_lead_skip'); save(false); showResult(); };

  const buy = (e: React.MouseEvent) => {
    e.preventDefault();
    track('liver_quiz_cta', { cta: 'buy' });
    onBuy(evaluate(ans));
  };
  const see = (e: React.MouseEvent) => {
    e.preventDefault();
    track('liver_quiz_cta', { cta: 'see' });
    onClose();
    setTimeout(() => {
      const el = document.getElementById('resenje');
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: 'smooth' });
    }, 280);
  };

  const header = (
    <div className="oq-top">
      {(typeof step === 'number' && step > 0) || step === 'lead' ? (
        <button type="button" className="oq-link" onClick={() => setStep(step === 'lead' ? Q.length - 1 : Math.max(0, (step as number) - 1))}><IconBack /><span>Nazad</span></button>
      ) : (
        <span className="oq-brand"><span className="oq-logo" aria-hidden="true" /><span className="oq-brandtxt">Kviz o jetri</span></span>
      )}
      <button type="button" className="oq-iconbtn" onClick={onClose} aria-label="Zatvori kviz"><IconX /></button>
    </div>
  );

  let body: React.ReactNode = null;

  if (step === -1) {
    body = (
      <div className="oq-body oq-fade">
        <div className="oq-intro-who">
          <span className="oq-avatar" style={{ position: 'relative' }}>
            <Image src={img('olgica-hero.webp')} alt="" fill sizes="64px" />
          </span>
          <span><span className="oq-who-n" style={{ display: 'block' }}>Olgica Božinović</span><span className="oq-who-t">Health coach, 10+ godina rada sa klijentima</span></span>
        </div>
        <p className="oq-eyebrow">Besplatan kviz</p>
        <h2 className="oq-h" id="oq-title">Da li ti je jetra preopterećena?</h2>
        <p className="oq-p">Odgovori na {Q.length} kratkih pitanja o tome kako se osećaš. Na kraju vidiš svoj rezultat, šta obično stoji iza tvojih simptoma i šta ti predlažem da uradiš.</p>
        <div className="oq-meta"><span className="oq-pill">Traje 2 minuta</span><span className="oq-pill">{Q.length} pitanja</span><span className="oq-pill">Rezultat odmah</span></div>
        <div className="oq-nav" style={{ marginTop: 32 }}>
          <button type="button" className="oq-btn oq-arrow" data-oq="start" onClick={() => { setStep(0); track('liver_quiz_start'); }}><span>Započni kviz</span><Arrow color="#FFFFFF" /></button>
        </div>
        <p className="oq-fine">Kviz ne postavlja dijagnozu i ne zamenjuje pregled kod lekara.</p>
      </div>
    );
  } else if (typeof step === 'number') {
    const q = Q[step], a = ans[q.id], multi = q.type === 'multi';
    const pct = Math.round(((step + 1) / Q.length) * 100);
    body = (
      <div className="oq-body">
        <div className="oq-progress"><div className="oq-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div><span className="oq-count">Pitanje {step + 1} od {Q.length}</span></div>
        <div className="oq-fade" key={step}>
          <h2 className="oq-q" id="oq-title">{q.q}</h2>
          {q.hint && <p className="oq-hint">{q.hint}</p>}
          <div className={`oq-opts${multi ? ' oq-multi' : ''}`} role={multi ? 'group' : 'radiogroup'} aria-labelledby="oq-title">
            {q.opts.map((o, i) => {
              const on = multi ? ((a as number[]) || []).includes(i) : a === i;
              return (
                <button key={o.t} type="button" className="oq-opt" role={multi ? 'checkbox' : 'radio'} aria-checked={on} onClick={() => choose(i)}>
                  <span className="oq-mark" aria-hidden="true"><IconCheck /></span><span>{o.t}</span>
                </button>
              );
            })}
          </div>
          {multi && (
            <div className="oq-nav"><span />
              <button type="button" className="oq-btn oq-arrow" disabled={!((a as number[]) || []).length} onClick={() => goNext(step)}>
                <span>{step === Q.length - 1 ? 'Vidi rezultat' : 'Dalje'}</span><Arrow color="#FFFFFF" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  } else if (step === 'lead') {
    body = (
      <div className="oq-body oq-fade">
        <div className="oq-progress"><div className="oq-bar" aria-hidden="true"><span style={{ width: '100%' }} /></div><span className="oq-count">Još samo ovo</span></div>
        <p className="oq-eyebrow">Tvoj rezultat je spreman</p>
        <h2 className="oq-h" id="oq-title">Gde da ti pošaljem rezultat?</h2>
        <p className="oq-p">Ostavi ime i email i rezultat sa preporukama stiže ti i u inbox, da ga imaš pri ruci. Ovaj korak nije obavezan.</p>
        <form className="of-form" onSubmit={submitLead} noValidate>
          <label className="of-field">
            <span className="of-label">Ime</span>
            <input className="of-input" data-oq="lead-name" name="name" autoComplete="given-name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} maxLength={80} />
          </label>
          <label className="of-field">
            <span className="of-label">Email</span>
            <input className="of-input" type="email" name="email" inputMode="email" autoComplete="email" required value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} maxLength={160} />
          </label>
          <label className="of-check">
            <input type="checkbox" checked={lead.consent} onChange={(e) => setLead({ ...lead, consent: e.target.checked })} />
            <span>Izričito pristajem da Olgica Božinović i {COMPANY.name} uz moje ime i email čuvaju odgovore iz kviza, koji su podaci o zdravlju, i da mi pošalju rezultat i savete za ishranu na email. Pristanak mogu da povučem i da se odjavim u svakom trenutku na {EMAIL}. <a href="/politika-privatnosti" target="_blank">Politika privatnosti</a></span>
          </label>
          {leadErr && <p className="of-error" role="alert">{leadErr}</p>}
          <div className="oq-nav">
            <button type="button" className="oq-link" onClick={skipLead}>Preskoči</button>
            <button type="submit" className="oq-btn oq-arrow"><span>Prikaži rezultat</span><Arrow color="#FFFFFF" /></button>
          </div>
        </form>
      </div>
    );
  } else if (step === 'loading') {
    body = (
      <div className="oq-body"><div className="oq-loading oq-fade"><div className="oq-spin" aria-hidden="true" /><h2 className="oq-q" id="oq-title" style={{ marginTop: 28 }}>Analiziram tvoje odgovore…</h2><p className="oq-p" style={{ marginTop: 8 }}>Još samo trenutak.</p></div></div>
    );
  } else {
    const r = evaluate(ans);
    const sent = emailed ? <p className="oq-fine" style={{ marginTop: 12 }}>Rezultat smo ti poslali i na email.</p> : null;
    let h: React.ReactNode;
    if (r.result === 'likely') {
      h = (<>
        <p className="oq-eyebrow">Tvoj rezultat</p>
        <h2 className="oq-h" id="oq-title">{RESULT_TITLES.likely}</h2>
        <p className="oq-p">U odgovorima prepoznaješ više znakova koje viđam kod klijenata sa preopterećenom jetrom. Ovo nije dijagnoza: proveri ih i sa svojim lekarom.</p>
        {sent}
        <Meter pos={r.pos} />
        {r.tags.length > 0 && <div className="oq-sec"><h3 className="oq-sec-h">Tvoji simptomi</h3><Chips list={r.tags} /></div>}
        <div className="oq-sec"><h3 className="oq-sec-h">Šta obično stoji iza toga</h3><WhyList keys={r.whys} ans={ans} /></div>
        <div className="oq-sec"><h3 className="oq-sec-h">Šta da uradiš već od danas</h3><StepsList list={TIPS_LIKELY} />
          <p className="oq-p" style={{ fontSize: 17, lineHeight: '26px' }}>Ovo su prvi koraci. Ako želiš da ih pretvoriš u naviku, pomaže jasan plan: tačno šta jedeš, svakog dana.</p></div>
        <div className="oq-offer">
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, lineHeight: '16px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C2D3BE' }}>Moja preporuka za tebe</p>
          <h4 style={{ marginTop: 10 }}>9 dana spašavanja jetre</h4>
          <p>Plan ishrane za svih 9 dana, spisak za kupovinu, recepti i kratka video lekcija za svaki dan. Ako zapneš, tu sam na WhatsApp-u.</p>
          <div className="oq-offer-row"><span className="oq-priceWrap"><span className="oq-price">{thousands(PRICE_RSD)}<small>RSD</small></span></span><a href="#cena" className="oq-btn oq-light oq-arrow" data-oq="buy" onClick={buy}><span>Započni devetodnevni protokol</span><Arrow color="#3A5139" /></a></div>
        </div>
        <Fine />
        <div className="oq-end"><button type="button" className="oq-link" onClick={restart}>Uradi kviz ponovo</button></div>
      </>);
    } else if (r.result === 'ok') {
      h = (<>
        <p className="oq-eyebrow">Tvoj rezultat</p>
        <h2 className="oq-h" id="oq-title">{RESULT_TITLES.ok}</h2>
        <p className="oq-p">U odgovorima prepoznaješ malo znakova preopterećenja. Jetra ipak radi bez pauze, pa je pametno da je čuvaš dobrim navikama.</p>
        {sent}
        <Meter pos={r.pos} />
        {r.tags.length > 0 && <div className="oq-sec"><h3 className="oq-sec-h">Na ovo obrati pažnju</h3><Chips list={r.tags} /><p className="oq-p" style={{ fontSize: 17, lineHeight: '26px' }}>Ako ovi simptomi postanu češći, uradi kviz ponovo.</p></div>}
        <div className="oq-sec"><h3 className="oq-sec-h">Kako da jetru održiš u dobrom stanju</h3><StepsList list={TIPS_OK} check /></div>
        <div className="oq-alert"><h3 className="oq-sec-h" style={{ fontSize: 22, lineHeight: '28px' }}>Želiš da je očistiš preventivno?</h3><p className="oq-p" style={{ marginTop: 8, fontSize: 17, lineHeight: '26px' }}>Devetodnevni protokol možeš da uradiš i preventivno, da jetra ostane rasterećena i pre nego što se jave tegobe.</p>
          <div style={{ marginTop: 20 }}><a href="#resenje" className="oq-btn oq-ghost" data-oq="see" onClick={see}>Pogledaj kako izgleda protokol</a></div></div>
        <Fine />
        <div className="oq-end"><button type="button" className="oq-link" onClick={restart}>Uradi kviz ponovo</button></div>
      </>);
    } else if (r.result === 'doctor') {
      h = (<>
        <p className="oq-eyebrow">Tvoj rezultat</p>
        <h2 className="oq-h" id="oq-title">Pre bilo kakvog protokola, javi se lekaru</h2>
        <p className="oq-p">Neki od znakova iz poslednjeg pitanja, kao što su žuta boja kože ili očiju, tamna mokraća ili jak bol ispod desnog rebra, traže da ih lekar pogleda što pre.</p>
        <div className="oq-alert"><h3 className="oq-sec-h" style={{ fontSize: 22, lineHeight: '28px' }}>Šta da uradiš</h3><StepsList list={TIPS_DOCTOR} /></div>
        <div className="oq-end"><button type="button" className="oq-btn" onClick={onClose}>Razumem</button></div>
        <div className="oq-end"><button type="button" className="oq-link" onClick={restart}>Uradi kviz ponovo</button></div>
      </>);
    } else {
      h = (<>
        <p className="oq-eyebrow">Tvoj rezultat</p>
        <h2 className="oq-h" id="oq-title">Protokol sada nije za tebe</h2>
        <p className="oq-p">Dok si trudna ili dojiš, ne preporučujem čišćenje jetre. Tvoje telo sada ima važniji posao. Do tada jetru možeš da čuvaš ovim navikama:</p>
        <div className="oq-sec"><StepsList list={TIPS_OK} check /></div>
        <p className="oq-p" style={{ fontSize: 17, lineHeight: '26px' }}>Kada završiš sa dojenjem, uradi kviz ponovo. Za sve što te muči do tada, razgovaraj sa svojim lekarom.</p>
        <div className="oq-end"><button type="button" className="oq-btn" onClick={onClose}>Zatvori</button></div>
      </>);
    }
    body = <div className="oq-body oq-fade">{h}</div>;
  }

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="oq-title" cardRef={cardRef}>
      {header}
      {body}
    </ModalShell>
  );
}
