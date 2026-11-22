import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DEMO_TODAY, DOCS, SUPPLIERS } from "../lib/data";
import { coverage, pickOperative, searchClauses, trackerCheck, withFiled } from "../lib/engine";
import { openItems, questions, rows, sourceName, supName, tagCounts, type Tag } from "../lib/contracts";
import { checkStateOf } from "../lib/ledger";
import { useStore } from "../lib/store";
import Label from "../components/Label";
import ReadContract from "../components/ReadContract";
import FilesBar from "../components/FilesBar";
import Timeline from "../components/Timeline";
import { contractsFile } from "../lib/dataFiles";

const TAG_BADGE: Record<string, string> = { email: "pill-yearly", word: "pill-yearly", drive: "pill-ok", excel: "pill-ok", esign: "pill-wait", scanned: "pill-wait", outside: "pill-wait" };
const ITEM_FOR_DOC: Record<string, string> = { "TB-MSA": "/item/F", "TB-AMD2": "/item/A1", "CD-SUB": "/item/B1", "SH-MSA": "/item/C1", "PF-AGR": "/item/D", "BL-SL1": "/item/I1", "ZE-Q": "/item/I2" };

function Highlight({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(re).map((p, i) => (i % 2 ? <mark key={i} className="bg-yellow-200 text-black rounded-sm">{p}</mark> : <span key={i}>{p}</span>))}</>;
}

const PROOF: [string, string, string, string][] = [
  ["Contracts live in email", "SOW-1 and MSA_v2_clean.docx arrived as email attachments. The strip at the top of this page counts them.", "Email attachments", "/contracts"],
  ["Word attachments", "Amendment 1 is an emailed Word draft that was never signed. The main contract exists as three Word drafts.", "Version check", "/item/F"],
  ["Shared drives", "Most documents sit on shared drives. The version check groups the files in one folder.", "Version check", "/item/F"],
  ["Excel", "Procurement's tracker is checked against the contracts.", "Tracker check", "/item/G"],
  ["Requests get lost", "Intake is outside this release. A supplier with no contract becomes a contract request for intake.", "Coverage", "/item/H"],
  ["Approvals stall", "Every step has a due-by date, a reminder 2 working days before, and an escalation to a named delegate on the due date.", "To-do", "/"],
  ["Rarely looked at again", "Events trigger checks and people get to-dos: an invoice, a deadline, a month of delivery data.", "To-do", "/"],
  ["Unreviewed auto-renewals", "The CloudDesk renewal, and the question \"renewals in the next 90 days\".", "CloudDesk renewal", "/item/B1"],
  ["Missed service levels", "SwiftHaul's October delivery against the 95% target.", "SwiftHaul credit", "/item/C1"],
  ["Invoices not matching agreed prices", "TalentBridge billed above the rate in force.", "TalentBridge invoice", "/item/A2"],
  ["Every relationship runs on a contract (but some don't)", "Suppliers paid with no contract, and contracts signed outside Procurement.", "Coverage", "/item/H"],
  ["One searchable source of truth for every signed contract", "Keyword search, terms in force, version check, tracker check and coverage.", "Search above", "/contracts"],
];

