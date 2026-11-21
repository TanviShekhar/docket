import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DEMO_TODAY, DOCS, SUPPLIERS, TERMS, type Doc } from "../lib/data";
import { resolveTerm, sameDoc, withFiled, withState } from "../lib/engine";
import { dmy } from "../lib/copy";
import { checkStateOf } from "../lib/ledger";
import { useStore } from "../lib/store";
import EvidenceDrawer, { fmtTerm, STATE_TEXT } from "../components/EvidenceDrawer";
import Label from "../components/Label";

const TYPE_NAME: Record<string, string> = { MSA: "Main contract (MSA)", SOW: "Project order (SOW)", Amendment: "Change to the contract", "Side letter": "Side letter", Subscription: "Main contract", Agreement: "Main contract", Retainer: "Main contract", "Signed quote": "Signed quote" };

function sourceLabel(d: Doc) {
  const e = d.source.match(/E-signature envelope (ES-\d+)/);
  if (e) return `E-signature envelope ${e[1]}`;
  if (/^Shared drive/.test(d.source)) return "Shared drive";
  if (/Email attachment/.test(d.source)) return "Email attachment";
  if (/Scanned paper/.test(d.source)) return "Scanned paper";
  return d.source.split(":")[0];
}

function DocCard({ d, drafts }: { d: Doc; drafts?: boolean }) {
  const counts = d.exec === "signed";
  return (
    <div className={`border rounded-lg p-3 text-sm ${counts ? "border-[var(--line)]" : "border-dashed border-[var(--muted)]"}`}>
      <p className="font-semibold">{d.title}</p>
      <p className="text-xs text-[var(--muted)]">{TYPE_NAME[d.type]}</p>
      <dl className="mt-2 grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1">
        <dt className="text-[var(--muted)]">Signed</dt><dd>{d.signed ? dmy(d.signed) : "Not signed by the supplier"}</dd>
        <dt className="text-[var(--muted)]">Starts</dt><dd>{dmy(d.effective)}</dd>
        <dt className="text-[var(--muted)]">Covers</dt><dd>{d.scope === "All" || d.scope === "All SOWs" ? "Everything under the main contract" : d.scope}</dd>
        <dt className="text-[var(--muted)]">Source</dt><dd>{sourceLabel(d)}</dd>
      </dl>
      {!counts && <p className="mt-2 inline-block rounded-full border border-[var(--line)] px-2 text-xs text-locked">Does not count: not signed by both parties</p>}
      {drafts && <p className="mt-2 text-xs text-[var(--muted)]">Found in a connected inbox or folder.</p>}
    </div>
  );
}

