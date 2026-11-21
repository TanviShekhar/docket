import { AI_RUNS } from "../lib/aiRuns";
import { DOCS, INVOICES, NORTHSTAR_CHECKS, TERMS } from "../lib/data";
import { checkInvoice, grounded, inr } from "../lib/engine";
import { dmy } from "../lib/copy";
import { useStore, useToast } from "../lib/store";
import { dueLine } from "../lib/todo";
import ItemFrame from "../components/ItemFrame";
import Label from "../components/Label";
import { Gate, Primary, ProofCard, Quote } from "../components/ui";
import { Done } from "./CaseA";

export default function CaseDE({ id }: { id: string }) {
  return id === "D" ? <PrimeFacility /> : id === "E" ? <Northstar /> : null;
}

// ---------- Case D: a clause nobody can measure ----------
function PrimeFacility() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const doc = DOCS.find((d) => d.id === "PF-AGR")!;
  const c = doc.clauses[0];
  const term = TERMS.find((t) => t.id === "t9")!;
  const ai = AI_RUNS["PF-AGR"][0];
  const renewMonth = new Date(doc.expiry!).toLocaleString("en-GB", { month: "long", year: "numeric" });
  return (
    <ItemFrame caseId="D" crumb="PrimeFacility maintenance response" status="No due date. Legal looks at this after the money items."
      title={`PrimeFacility's contract says "prompt response" but gives no time limit.`}
      what={<p>Docket cannot measure "prompt response", so it cannot say when PrimeFacility is late or calculate a credit. This is a "no way to measure this" term.</p>}
      proof={<div className="grid gap-3 sm:grid-cols-2">
        <ProofCard title="Contract says"><Quote text={c.text} from={`Facilities Management Agreement, page ${c.page}, clause ${c.ref}`} /></ProofCard>
        <ProofCard title="Docket found"><p>No number of hours or days, and no way to measure a response.</p><p className="text-[var(--muted)]">{term.why}</p><p><Label kind="ai" /> Confidence {Math.round(ai.confidence * 100)}%. {ai.flag}</p></ProofCard>
      </div>}
      action={<Gate owner="legal" done={!!snap.done.D} doneNode={<Done>Added to the renegotiation list for {renewMonth}. Nothing else is needed now.</Done>}>
        <Primary onClick={() => show(snap.addRenegotiation())}>Add to the renegotiation list for {renewMonth}</Primary>
      </Gate>}
      how={<><p>The agreement ends {dmy(doc.expiry!)}, so that is the next chance to add a measurable time limit.</p>
        <p>Evidence check: {grounded(doc.clauses.map((x) => x.text).join("\n"), ai.quote) ? "Quote found in the document." : "Quote NOT found."} This proves the quote exists, not that its meaning was read correctly. <Label kind="ai" /></p></>} />
  );
}

// ---------- Case E: an invoice with no contract ----------
function Northstar() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const inv = INVOICES[1];
  const r = checkInvoice(inv);
  return (
    <ItemFrame caseId="E" crumb={`Northstar Advisory invoice ${inv.id}`} status={dueLine(inv.due, "finance")}
      title={`${inv.entity} sent a ${inr(r.totals.sub)} invoice. Docket found no matching contract.`}
      what={<p>Invoice {inv.id} is for "{inv.lines[0].desc}". There is no purchase order and no contract on file. This is not treated as unauthorised spend until someone checks.</p>}
      proof={<div className="grid gap-3 sm:grid-cols-2">
        <ProofCard title="Invoice says" label={{ kind: "simulated", source: "ERP invoice inbox" }}>
          <p>{inv.entity}, {inv.id}</p><p className="num">{inr(r.totals.sub)} before GST, due {dmy(inv.due)}</p>
        </ProofCard>
        <ProofCard title="Docket looked for a contract" label={{ kind: "simulated", source: "Supplier master and purchase orders" }}>
          <ul className="space-y-2">{NORTHSTAR_CHECKS.map((c) => <li key={c.check}><span className="font-semibold">{c.check}:</span> {c.result}</li>)}</ul>
        </ProofCard>
      </div>}
      action={<Gate owner="finance" done={!!snap.done.E} doneNode={<Done>Sent to Procurement as a new contract request. They have been told.</Done>}>
        <Primary onClick={() => show(snap.sendToIntake())}>Send to Procurement as a new contract request</Primary>
      </Gate>}
      how={<p>Docket matched the supplier name against every contract family and the supplier master. No signed contract and no purchase order matched. <Label kind="calculated" /></p>} />
  );
}
