import { useEffect, useRef, useState } from "react";
import { DEMO_TODAY, DOCS, INVOICES, PAID_INVOICE_NUMBERS, PEOPLE, SUPPLIERS } from "../lib/data";
import { checkInvoice, daysBetween, inr } from "../lib/engine";
import { CREDIT_NOTE_NO, disputeEmail, facts } from "../lib/caseA";
import { dmy } from "../lib/copy";
import { useStore, useToast } from "../lib/store";
import Label from "../components/Label";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import { Primary, Secondary } from "../components/ui";
import CaseStudy from "./CaseStudy";

const TYPE_NAME: Record<string, string> = { MSA: "Main contract", SOW: "Project order", Amendment: "Change to the contract" };
const TABS = ["Overview", "Agreements", "Invoices", "Case analysis"] as const;

// What a supplier sees: only its own agreements and invoices, as plain facts. No internal checks, amounts at stake or progress.
export default function SupplierPortal() {
  const snap = useStore();
  const signOut = useStore((s) => s.signOut);
  const show = useToast((t) => t.show);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const barRef = useRef<HTMLElement>(null);
  // Share the bar height so the sticky side panel in the case analysis sits below it.
  useEffect(() => {
    const el = barRef.current; if (!el) return;
    const set = () => document.documentElement.style.setProperty("--hdr", matchMedia("(min-width: 768px)").matches ? `${el.getBoundingClientRect().height}px` : "0px");
    set(); const ro = new ResizeObserver(set); ro.observe(el); window.addEventListener("resize", set);
    return () => { ro.disconnect(); window.removeEventListener("resize", set); document.documentElement.style.setProperty("--hdr", "0px"); };
  }, []);
  const sup = SUPPLIERS.find((s) => s.id === "TB")!;
  const me = PEOPLE.supplier;

  const docs = DOCS.filter((d) => d.sup === sup.id && d.filed !== false);
  const invoices = INVOICES.filter((i) => i.sup === sup.id);
  const upcoming = docs.filter((d) => d.exec === "signed" && d.expiry && d.expiry >= DEMO_TODAY).sort((a, b) => (a.expiry! < b.expiry! ? -1 : 1));
  const next = upcoming[0];
  const f = facts(snap);
  const pos = docs.filter((d) => d.po);

  const disagreed = snap.supplierReply === "disagreed";
  const agreed = snap.supplierReply === "agreed";
  const hasMessage = !!snap.done.A7 && !agreed;
  const waitingOnLarkspur = disagreed && !snap.replyResent;

  const card = "rounded-xl border border-[var(--line)] p-5";
  const th = "p-2.5 font-semibold border-r border-[var(--line)] last:border-r-0 text-left";
  const td = "p-2.5 border-r border-[var(--line)] last:border-r-0 align-top";

  return (
    <div className="min-h-screen">
      <header ref={barRef} className="bg-navy text-white md:sticky md:top-0 z-40">
        <div className="page py-2 flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="inline-flex items-center gap-3"><button type="button" onClick={() => { setTab("Overview"); window.scrollTo(0, 0); }} aria-label="Docket: back to the portal home" className="rounded-lg"><Logo /></button><span className="text-sm text-white/80">Supplier portal</span></span>
          <nav className="flex flex-wrap" aria-label="Supplier portal">
            {TABS.map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? "page" : undefined}
                className={`min-h-[44px] lg:min-h-[36px] px-3 rounded-lg text-sm hover:bg-white/10 ${tab === t ? "bg-white/15 font-semibold" : ""}`}>{t}</button>
            ))}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span>{me.name}, {sup.short}</span>
            <button type="button" className="min-h-[44px] lg:min-h-[36px] px-2.5 rounded-lg hover:bg-white/10" onClick={signOut}>Sign out</button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {tab === "Case analysis" ? <CaseStudy /> : (
      <main className="page py-6 max-w-6xl">
        <div className="rounded-2xl tint-blue p-5"><h1 className="text-2xl md:text-3xl">{sup.name}</h1>
        <p className="mt-1">Your account with Larkspur Technologies Pvt Ltd. Today is {dmy(DEMO_TODAY)}.</p></div>

        {tab === "Overview" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className={`${card} tint-green`}><p className="text-sm font-semibold"><svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 -mt-0.5"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 14l2 2 4-4" /></svg>Agreements in place</p><p className="mt-1 text-3xl font-display font-bold num">{docs.filter((d) => d.exec === "signed").length}</p></div>
              <div className={`${card} tint-amber`}><p className="text-sm font-semibold"><svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 -mt-0.5"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>Open invoices</p><p className="mt-1 text-3xl font-display font-bold num">{invoices.length}</p></div>
              <div className={`${card} tint-blue`}><p className="text-sm font-semibold"><svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 -mt-0.5"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>Next end date</p>
                <p className="mt-1 text-xl font-display font-bold">{next ? dmy(next.expiry!) : "None"}</p>
                {next && <p className="text-sm text-[var(--muted)]">{next.title}, in {daysBetween(DEMO_TODAY, next.expiry!)} days</p>}</div>
            </div>

            <section aria-labelledby="msg" className={`${card} ${agreed ? "tint-green" : hasMessage ? "story-box" : ""}`} data-tour="action">
              <h2 id="msg" className="text-xl">Messages from Larkspur</h2>
              {!hasMessage && !agreed && <p className="mt-2 text-[var(--muted)]">No messages.</p>}
              {hasMessage && (
                <div className="mt-3">
                  <p className="text-sm text-[var(--muted)]">Email from {PEOPLE.finance.name}, Accounts Payable{snap.replyResent ? ". Larkspur has replied with the signed Amendment 2." : ""}</p>
                  <pre className="mt-2 whitespace-pre-wrap font-[inherit] text-sm rounded-lg border border-[var(--line)] p-3">{disputeEmail(snap)}</pre>
                  {waitingOnLarkspur ? (
                    <p className="mt-3">You replied: "We billed from our standard rate card." Waiting for Larkspur to answer.</p>
                  ) : (
                    <div className="mt-3">
                      <Primary onClick={() => show(snap.supplierAgrees())}>Agree and issue credit note</Primary>
                      <Secondary onClick={() => show(snap.supplierDisagrees())}>Explain why we disagree</Secondary>
                      <p className="mt-1 text-sm text-[var(--muted)]">A credit note is a document from you that reduces what Larkspur owes.</p>
                    </div>
                  )}
                </div>
              )}
              {agreed && <p className="mt-2">You agreed and issued credit note {CREDIT_NOTE_NO}. Larkspur has been told.</p>}
            </section>

            <section aria-labelledby="ct" className={card}>
              <h2 id="ct" className="text-xl">Your contacts at Larkspur</h2>
              <ul className="mt-2 space-y-1 text-sm">
                <li><span className="font-semibold">{sup.owner}</span>: the team that uses your service</li>
                <li><span className="font-semibold">{PEOPLE.finance.name}</span>, {PEOPLE.finance.title}: invoices and payments</li>
                <li><span className="font-semibold">{PEOPLE.procurement.name}</span>, {PEOPLE.procurement.title}: agreements</li>
              </ul>
            </section>
          </div>
        )}

        {tab === "Agreements" && (
          <section className="mt-6" aria-labelledby="ag">
            <h2 id="ag" className="text-xl">Agreements <Label kind="simulated" source="Shared drive and e-signature platform" /></h2>
            <div className="mt-3 overflow-x-auto border border-[var(--line)] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[var(--panel)]"><tr><th className={th}>Document</th><th className={th}>Type</th><th className={th}>Signed</th><th className={th}>Starts</th><th className={th}>Ends</th><th className={th}>Covers</th><th className={th}>Status</th></tr></thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id} className="border-t border-[var(--line)]">
                      <td className={td}>{d.title}</td>
                      <td className={td}>{TYPE_NAME[d.type] ?? d.type}</td>
                      <td className={td}>{d.signed ? dmy(d.signed) : "Not signed by both parties"}</td>
                      <td className={td}>{dmy(d.effective)}</td>
                      <td className={td}>{d.expiry ? dmy(d.expiry) : "No end date"}</td>
                      <td className={td}>{d.scope === "All" || d.scope === "All SOWs" ? "The whole agreement" : d.scope}</td>
                      <td className={td}><span className={`pill ${d.exec === "signed" ? "pill-ok" : "pill-wait"}`}>{d.exec === "signed" ? "Signed by both" : "Not signed by both"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="mt-6 text-lg">Purchase orders</h3>
            <ul className="mt-1 text-sm space-y-1">{pos.map((d) => <li key={d.id}><span className="num font-semibold">{d.po}</span>, {d.title}</li>)}</ul>
            <h3 className="mt-6 text-lg">What each document says</h3>
            <div className="mt-2 space-y-2">
              {docs.map((d) => (
                <details key={d.id} className="rounded-lg border border-[var(--line)] p-3">
                  <summary className="cursor-pointer min-h-[36px] flex items-center font-semibold">{d.title}</summary>
                  <ul className="mt-2 space-y-2 text-sm">{d.clauses.map((c) => <li key={c.ref}><span className="text-[var(--muted)]">Page {c.page}, clause {c.ref}</span><br />{c.text}</li>)}</ul>
                </details>
              ))}
            </div>
          </section>
        )}

        {tab === "Invoices" && (
          <section className="mt-6 space-y-6" aria-labelledby="iv">
            <div>
              <h2 id="iv" className="text-xl">Open invoices <Label kind="simulated" source="ERP (accounts payable)" /></h2>
              <div className="mt-3 overflow-x-auto border border-[var(--line)] rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--panel)]"><tr><th className={th}>Invoice</th><th className={th}>Dated</th><th className={th}>Due</th><th className={`${th} text-right`}>Before GST</th><th className={`${th} text-right`}>GST</th><th className={`${th} text-right`}>Total</th><th className={th}>Status</th></tr></thead>
                  <tbody>
                    {invoices.map((i) => { const t = checkInvoice(i, {}).totals; return (
                      <tr key={i.id} className="border-t border-[var(--line)]">
                        <td className={td}>{i.id}</td><td className={td}>{dmy(i.date)}</td><td className={td}>{dmy(i.due)}</td>
                        <td className={`${td} text-right num`}>{inr(t.sub)}</td><td className={`${td} text-right num`}>{inr(t.gst)}</td><td className={`${td} text-right num font-semibold`}>{inr(t.total)}</td>
                        <td className={td}><span className="pill pill-wait">Open, due {dmy(i.due)}</span></td>
                      </tr>); })}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-lg">Credit notes you have issued</h3>
              {agreed
                ? <p className="mt-1 text-sm"><span className="font-semibold">{CREDIT_NOTE_NO}</span> for invoice {f.inv.id}: <span className="num">{inr(f.base)}</span> plus GST <span className="num">{inr(f.gst)}</span></p>
                : <p className="mt-1 text-sm text-[var(--muted)]">None.</p>}
            </div>
            <div>
              <h3 className="text-lg">Earlier invoices, paid</h3>
              <p className="mt-1 text-sm num">{PAID_INVOICE_NUMBERS.join(", ")}</p>
            </div>
          </section>
        )}
      </main>)}
    </div>
  );
}