export default function Contracts() {
  const snap = useStore();
  const all = rows(snap);
  const counts = tagCounts(all);
  const [view, setView] = useState<"docs" | "timeline">("docs");
  const [tag, setTag] = useState<Tag | null>(null);
  const [qid, setQid] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [fSup, setFSup] = useState(""), [fType, setFType] = useState(""), [signedOnly, setSignedOnly] = useState(false);
  const qs = questions(snap);
  const shown = tag ? all.filter((r) => r.tags.includes(tag)) : all;
  const docs = useMemo(() => withFiled(snap.addedDocs), [snap.addedDocs]);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length ? searchClauses(q, { sup: fSup || undefined, type: fType || undefined, signedOnly }, docs) : [];
  const pick = pickOperative(), tr = trackerCheck(checkStateOf(snap), DEMO_TODAY), cov = coverage(snap.addedDocs);
  const outside = DOCS.filter((d) => d.filed === false);
  const supplierList = SUPPLIERS.filter((s) => s.id !== "ZE" || snap.addedDocs["ZE-Q"]);
  const types = [...new Set(DOCS.map((d) => d.type))];
  const field = "min-h-[44px] border border-[var(--line)] rounded-lg px-2 bg-transparent";

  return (
    <main className="page py-8">
      <h1 className="text-3xl md:text-4xl">Contracts</h1>
      <p className="mt-2 text-[var(--muted)] max-w-3xl">Every contract Docket has found, where it came from, and what it says. Nothing here is typed by hand: counts and answers are worked out from the documents.</p>
      <div role="tablist" aria-label="Contracts views" className="mt-5 flex gap-2">
        {([["docs", "Documents"], ["timeline", "Timeline"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)}
            className={`min-h-[44px] px-4 rounded-lg border text-sm font-semibold ${view === k ? "bg-navy text-white border-navy" : "border-[var(--line)]"}`}>{l}</button>
        ))}
      </div>
      {view === "timeline" ? <Timeline /> : (<>

      <section className="mt-8" aria-labelledby="found">
        <h2 id="found" className="text-2xl">Where Docket found your contracts <Label kind="simulated" source="Shared drives, email, e-signature platform and the Excel tracker" /></h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {counts.map((c) => (
            <button key={c.tag} type="button" aria-pressed={tag === c.tag} onClick={() => setTag(tag === c.tag ? null : c.tag)}
              className={`min-h-[44px] px-3 rounded-lg border text-sm ${tag === c.tag ? "bg-navy text-white border-navy" : "border-[var(--line)]"}`}>
              {c.label} <span className={`num ml-1 inline-block rounded-full px-2 text-xs font-semibold ${TAG_BADGE[c.tag]}`}>{c.n}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">{tag ? `Showing files found in ${sourceName(tag)}. Tap the count again to see everything.` : "Tap a count to filter the list."}</p>
        <div className="mt-3 overflow-x-auto border border-[var(--line)] rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--muted)]"><tr><th className="p-2">Document</th><th className="p-2">Supplier</th><th className="p-2">Type</th><th className="p-2">Where it came from</th><th className="p-2">Status</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-[var(--line)] align-top">
                  <td className="p-2">{ITEM_FOR_DOC[r.id] ? <Link to={ITEM_FOR_DOC[r.id]} className="underline">{r.title}</Link> : r.title}</td>
                  <td className="p-2">{supName(r.sup)}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2">{r.source}</td>
                  <td className="p-2"><span className={r.status.startsWith("Does not count") || r.status === "Not current" || r.status.startsWith("Draft") ? "text-locked" : r.status.startsWith("Found") ? "text-warn" : ""}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="ask">
        <h2 id="ask" className="text-2xl">Ask a question</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {qs.map((x) => (
            <button key={x.id} type="button" aria-pressed={qid === x.id} onClick={() => setQid(qid === x.id ? null : x.id)}
              className={`min-h-[44px] px-3 rounded-lg border text-sm text-left ${qid === x.id ? "bg-navy text-white border-navy" : "border-[var(--line)]"}`}>{x.title}</button>
          ))}
        </div>
        {qs.filter((x) => x.id === qid).map((x) => (
          <div key={x.id} className="mt-3 border border-[var(--line)] rounded-lg p-4">
            <p className="font-semibold">{x.title} <Label kind="calculated" /></p>
            {x.answers.length === 0 ? <p className="mt-2 text-sm">{x.empty}</p> : (
              <ul className="mt-2 space-y-2 text-sm">{x.answers.map((a, i) => <li key={i}>{a.text} {a.link && <Link to={a.link} className="underline">Open</Link>}</li>)}</ul>
            )}
          </div>
        ))}
      </section>

      <section className="mt-10" aria-labelledby="search">
        <h2 id="search" className="text-2xl">Search every clause</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm grow max-w-md">Words to look for
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="for example: notice received" className={field} />
          </label>
          <label className="flex flex-col text-sm">Supplier
            <select value={fSup} onChange={(e) => setFSup(e.target.value)} className={field}><option value="">All suppliers</option>{SUPPLIERS.map((s) => <option key={s.id} value={s.id}>{s.short}</option>)}</select>
          </label>
          <label className="flex flex-col text-sm">Document type
            <select value={fType} onChange={(e) => setFType(e.target.value)} className={field}><option value="">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label className="flex items-center gap-2 min-h-[44px] text-sm"><input type="checkbox" checked={signedOnly} onChange={(e) => setSignedOnly(e.target.checked)} /> Signed and filed only</label>
        </div>
        {words.length > 0 && (
          <div className="mt-3">
            <p className="text-sm">{hits.length} {hits.length === 1 ? "clause" : "clauses"} found <Label kind="rules" /></p>
            <ul className="mt-2 space-y-3">
              {hits.map((h, i) => (
                <li key={i} className="border border-[var(--line)] rounded-lg p-3 text-sm">
                  <p><Highlight text={h.text} words={words} /></p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{h.doc.title}, page {h.page}, clause {h.ref}. {h.doc.source} {ITEM_FOR_DOC[h.doc.id] && <Link to={ITEM_FOR_DOC[h.doc.id]} className="underline">Open related item</Link>}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-10" aria-labelledby="checks">
        <h2 id="checks" className="text-2xl">Checks across your contracts</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[
            { t: "Version check", d: `${pick.others.length + 1} files for the TalentBridge main contract. ${pick.operative!.name} is the one that counts.`, s: snap.done.F ? "Confirmed by Legal" : "Waiting on Legal", to: "/item/F" },
            { t: "Excel tracker check", d: `${tr.filter((x) => !x.match && !snap.trackerFixed[x.row.sup]).length} of ${tr.length} tracker rows disagree with the contracts.`, s: snap.done.G ? "Fixed" : "Waiting on Procurement", to: "/item/G" },
            { t: "Coverage", d: `${cov.covered} of ${cov.paid} suppliers paid this year have a contract in Docket (${cov.bySupplierPct}% by supplier, ${cov.bySpendPct}% by spend).`, s: snap.done.H ? "Requests started" : "Waiting on Procurement", to: "/item/H" },
            { t: "Found outside Docket", d: `${outside.length} signed documents are not in a contract family: ${outside.map((d) => supName(d.sup)).join(" and ")}.`, s: outside.every((d) => snap.done[d.id === "BL-SL1" ? "I1" : "I2"]) ? "All reviewed" : "Waiting on Legal", to: "/item/I1" },
          ].map((p) => (
            <div key={p.t} className="border border-[var(--line)] rounded-lg p-4">
              <h3 className="text-lg">{p.t} <Label kind="calculated" /></h3>
              <p className="mt-1 text-sm">{p.d}</p>
              <p className="mt-2"><span className={`pill ${/Waiting/.test(p.s) ? "pill-wait" : "pill-ok"}`}>{p.s}</span></p>
              <Link to={p.to} className="inline-flex items-center min-h-[44px] underline">Open</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="sups">
        <h2 id="sups" className="text-2xl">Suppliers</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">All companies and documents are fictional. Document types are modelled on the public <a className="underline" href="https://www.lawinsider.com/tags/category" target="_blank" rel="noreferrer">Law Insider sample contract categories</a>.</p>
        <div className="mt-3 overflow-x-auto border border-[var(--line)] rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--muted)]"><tr><th className="p-2">Supplier</th><th className="p-2">Category</th><th className="p-2">Owner</th><th className="p-2 text-right">Open items</th><th className="p-2">Sample type</th></tr></thead>
            <tbody>
              {supplierList.map((s) => (
                <tr key={s.id} className="border-t border-[var(--line)]">
                  <td className="p-2"><Link to={`/supplier/${s.id}`} className="underline">{s.name}</Link></td><td className="p-2">{s.category}</td><td className="p-2">{s.owner}</td>
                  <td className="p-2 text-right num">{openItems(snap, s.id)}</td>
                  <td className="p-2 text-xs text-[var(--muted)]">Modelled on Law Insider type: {s.lawInsiderType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ReadContract />

      <section className="mt-10" aria-labelledby="proof">
        <h2 id="proof" className="text-2xl">How Docket handles the problems in the brief</h2>
        <div className="mt-3 overflow-x-auto border border-[var(--line)] rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--muted)]"><tr><th className="p-2">The brief says</th><th className="p-2">Where Docket handles it</th><th className="p-2">See it</th></tr></thead>
            <tbody>{PROOF.map(([pain, where, label, to]) => (
              <tr key={pain} className="border-t border-[var(--line)] align-top"><td className="p-2">{pain}</td><td className="p-2">{where}</td><td className="p-2"><Link to={to} className="underline">{label}</Link></td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <FilesBar files={[contractsFile(snap)]} />
      </>)}
    </main>
  );
}
