import { useState } from "react";
import { Link } from "react-router-dom";
import { AI_RUNS } from "../lib/aiRuns";
import { DEMO_TODAY, DOCS, FILE_VERSIONS, TERMS, TRACKER_FILE } from "../lib/data";
import { coverage, grounded, inr, pickOperative, trackerCheck } from "../lib/engine";
import { blFees } from "../lib/contracts";
import { dmy } from "../lib/copy";
import { checkStateOf } from "../lib/ledger";
import { useStore, useToast } from "../lib/store";
import ItemFrame from "../components/ItemFrame";
import Label from "../components/Label";
import { Gate, Primary, ProofCard, Quote, Secondary } from "../components/ui";
import { Done } from "./CaseA";

export default function CaseFI({ id }: { id: string }) {
  switch (id) {
    case "F": return <VersionCheck />;
    case "G": return <TrackerCheck />;
    case "H": return <Coverage />;
    case "I1": return <Brightline />;
    case "I2": return <Zenith />;
    default: return null;
  }
}

const Table = ({ head, children }: { head: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto border border-[var(--line)] rounded-lg">
    <table className="w-full text-sm">
      <thead className="text-left text-[var(--muted)]"><tr>{head.map((h, i) => <th key={h} className={`p-2 ${i > 1 && h.match(/Amount|Spend/) ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

// ---------- Case F: which TalentBridge main contract counts ----------
function VersionCheck() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const pick = pickOperative();
  const op = pick.operative!;
  return (
    <ItemFrame caseId="F" crumb="TalentBridge main contract versions" status="No due date. Legal looks at this after the money items."
      title={`Docket found ${FILE_VERSIONS.length} files for the TalentBridge main contract. Only ${FILE_VERSIONS.filter((f) => f.signedBoth).length} is signed by both parties.`}
      what={<p>The same contract exists as Word drafts on a shared drive, one emailed copy and a signed PDF. Only one of them is the agreement. Docket picked it using the rule below, and Legal confirms.</p>}
      proof={<div className="space-y-3">
        <p className="text-sm"><Label kind="simulated" source="Connected inboxes and shared folders (scanning)" /></p>
        <Table head={["File", "Where", "Date", "Result"]}>
          {FILE_VERSIONS.map((f) => {
            const diff = pick.diffs.find((d) => d.name === f.name);
            return (
              <tr key={f.name} className="border-t border-[var(--line)] align-top">
                <td className="p-2">{f.name}<span className="block text-xs text-[var(--muted)]">{f.format}</span></td>
                <td className="p-2">{f.where}</td>
                <td className="p-2 num">{dmy(f.date)}</td>
                <td className="p-2">{f === op ? <span className="text-ok font-semibold">This one counts. Signed by both parties. E-signature {f.eSign}.</span>
                  : <span>{snap.done.F ? "Not current" : "Draft, not signed"}{diff ? <span className="block text-gap">{diff.note}</span> : null}</span>}</td>
              </tr>
            );
          })}
        </Table>
        <p className="text-sm border border-[var(--line)] rounded-lg p-3"><span className="font-semibold">The rule:</span> the version that counts is signed by both parties and has a completed e-signature record. If more than one or none qualifies, Legal decides. <Label kind="calculated" /></p>
      </div>}
      action={<Gate owner="legal" done={!!snap.done.F} doneNode={<Done>{op.name} confirmed as the contract that counts. The other {pick.others.length} files are marked "Not current" everywhere.</Done>}>
        <Primary onClick={() => show(snap.confirmSigned())}>Confirm the signed copy and mark drafts as not current</Primary>
      </Gate>}
      how={<p>Only {op.name} has both signatures and a completed e-signature record, so exactly one file qualifies. Docket compared the Senior Developer rate in each file: {pick.diffs.map((d) => d.note).join(". ")}. <Label kind="calculated" /></p>} />
  );
}

// ---------- Case G: the Excel tracker vs the contracts ----------
const fmt = (field: string, v: number) => (field === "notice" ? `${v} days` : field.startsWith("rate") ? `${inr(v)}/hr` : `${v}%`);

function TrackerCheck() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const rows = trackerCheck(checkStateOf(snap), DEMO_TODAY);
  const waiting = (r: (typeof rows)[number]) => r.row.sup === "TB" && snap.termState.t4 !== "verified";
  const bad = rows.filter((r) => !r.match);
  const open = bad.filter((r) => !snap.trackerFixed[r.row.sup]).length;
  const corrected = bad.filter((r) => !waiting(r)).map((r) => `${r.row.cell}: ${fmt(r.row.field, r.contract!)}`).join("\n");
  const copy = async () => { try { await navigator.clipboard.writeText(corrected || "Nothing to correct yet."); show("Copied."); } catch { show("Could not copy."); } };
  return (
    <ItemFrame caseId="G" crumb="Excel tracker check" status="No due date. Fixing it takes a few minutes."
      title={`Procurement's tracker disagrees with the contracts in ${open} ${open === 1 ? "place" : "places"}.`}
      what={<p>Teams copy contract terms into Excel, and the copies drift. Docket compared each tracker row with the signed contract.</p>}
      proof={<div className="space-y-3">
        <p className="text-sm"><Label kind="simulated" source={TRACKER_FILE} /> {TRACKER_FILE}</p>
        <Table head={["Row", "Tracker says", "Contract says", "Result"]}>
          {rows.map((r) => {
            const fixed = !!snap.trackerFixed[r.row.sup];
            return (
              <tr key={r.row.cell} className="border-t border-[var(--line)] align-top">
                <td className="p-2">{r.row.label}</td>
                <td className="p-2 num">{fmt(r.row.field, r.row.value)}<span className="block text-xs text-[var(--muted)]">{r.row.cell}</span></td>
                <td className="p-2 num">{waiting(r) ? "Waiting for Legal" : <>{r.row.field === "notice" ? `${r.contract} days received` : fmt(r.row.field, r.contract!)}<span className="block text-xs text-[var(--muted)]">{r.source}</span></>}</td>
                <td className="p-2">{r.match ? <span className="text-ok">Match</span> : fixed ? <span className="text-ok">Fixed</span> : waiting(r) ? <span className="text-locked">Waiting for Legal to check Amendment 2</span> : <span className="text-gap">{r.consequence}</span>}</td>
              </tr>
            );
          })}
        </Table>
        <p className="text-sm">Docket always follows the signed contract. The tracker is a copy that drifted.</p>
      </div>}
      action={<Gate owner="procurement" done={!!snap.done.G} doneNode={<Done>All tracker rows now agree with the contracts.</Done>}>
        <Primary onClick={() => show(snap.fixTracker())}>Update the tracker from Docket</Primary>
        <Secondary onClick={copy}>Copy corrected rows</Secondary>
        <p className="mt-2 text-sm text-[var(--muted)]">Docket cannot edit your Excel file on a static site. It records the fix, and you paste the corrected rows into the tracker.</p>
      </Gate>}
      how={<p>Each row is compared with the term in force today for the same supplier and project order. Dates are worked out with the working-day rules. <Label kind="calculated" /></p>} />
  );
}

// ---------- Case H: paid without a contract ----------
function Coverage() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const c = coverage(snap.addedDocs);
  const before = coverage({});
  return (
    <ItemFrame caseId="H" crumb="Coverage check" status="No due date."
      title={`${c.paid} suppliers were paid this year. ${c.covered} have a contract in Docket.`}
      what={<p>By supplier that is {c.bySupplierPct}% covered. By spend it is {c.bySpendPct}%. Most money is covered, but a third of suppliers are not. Shadow spend hides in small amounts.</p>}
      proof={<div className="space-y-3">
        <p className="text-sm"><Label kind="simulated" source="ERP and corporate card feed" /> Suppliers paid this year with no signed contract in Docket:</p>
        <Table head={["Supplier", "How they were paid", "Amount", "Next step"]}>
          {c.shadow.map((s) => (
            <tr key={s.name} className="border-t border-[var(--line)] align-top">
              <td className="p-2">{s.name}{s.sup === "ZE" && <span className="block text-xs">Docket found a signed quote that may be the contract. <Link to="/item/I2" className="underline">See it</Link></span>}</td>
              <td className="p-2">{s.how}</td>
              <td className="p-2 text-right num">{inr(s.amount)}</td>
              <td className="p-2">{snap.requested[s.name] ? <span className="text-ok">Request started</span>
                : <Gate owner="procurement" done={false} doneNode={null}><Primary onClick={() => show(snap.requestContract(s.name))}>Start a contract request</Primary></Gate>}</td>
            </tr>
          ))}
        </Table>
        {c.shadow.length === 0 && <p className="text-sm">Every supplier paid this year now has a contract in Docket.</p>}
        {c.covered !== before.covered && <p className="text-sm">Before the Zenith quote was added: {before.covered} of {before.paid}. Now: {c.covered} of {c.paid}.</p>}
      </div>}
      action={<Done>{snap.done.H ? "Contract requests started for every supplier on the list. Intake takes it from here." : "Start a contract request for each supplier above. Intake is outside this release, so Docket logs each request for intake."}</Done>}
      how={<p className="num">{c.covered} of {c.paid} suppliers = {c.bySupplierPct}%. By spend: {c.bySpendPct}%. Both are shown because spend coverage hides small shadow suppliers. <Label kind="calculated" /></p>} />
  );
}

// ---------- Case I1: Brightline side letter ----------
function Brightline() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const [open, setOpen] = useState(false), [reason, setReason] = useState("");
  const doc = DOCS.find((d) => d.id === "BL-SL1")!, c = doc.clauses[0];
  const ai = AI_RUNS["BL-SL1"][0];
  const f = blFees(snap.addedDocs);
  const added = !!snap.addedDocs["BL-SL1"];
  const rejected = snap.rejectedDocs["BL-SL1"];
  return (
    <ItemFrame caseId="I" crumb="Brightline side letter" status={`Next retainer invoice about ${dmy("2026-12-01").replace(" 2026", "")}.`}
      title="Docket found a signed Brightline side letter that is not in the contract family."
      what={<p>The letter was found in Sana Iqbal's email. It was signed by both parties on {dmy(doc.signed!)} and gives {inr(f.gap)} a month off the retainer for October to December. Without it Larkspur would pay {inr(f.gap)} a month too much for the rest of the quarter.</p>}
      proof={<div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProofCard title="Side letter says"><Quote text={c.text} from={`Side letter, page ${c.page}, clause ${c.ref}. ${doc.source}`} />
            <p><Label kind="ai" /> {ai.value}. Confidence {Math.round(ai.confidence * 100)}%.</p></ProofCard>
          <ProofCard title="Fee in force" label={{ kind: "calculated" }}>
            <p className="num">Oct to Dec, without the letter: {inr(f.before)} a month</p>
            <p className="num">Oct to Dec, with the letter: {inr(f.withLetter)} a month</p>
            <p className="num">January 2027 onwards: {inr(f.january)} a month</p>
            <p className="text-[var(--muted)]">Today Docket uses: {inr(f.during)} a month.</p>
          </ProofCard>
        </div>
      </div>}
      action={<Gate owner="legal" done={!!snap.done.I1} doneNode={<Done>{rejected ? `Legal said this is not a valid contract. Reason: ${rejected}.` : `Added to Brightline's contract family. The fee in force for October to December is now ${inr(f.during)} a month. January returns to ${inr(f.january)}. Finance has been told.`}</Done>}>
        <Primary onClick={() => show(snap.addBrightline())}>Add to Brightline's contract family</Primary>
        <Secondary onClick={() => setOpen(!open)}>Not a valid contract</Secondary>
        {open && <div className="mt-3"><label htmlFor="why" className="block text-sm">Why is it not valid?</label>
          <textarea id="why" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 w-full border border-[var(--line)] rounded-lg p-2 bg-transparent" />
          <div className="mt-2"><Primary disabled={!reason.trim()} onClick={() => show(snap.rejectBrightline(reason.trim()))}>Send reason</Primary></div></div>}
      </Gate>}
      how={<><p>{added ? "The letter is now filed, so it counts." : "Until Legal adds it, the letter does not count."} Docket checked the term dates: it starts {dmy(TERMS.find((t) => t.id === "t13")!.from)} and ends {dmy(TERMS.find((t) => t.id === "t13")!.to!)}.</p>
        <p>Evidence check: {grounded(doc.clauses.map((x) => x.text).join("\n"), ai.quote) ? "Quote found in the document." : "Quote NOT found."} This proves the quote exists, not that its meaning was read correctly. <Label kind="ai" /></p></>} />
  );
}

// ---------- Case I2: Zenith signed quote ----------
function Zenith() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const doc = DOCS.find((d) => d.id === "ZE-Q")!, c = doc.clauses[0];
  const ai = AI_RUNS["ZE-Q"][0];
  const spend = coverage({}).shadow.find((s) => s.sup === "ZE")!;
  const now = coverage(snap.addedDocs), without = coverage({});
  return (
    <ItemFrame caseId="I" crumb="Zenith Events signed quote" status="No due date."
      title="Docket found a signed Zenith Events quote in a personal folder."
      what={<p>The quote was signed by both parties on {dmy(doc.signed!)} but never filed. It covers three offsites at {inr(TERMS.find((t) => t.id === "t14")!.value as number)} each.</p>}
      proof={<div className="grid gap-3 sm:grid-cols-2">
        <ProofCard title="Quote says"><Quote text={c.text} from={`Signed quote, page ${c.page}, clause ${c.ref}. ${doc.source}`} /><p><Label kind="ai" /> {ai.value}. Confidence {Math.round(ai.confidence * 100)}%.</p></ProofCard>
        <ProofCard title="Payments say" label={{ kind: "simulated", source: "ERP purchase orders" }}><p>{spend.name}: {spend.how}, {inr(spend.amount)} this year.</p>
          <p className="num">Suppliers with a contract in Docket: {without.covered} of {without.paid} now, {coverage({ "ZE-Q": true }).covered} of {without.paid} once this is added.</p></ProofCard>
      </div>}
      action={<Gate owner="legal" done={!!snap.done.I2} doneNode={<Done>Added as Zenith's contract. Suppliers with a contract: {now.covered} of {now.paid}. This was signed outside Procurement. Procurement has been told.</Done>}>
        <Primary onClick={() => show(snap.addZenith())}>Add as Zenith's contract</Primary>
      </Gate>}
      how={<p>Coverage is recalculated once the quote is filed: it moves from {without.covered} of {without.paid} to {coverage({ "ZE-Q": true }).covered} of {without.paid}. <Label kind="calculated" /></p>} />
  );
}
