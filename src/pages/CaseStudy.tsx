import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { SOURCES } from "../lib/data";
import { ASSUMPTIONS, CONFLICTS, LATER_SYSTEMS, METRICS, OWNERSHIP, PHASES, PRECEDENCE, PROTO_VS_PROD, REAL_VS_SIM, RETHINK, SOURCE_SYSTEMS, STAKEHOLDERS, TRIGGERS } from "../lib/studyData";
import { LABEL_KINDS, NAME, TEXT } from "../components/Label";
import StakeholderMap from "../components/StakeholderMap";

const NAV: [string, string][] = [
  ["why", "1. Why this stage"], ["map", "2. Stakeholder map"], ["problem", "3. The problem"], ["prototype", "4. The prototype"], ["metrics", "5. Success metrics"],
  ["built", "How it's built"], ["assumptions", "Assumptions"], ["sources", "Sources"],
];

function Table({ head, rows, wrap }: { head: string[]; rows: ReactNode[][]; wrap?: boolean }) {
  return (
    <div className="mt-3 overflow-x-auto border border-[var(--line)] rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-[var(--panel)]"><tr>{head.map((h) => <th key={h} className="p-2.5 font-semibold border-r border-[var(--line)] last:border-r-0">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-[var(--line)] align-top">{r.map((c, j) => <td key={j} className="p-2.5 border-r border-[var(--line)] last:border-r-0">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
const H2 = ({ id, children }: { id: string; children: ReactNode }) => <h2 id={id} className="text-2xl md:text-3xl scroll-mt-16 border-b border-[var(--line)] pb-2">{children}</h2>;
const H3 = ({ children }: { children: ReactNode }) => <h3 className="mt-6 text-lg">{children}</h3>;
const Src = ({ n }: { n: number }) => <a href="#/case-study?to=sources" className="underline">Source {n}</a>;

export default function CaseStudy() {
  const { search } = useLocation();
  const [active, setActive] = useState("why");
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  useEffect(() => {
    const to = new URLSearchParams(search).get("to");
    if (to) setTimeout(() => go(to), 50);
  }, [search]);
  // Highlight the section being read.
  useEffect(() => {
    const onScroll = () => {
      let cur = NAV[0][0];
      for (const [id] of NAV) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 140) cur = id; }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="pb-10">
      <nav aria-label="Case analysis sections" className="lg:hidden sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--line)]">
        <ul className="page flex gap-1 overflow-x-auto text-sm">
          {NAV.map(([id, label]) => <li key={id} className="shrink-0"><button type="button" onClick={() => go(id)} className={`min-h-[44px] px-3 ${active === id ? "font-semibold underline" : ""}`}>{label}</button></li>)}
        </ul>
      </nav>
      <div className="page lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-4 mt-8 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
            <p className="px-2 pb-2 text-xs font-semibold text-[var(--muted)]">On this page</p>
            <ul className="space-y-0.5">
              {NAV.map(([id, label]) => (
                <li key={id}><button type="button" onClick={() => go(id)} aria-current={active === id ? "true" : undefined}
                  className={`w-full text-left min-h-[36px] px-2 rounded-lg text-sm ${active === id ? "bg-[#1e3f9a] text-white font-semibold" : "hover:bg-[var(--line)]"}`}>{label}</button></li>
              ))}
            </ul>
          </nav>
        </aside>
      <article className="py-8 space-y-4 leading-relaxed prose-wide min-w-0">
        <h1 className="text-3xl md:text-4xl">Clause &amp; Effect: why Docket checks contracts after signature</h1>
        <p className="text-lg">Docket checks that suppliers charge and deliver what the contract promised, and helps people recover the money when they don't.</p>
        <p>Docket is a post-signature contract intelligence layer for Procurement and Finance. It does not claim to invent the category; contract management platforms already work after signature. Its focus is narrow and deep: work out which signed terms actually apply, then check real activity against them.</p>
        <p className="text-sm text-[var(--muted)]">The company using Docket is fictional: Larkspur Technologies Pvt Ltd, 3,000 employees, about 2,500 suppliers.</p>

        <Table head={["Layer", "What it does"]} rows={[
          ["Know what applies", "Reads the contract family, works out the terms in force, keeps clause evidence, Legal checks terms just in time"],
          ["Check what happened", "Compares invoices, renewal deadlines and delivery data with checked terms"],
          ["Fix the gap", "Sends each issue to its owner, drafts the fix, records approvals and only counts confirmed outcomes, then prevents a repeat"],
        ]} />

        {/* ---------- 1 ---------- */}
        <div className="pt-8"><H2 id="why">1. Why this stage</H2></div>
        <p>We chose the intelligent repository. The brief names three losses: unreviewed auto-renewals, missed service levels, and invoices that don't match agreed prices. All three happen after a contract is signed.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>A searchable archive doesn't fix "rarely looked at again". Docket compares real events (an invoice, a deadline, a month of delivery data) with the contract and brings each gap to its owner.</li>
          <li>The value can be measured in rupees: a credit note, an invoice offset, a renegotiated renewal.</li>
          <li>Research supports the focus: Ironclad's summary of the WorldCC and CCM Institute 2026 study reports that poor oversight after signing is a top-three cause of value erosion in every segment it surveyed. (<Src n={2} />)</li>
        </ul>
        <H3>Scope boundaries</H3>
        <Table head={["In scope", "Outside this release"]} rows={[[
          <ul key="a" className="list-disc pl-5 space-y-1">
            <li>Contract families, terms in force, Legal checking</li>
            <li>Professional-services invoice checks</li>
            <li>Renewal decisions with notice rules</li>
            <li>One service-level rule type (on-time %, credit, cap)</li>
            <li>"No matching contract" routed to intake</li>
            <li>A simple supplier response view</li>
          </ul>,
          <ul key="b" className="list-disc pl-5 space-y-1">
            <li>Bulk migration of old documents (the prototype shows the version check and inbox scanning on a small set)</li>
            <li>Other invoice categories</li>
            <li>A supplier portal with logins</li>
            <li>A general service-level engine</li>
            <li>External event monitoring (for example supplier insolvency)</li>
            <li>The intake workflow itself</li>
          </ul>,
        ]]} />

        {/* ---------- 2 ---------- */}
        <div className="pt-8"><H2 id="map">2. Stakeholder map</H2></div>
        <p>Eight people or teams have a stake in this stage. Docket sits in the middle. The dashed lines are the places where their interests pull against each other.</p>
        <H3>The map</H3>
        <StakeholderMap />
        <p className="text-sm text-[var(--muted)]">The same content as tables, for anyone who cannot use the map.</p>
        <H3>Who has a stake</H3>
        <Table head={["Stakeholder", "Role in this stage", "Wants"]} rows={STAKEHOLDERS} />
        <H3>Where interests conflict</H3>
        <Table head={["Between", "The conflict and how Docket handles it"]} rows={CONFLICTS.map((c) => [`${c.id}. ${c.title}`, c.text])} />
        <H3>Who owns what</H3>
        <Table head={["Decision or task", "Accountable", "Does the work"]} rows={OWNERSHIP} />
        <H3>How much Docket does on its own</H3>
        <Table head={["Docket", "What that means"]} rows={[
          ["Does alone", "Reads documents, links the contract family, applies the precedence rules, calculates rates, deadlines and credits, checks quotes against sources, flags and routes."],
          ["Drafts for a person to approve", "Disputes, claims, notices, PO update requests, part-payment holds, renewal recommendations, role mappings."],
          ["Never", "Sends anything itself, moves or blocks money, decides an unclear clause, turns an AI suggestion into a confirmed overcharge."],
        ]} />
        <H3>Earned autonomy</H3>
        <p className="text-sm text-[var(--muted)]">Pilot thresholds, to be recalibrated. These stay locked until the evidence is in.</p>
        <ul className="space-y-2">
          {[
            "Suggest part-payment holds automatically for this supplier: unlocks after 95% of Docket's flags are confirmed by Finance over 100 flags.",
            "Pre-fill renewal notices: unlocks after 20 renewals with no Legal corrections.",
          ].map((t) => (
            <li key={t} className="flex gap-3 items-start border border-[var(--line)] rounded-lg p-3 text-locked">
              <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="mt-1 shrink-0"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" /><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
              <span><span className="font-semibold">Locked.</span> {t}</span>
            </li>
          ))}
        </ul>

        {/* ---------- 3 ---------- */}
        <div className="pt-8"><H2 id="problem">3. The problem</H2></div>
        <H3>Who it hits</H3>
        <p>Finance pays above agreed rates because purchase-order matching doesn't see contract changes. Procurement misses notice windows. Operations live with poor service without the credits the contract promises.</p>
        <H3>Why it matters</H3>
        <p>Context, not a savings claim: WorldCC finds the average business loses almost 9% of value each year through poor contract management (<Src n={1} />). That measures broad contract value erosion, not a share of supplier spend, and Docket does not claim it.</p>
        <p>The core of the problem is simple: signed contracts are disconnected from the systems that show what was actually charged, used and delivered. Two things make it worse:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><span className="font-semibold">Version chaos:</span> the same contract exists as several Word drafts, an emailed copy and a signed PDF, and people copy terms into Excel trackers that drift. Which one is true? (Docket: <Link to="/item/F" className="underline">version check</Link> and <Link to="/item/G" className="underline">tracker check</Link>.)</li>
          <li><span className="font-semibold">Shadow contracts:</span> suppliers paid with no contract on file, contracts signed outside Procurement, and side letters that live in someone's inbox. (Docket: <Link to="/item/H" className="underline">coverage check</Link> and <Link to="/item/I1" className="underline">found outside Docket</Link>.)</li>
        </ul>
        <H3>How we know it's real</H3>
        <p>The brief names these exact losses; independent research (<Src n={1} /> to <Src n={3} />); and, for this company, a 30-day proof plan:</p>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Inventory signed documents and rebuild contract families for the top 50 suppliers.</li>
          <li>Check 3 months of their invoices against terms in force and measure the difference rate, the value Finance confirms and the share recovered.</li>
          <li>List renewals in the last 12 months that had no recorded decision.</li>
          <li>Interview AP, Procurement, Legal and business owners.</li>
        </ol>
        <p className="font-semibold">We deliberately give no headline rupee figure. It will come from the 30-day audit.</p>

        {/* ---------- 4 ---------- */}
        <div className="pt-8"><H2 id="prototype">4. The prototype</H2></div>
        <p>What you can try: three chapters (Invoice, Renewal, Service credit), five roles, every step changes the state. Start from the <Link to="/" className="underline">To-do</Link> page, switch role with "Viewing as", and open any item.</p>
        <H3>Labels legend</H3>
        <Table head={["Label", "What it means"]} rows={LABEL_KINDS.map((k) => [<span key={k} className={`lbl lbl-${k}`}>{NAME[k]}</span>, TEXT[k]])} />
        <H3>What is real vs simulated</H3>
        <Table head={["Part", "Status", "Detail"]} rows={REAL_VS_SIM} />
        <p>Sample documents are modelled on Law Insider contract types (Service Agreement, Statement of Work, Subscription Agreement, Services Agreement, Consulting Agreement). All company names are fictional. <a className="underline" href="https://www.lawinsider.com/tags/category" target="_blank" rel="noreferrer">Law Insider sample contract categories</a>.</p>

        {/* ---------- 5 ---------- */}
        <div className="pt-8"><H2 id="metrics">5. Success metrics</H2></div>
        <H3>North star</H3>
        <p>Rupees recovered or avoided, confirmed by Finance, reported by type (cash recovered, credits received, cost avoided, negotiated savings), one-off vs annual, excluding GST. See it counted on the <Link to="/value" className="underline">Value</Link> page.</p>
        <H3>How we'll know it works</H3>
        <Table head={["Measure", "What we track"]} rows={METRICS} />
        <H3>Pilot validation</H3>
        <p>Precision from Finance reviewing every flag; recall from Finance hand-checking about 200 random unflagged lines; deliberate edge cases (unclear role names, unapproved expenses, cap exceptions, invoices across two rate periods).</p>
        <div className="mt-3 overflow-x-auto">
          <table className="text-sm border border-[var(--line)]">
            <caption className="text-left text-[var(--muted)] pb-1">Confusion matrix template, to be filled in the pilot</caption>
            <thead><tr><th className="p-2 border border-[var(--line)]"></th><th className="p-2 border border-[var(--line)]">Real difference</th><th className="p-2 border border-[var(--line)]">No real difference</th></tr></thead>
            <tbody>
              <tr><th className="p-2 border border-[var(--line)] text-left">Flagged</th><td className="p-2 border border-[var(--line)]">Flagged and real: ___</td><td className="p-2 border border-[var(--line)]">Flagged but not real: ___</td></tr>
              <tr><th className="p-2 border border-[var(--line)] text-left">Not flagged</th><td className="p-2 border border-[var(--line)]">Missed: ___</td><td className="p-2 border border-[var(--line)]">Correctly not flagged: ___</td></tr>
            </tbody>
          </table>
        </div>
        <H3>Phases</H3>
        <Table head={["When", "What", "What we measure"]} rows={PHASES} />
        <p>Targets are set from the day-30 measured rate.</p>
        <H3>What would make us rethink</H3>
        <p className="text-sm text-[var(--muted)]">Pilot thresholds, to be recalibrated.</p>
        <ul className="list-disc pl-6 space-y-2">{RETHINK.map((r) => <li key={r}>{r}</li>)}</ul>
        <p>Always check coverage and action rates first, so a slow supplier response is not blamed on the product.</p>

        {/* ---------- How it's built ---------- */}
        <div className="pt-8"><H2 id="built">How it's built</H2></div>
        <div className="mt-2 overflow-x-auto">
          <ol className="flex items-stretch gap-2 min-w-[640px] text-sm" aria-label="How Docket is built">
            {["Source systems", "Know what applies", "Check what happened", "Fix the gap", "Value and History"].map((s, i, a) => (
              <li key={s} className="flex items-center gap-2 grow">
                <span className="grow text-center border border-[var(--line)] rounded-lg p-3 font-semibold">{s}</span>
                {i < a.length - 1 && <span aria-hidden className="text-[var(--muted)]">→</span>}
              </li>
            ))}
          </ol>
        </div>
        <H3>What starts a check</H3>
        <Table head={["Event", "What Docket does"]} rows={TRIGGERS} />
        <H3>AI, code and people</H3>
        <Table head={["Who", "Does what"]} rows={[
          ["AI reads", "Extracts terms and quotes from documents, flags unclear clauses, suggests a role match."],
          ["Code calculates", "All money and date maths: rates, deadlines, credits, precedence. Tested, never done by AI."],
          ["People decide", "Confirm terms, approve disputes and claims, decide renewals, send letters and emails."],
        ]} />
        <H3>Precedence rules</H3>
        <ol className="list-decimal pl-6 space-y-1">{PRECEDENCE.map((p) => <li key={p}>{p}</li>)}</ol>
        <H3>Prototype vs production</H3>
        <Table head={["", "This prototype", "In production"]} rows={PROTO_VS_PROD} />
        <H3>Source systems</H3>
        <Table head={["Source system", "What Docket takes", "Used in"]} rows={SOURCE_SYSTEMS} />
        <p className="text-sm text-[var(--muted)]">These are assumed and simulated in the prototype. Each "Simulated data" label names its source system.</p>
        <H3>Later</H3>
        <p>Other source systems a real rollout would add:</p>
        <Table head={["Source system", "Why it matters"]} rows={LATER_SYSTEMS} />

        {/* ---------- Assumptions ---------- */}
        <div className="pt-8"><H2 id="assumptions">Assumptions</H2></div>
        <Table head={["Code", "Assumption", "Why", "If wrong"]} rows={ASSUMPTIONS.map((a) => [<span key={a.code} className="font-semibold">{a.code}</span>, a.text, a.why, a.wrong])} />

        {/* ---------- Sources ---------- */}
        <div className="pt-8"><H2 id="sources">Sources</H2></div>
        <Table head={["Publisher", "Year", "What it measures", "How Docket uses it", "Link"]} rows={SOURCES.map((s, i) => [
          <span key="p"><span className="font-semibold">Source {i + 1}:</span> {s.pub}</span>, s.year, s.metric, s.use,
          <a key="l" href={s.url} target="_blank" rel="noreferrer" className="underline">Open</a>,
        ])} />
      </article>
      </div>
    </main>
  );
}