export default function Supplier() {
  const { id = "" } = useParams();
  const snap = useStore();
  const sup = SUPPLIERS.find((s) => s.id === id);
  const [scope, setScope] = useState<string>("SOW-1");
  const [date, setDate] = useState(DEMO_TODAY);
  const [open, setOpen] = useState<string | null>(null);
  const [upload, setUpload] = useState<string | null>(null);
  if (!sup) return <main className="mx-auto max-w-3xl px-4 py-8"><Link to="/contracts" className="underline">Contracts</Link><h1 className="mt-3 text-3xl">Supplier not found</h1></main>;

  const docs = withFiled(snap.addedDocs).filter((d) => d.sup === id && d.filed !== false);
  const waiting = DOCS.filter((d) => d.sup === id && d.filed === false && !snap.addedDocs[d.id] && !snap.rejectedDocs[d.id]);
  const roots = docs.filter((d) => !d.parent);
  const kids = (p: string) => docs.filter((d) => d.parent === p);
  const sows = docs.filter((d) => d.type === "SOW");
  const scopeUsed = sows.length ? scope : null;

  const terms = withState(checkStateOf(snap));
  const keys = [...new Set(TERMS.filter((t) => t.sup === id).map((t) => t.key))];
  const resolved = keys.map((k) => ({ k, r: resolveTerm(id, k, scopeUsed, date, terms, withFiled(snap.addedDocs)) }));
  const openRow = resolved.find((x) => x.k === open);

  const main = roots[0];
  const tryUpload = () => {
    if (!main) return;
    const original = main.clauses.map((c) => c.text).join("\n");
    const copy = original.replace(/ /g, "  ") + "\n"; // the same document with different spacing
    setUpload(sameDoc(original, copy) ? `Already in Docket as ${main.id}. No second copy was created.` : "This looks like a new document.");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-sm"><Link to="/contracts" className="underline">Contracts</Link> / {sup.short}</nav>
      <h1 className="mt-3 text-3xl md:text-4xl">{sup.name}</h1>
      <p className="mt-1 text-[var(--muted)]">{sup.category}. Owner: {sup.owner}. Modelled on Law Insider type: {sup.lawInsiderType}.</p>

      <section className="mt-8" aria-labelledby="fam">
        <h2 id="fam" className="text-2xl">Contract family</h2>
        <p className="text-sm text-[var(--muted)] mt-1">The documents that make up this supplier's agreement. Only documents signed by both parties count.</p>
        <div className="mt-3 space-y-3">
          {roots.map((r) => (
            <div key={r.id}>
              <DocCard d={r} />
              {kids(r.id).length > 0 && (
                <div className="ml-4 mt-3 pl-4 border-l border-[var(--line)] space-y-3">
                  {kids(r.id).map((k) => <DocCard key={k.id} d={k} />)}
                </div>
              )}
            </div>
          ))}
          {waiting.map((d) => <DocCard key={d.id} d={d} drafts />)}
        </div>
        {waiting.length > 0 && <p className="mt-2 text-sm">Docket found {waiting.length === 1 ? "a document" : "documents"} outside this family. <Link to={d2item(waiting[0].id)} className="underline">Legal decides if it counts</Link>.</p>}
        <div className="mt-4">
          <button type="button" onClick={tryUpload} className="min-h-[44px] px-4 rounded-lg border border-navy font-semibold">Try uploading the main contract again</button>
          {upload && <p className="mt-2 text-sm" role="status">{upload} <Label kind="calculated" /></p>}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="tif">
        <h2 id="tif" className="text-2xl">Terms in force today</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3 text-sm">
          {sows.length > 0 && (
            <label className="flex flex-col">Project order
              <select value={scope} onChange={(e) => setScope(e.target.value)} className="min-h-[44px] border border-[var(--line)] rounded-lg px-2 bg-transparent">
                {sows.map((s) => <option key={s.id} value={s.scope}>{s.scope}</option>)}
              </select>
            </label>
          )}
          <label className="flex flex-col">Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value || DEMO_TODAY)} className="min-h-[44px] border border-[var(--line)] rounded-lg px-2 bg-transparent" />
          </label>
          <span><Label kind="calculated" /></span>
        </div>
        <div className="mt-3 overflow-x-auto border border-[var(--line)] rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--muted)]"><tr><th className="p-2">Term</th><th className="p-2 text-right">Value</th><th className="p-2">From document</th><th className="p-2">Checked?</th><th className="p-2 relative"><span className="sr-only">Evidence</span></th></tr></thead>
            <tbody>
              {resolved.map(({ k, r }) => {
                const t = r.winner?.t;
                const label = t ? t.label : TERMS.find((x) => x.key === k)!.label;
                return (
                  <tr key={k} className="border-t border-[var(--line)] align-top">
                    <td className="p-2">{label}</td>
                    <td className="p-2 text-right num">{t ? fmtTerm(t) : "None applies"}</td>
                    <td className="p-2">{r.winner ? r.winner.doc.title : "No signed document sets this on this date"}</td>
                    <td className="p-2">{t ? <span className={t.state === "verified" ? "text-ok" : t.state === "unverified" ? "text-locked" : "text-warn"}>{STATE_TEXT[t.state]}</span> : "Not applicable"}</td>
                    <td className="p-2"><button type="button" onClick={() => setOpen(k)} className="min-h-[44px] px-2 underline">Evidence</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {openRow && (
        <EvidenceDrawer term={openRow.r.winner?.t ?? openRow.r.cands[0].t} cands={openRow.r.cands} onClose={() => setOpen(null)} />
      )}
    </main>
  );
}

const d2item = (docId: string) => (docId === "BL-SL1" ? "/item/I1" : "/item/I2");
