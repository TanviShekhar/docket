import { useState } from "react";
import { Link } from "react-router-dom";
import { AI_JUDGEMENTS, AI_RUNS, EXTRACTION_PROMPT } from "../lib/aiRuns";
import { DOCS, PEOPLE, TIMESHEETS } from "../lib/data";
import { checkInvoice, grounded, inr, resolveTerm } from "../lib/engine";
import { dmy as nice } from "../lib/copy";
import { amendment2, CREDIT_NOTE_NO, december, disputeEmail, facts, poUpdateText } from "../lib/caseA";
import { useStore, useToast } from "../lib/store";
import Label from "../components/Label";
import ItemFrame from "../components/ItemFrame";
import InvoiceTable from "../components/InvoiceTable";
import { AiRead, Gate, HowCard, Primary, ProofCard, Quote, Row, Secondary } from "../components/ui";

const A_PROGRESS = ["Checked by Legal", "Confirmed by Finance", "Sent to supplier", "Supplier agrees", "Credit received", "Price fixed at source"];
const A_STEPS = ["A1", "A5", "A7", "A8", "A9", "A10"];
const clause = (docId: string, ref: string) => DOCS.find((d) => d.id === docId)!.clauses.find((c) => c.ref === ref)!;
const judge = (id: string) => AI_JUDGEMENTS.find((j) => j.id === id)!;

function useA() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const f = facts(snap);
  const rejected = snap.termState.t4 === "rejected";
  const idx = A_STEPS.findIndex((s) => !snap.done[s]);
  const progress = { steps: A_PROGRESS, doneCount: rejected ? 0 : idx === -1 ? A_STEPS.length : idx };
  return { snap, f, show, progress, rejected, crumb: `TalentBridge invoice ${f.inv.id}`, run: (fn: () => string) => show(fn()) };
}

export function Draft({ text }: { text: string }) {
  const show = useToast((t) => t.show);
  const copy = async () => { try { await navigator.clipboard.writeText(text); show("Copied."); } catch { show("Could not copy. Select the text and copy it."); } };
  return (
    <div className="border border-[var(--line)] rounded-lg p-4">
      <p className="text-sm mb-2"><Label kind="template" /> Docket never sends anything. You send this from your own email.</p>
      <pre className="whitespace-pre-wrap text-sm font-[inherit]">{text}</pre>
      <Secondary onClick={copy}>Copy text</Secondary>
    </div>
  );
}

export const Done = ({ children }: { children: React.ReactNode }) => <p>{children}</p>;

export default function CaseA({ id }: { id: string }) {
  switch (id) {
    case "A1": return <A1 />;
    case "A2": return <A2 />;
    case "A3": return <A3 />;
    case "A4": return <A4 />;
    case "A5": return <A5 />;
    case "A6": return <A6 />;
    case "A7": return <A7 />;
    case "A8": case "A8r": return <A8 />;
    case "A9": return <A9 />;
    case "A10": return <A10 />;
    case "A11": return <A11 />;
    default: return null;
  }
}

// ---------- A1 Legal checks the new rate ----------
function A1() {
  const { snap, f, progress, crumb, run, rejected } = useA();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const amd = clause("TB-AMD2", "1"), msa = clause("TB-MSA", "14.2");
  const res = resolveTerm("TB", "rate:Senior Developer", "SOW-1", "2026-10-15");
  const after = checkInvoice(f.inv, { ...snap, termState: { ...snap.termState, t4: "verified" } });
  const line = after.lines[0];
  const j = judge("j-scope"), ai = AI_RUNS["TB-AMD2"][0];
  const amdText = DOCS.find((d) => d.id === "TB-AMD2")!.clauses.map((c) => c.text).join("\n");
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`TalentBridge billed ${inr(f.billed)}/hr. The contract says ${inr(f.rate)} since 1 Oct.`}
      what={<p>A change to the contract (Amendment 2) lowers the Senior Developer rate to {inr(f.rate)}/hr from 1 Oct, for the project order SOW-1 only. An invoice depends on it. Legal needs to check the new rate before anyone can dispute the invoice.</p>}
      proof={<>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProofCard title="Contract says">
            <Quote text={amd.text} from={`Amendment 2, page ${amd.page}, clause ${amd.ref}`} />
            <Quote text={msa.text} from={`Main contract (MSA), page ${msa.page}, clause ${msa.ref}`} />
          </ProofCard>
          <ProofCard title="Invoice says" label={{ kind: "simulated", source: "ERP invoice inbox" }}>
            <p>{f.inv.id}, line 1: {f.inv.lines[0].desc}, {f.inv.lines[0].sow}, October</p>
            <p className="num">{f.inv.lines[0].qty} hours at {inr(f.inv.lines[0].rate)}/hr = {inr(line.amount)}</p>
            <p className="text-gap font-semibold num">{inr(line.diff ?? 0)} over, if the new rate is confirmed</p>
          </ProofCard>
        </div>
        <p className="mt-3 text-sm"><Label kind="ai" /> {j.output}</p>
      </>}
      action={<Gate owner="legal" done={!!snap.done.A1} doneNode={
        <Done>{rejected ? `Legal did not accept this reading. Reason: ${snap.rejectReason.A1}. The invoice line is not being disputed. Finance has been told.`
          : `Checked by ${PEOPLE.legal.name}, Legal. Finance has been told. The invoice line is now a ${inr(line.diff ?? 0)} overcharge.`}</Done>}>
        <Primary onClick={() => run(snap.confirmRate)}>Confirm {inr(f.rate)} for SOW-1</Primary>
        <div className="mt-4 rounded-xl border border-[var(--line)] p-3">
          <label htmlFor="why" className="block font-semibold">Does this reading look wrong?</label>
          <p className="text-sm text-[var(--muted)]">If so, say why. Finance is told and the invoice line is not disputed.</p>
          <textarea id="why" value={reason} onChange={(e) => { setReason(e.target.value); setOpen(false); }} rows={2} placeholder="For example: the change should also cover SOW-2" className="mt-2 w-full border border-[var(--line)] rounded-lg p-2 bg-transparent text-sm" />
          {open && <p role="alert" className="mt-1 text-sm text-gap">Write a short reason first.</p>}
          <div className="mt-2"><Secondary onClick={() => (reason.trim() ? run(() => snap.rejectRate(reason.trim())) : setOpen(true))}>Send reason</Secondary></div>
        </div>
      </Gate>}
      how={<>
        <HowCard title="Which rate wins" label="calculated">
          {res.cands.map((c) => (
            <div key={c.t.id} className="rounded-lg border border-[var(--line)] p-2">
              <p><span className="num font-semibold">{inr(c.t.value as number)}/hr</span> <span className={`pill ${c.reason ? "pill-wait" : "pill-ok"}`}>{c.reason ? "Does not count" : "Counts"}</span></p>
              <p className="text-[var(--muted)]">{c.doc.title}, {c.doc.signed ? `signed ${nice(c.doc.signed)}` : "not signed by both parties"}</p>
              {c.reason && <p>{c.reason}</p>}
            </div>
          ))}
        </HowCard>
        <AiRead field={ai.field} value={ai.value} confidence={ai.confidence} evidenceOk={grounded(amdText, ai.quote)} why={j.why}>
          <details><summary className="cursor-pointer min-h-[44px] flex items-center underline">Show the prompt</summary><pre className="whitespace-pre-wrap text-xs">{EXTRACTION_PROMPT}</pre></details>
        </AiRead>
        <HowCard title="The calculation" label="calculated">
          <Row k="Hours billed">{line.l.qty} h</Row>
          <Row k="Rate gap per hour"><span className="num">{inr(line.l.rate)} − {inr(line.exp ?? 0)} = {inr(f.perHour)}</span></Row>
          <Row k="Difference"><span className="num font-semibold">{inr(line.diff ?? 0)}</span></Row>
          <Row k={`GST at ${Math.round(f.inv.gst * 100)}% on the difference`}><span className="num">{inr(after.totals.disputableGst)}</span></Row>
        </HowCard>
      </>} />
  );
}

// ---------- A2 Finance reviews the invoice ----------
function A2() {
  const { snap, f, progress, crumb } = useA();
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`Invoice ${f.inv.id} has ${f.inv.lines.length} lines. Docket checked each one.`}
      what={<p>{snap.done.A1 ? "Legal has checked the new rate, so line 1 is now an overcharge." : "Line 1 is locked. It depends on a new rate that Legal has not checked yet."} Lines that Docket could not decide on its own wait for your answer.</p>}
      proof={<InvoiceTable id={f.inv.id} res={f.res} />}
      action={snap.done.A1
        ? <Link to="/" className="inline-flex items-center min-h-[44px] px-4 rounded-lg bg-navy text-white font-semibold">Back to your to-do</Link>
        : <Done>Waiting on Legal. Nothing for you to do on this page yet. <Link to="/item/A1" className="underline">See Legal's step</Link></Done>}
      how={<HowCard title="How each line is checked" label="calculated"><p>Each line is compared with the terms in force for its project order and service date.</p><p>A rate that Legal has not checked cannot start a dispute.</p></HowCard>} />
  );
}

// ---------- A3 Finance confirms the role on line 4 ----------
function A3() {
  const { snap, f, progress, crumb, run } = useA();
  const l = f.inv.lines[3];
  const checked = checkInvoice(f.inv, { ...snap, termState: { ...snap.termState, t4: "verified" }, mapConfirmed: { L4: "Senior Developer" } }).lines[3];
  const j = judge("j-map");
  const sch = clause("TB-MSA", "Sch 2");
  const approved = TIMESHEETS["SOW-1|Senior Developer|2026-10"];
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`Line 4 says ${l.desc}. Docket thinks this is a ${l.suggest!.role}.`}
      what={<p>Line 4 of {f.inv.id} says {l.desc}. Docket thinks this is a {l.suggest!.role} ({Math.round(l.suggest!.conf * 100)}% sure). If you agree, line 4 is billed {inr(checked.diff ?? 0)} too high as well.</p>}
      proof={<div className="grid gap-3 sm:grid-cols-2">
        <ProofCard title="Contract says"><Quote text={sch.text} from={`Main contract (MSA), page ${sch.page}, ${sch.ref}`} /><p>There is no Technical Consultant on the rate card.</p></ProofCard>
        <ProofCard title="Timesheet says" label={{ kind: "simulated", source: "Timesheet system" }}>
          <p>{l.suggest!.why}</p>
          <p className="num">{approved} approved hours for Senior Developers in October. {f.inv.lines[0].qty + l.qty} billed.</p>
          <p><Label kind="ai" /> {j.output.replace(/\.$/, "")}</p>
        </ProofCard>
      </div>}
      action={<Gate owner="finance" needsA1 done={!!snap.done.A3} doneNode={<Done>{snap.mapConfirmed.L4 ? `Confirmed by ${PEOPLE.finance.name}: line 4 is a Senior Developer.` : `${PEOPLE.finance.name} said no. Line 4 stays out of the dispute until the supplier explains the role.`}</Done>}>
        <Primary onClick={() => run(() => snap.confirmRole(true))}>Yes, it's a Senior Developer</Primary>
        <Secondary onClick={() => run(() => snap.confirmRole(false))}>No, ask the supplier</Secondary>
      </Gate>}
      how={<>
        <HowCard title="Why Docket thinks so" label="ai"><p>{j.why}</p></HowCard>
        <HowCard title="The calculation" label="calculated">
          <Row k="Hours billed">{l.qty} h</Row>
          <Row k="Rate gap per hour"><span className="num">{inr(l.rate)} − {inr(checked.exp ?? 0)} = {inr(f.perHour)}</span></Row>
          <Row k="Difference"><span className="num font-semibold">{inr(checked.diff ?? 0)}</span></Row>
        </HowCard></>} />
  );
}

// ---------- A4 Travel expense ----------
function A4() {
  const { snap, f, progress, crumb, run } = useA();
  const ex = f.inv.lines[5], c = clause("TB-MSA", "6.4");
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`${inr(ex.rate)} travel has no prior approval on file.`}
      what={<p>The contract needs written approval before a trip. Docket found none for line 6 ({ex.desc}).</p>}
      proof={<div className="grid gap-3 sm:grid-cols-2">
        <ProofCard title="Contract says"><Quote text={c.text} from={`Main contract (MSA), page ${c.page}, clause ${c.ref}`} /></ProofCard>
        <ProofCard title="Invoice says" label={{ kind: "simulated", source: "ERP invoice inbox" }}><p>Line 6: {ex.desc}, {inr(ex.rate)}</p><p>No approval email found before 14 Oct.</p></ProofCard>
      </div>}
      action={<Gate owner="finance" needsA1 done={!!snap.done.A4} doneNode={<Done>{snap.expenseApproved.L6 ? "Approval email attached. The travel line is accepted." : "The travel line will be raised with the supplier as well."}</Done>}>
        <Primary onClick={() => run(() => snap.resolveExpense(true))}>Attach approval email</Primary>
        <Secondary onClick={() => run(() => snap.resolveExpense(false))}>Dispute this line too</Secondary>
      </Gate>}
      how={<HowCard title="Why this is kept apart" label="calculated"><p>Expenses are not rate differences.</p><p>Docket does not count this line in the confirmed amount.</p></HowCard>} />
  );
}

// ---------- A5 Confirm the difference ----------
function A5() {
  const { snap, f, progress, crumb, run } = useA();
  const rows = f.res.lines.filter((l) => l.status === "over");
  const hoursOk = f.res.lines.filter((l) => l.l.kind === "labour").every((l) => l.qty?.ok);
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`Confirm the difference on ${f.inv.id}: ${inr(f.base)}.`}
      what={<p>The invoice charges {inr(f.billed)}/hr where the contract says {inr(f.rate)}/hr. The difference is {inr(f.base)} before GST. GST on it is {inr(f.gst)}.</p>}
      proof={<div className="grid gap-3 sm:grid-cols-2">
        <ProofCard title="Contract says"><Quote text={amendment2().clauses[0].text} from="Amendment 2, clause 1" /></ProofCard>
        <ProofCard title="The difference" label={{ kind: "calculated" }}>
          {rows.map((r) => <p key={r.l.id} className="num">Line {f.inv.lines.indexOf(r.l) + 1}: {r.l.qty} h × {inr(f.perHour)} = {inr(r.diff ?? 0)}</p>)}
          <p className="num">GST adjustment: {inr(f.gst)}</p>
          <p className="num font-semibold">Total correction: {inr(f.hold)}</p>
          <p className="text-[var(--muted)]">Subject to approved hours and service acceptance. {hoursOk ? "Approved hours match billed hours." : "Approved hours do not match billed hours."}</p>
        </ProofCard>
      </div>}
      action={<Gate owner="finance" needsA1 done={!!snap.done.A5} doneNode={<Done>Confirmed by {PEOPLE.finance.name}. The difference is {inr(f.base)} plus GST {inr(f.gst)}.</Done>}>
        <Primary onClick={() => run(snap.confirmDifference)}>Confirm difference</Primary>
      </Gate>}
      how={<HowCard title="The calculation" label="calculated"><Row k="Difference before GST"><span className="num font-semibold">{inr(f.base)}</span></Row><Row k={`GST at ${Math.round(f.inv.gst * 100)}% on the difference`}><span className="num">{inr(f.gst)}</span></Row><Row k="Total correction"><span className="num font-semibold">{inr(f.hold)}</span></Row></HowCard>} />
  );
}

// ---------- A6 Hold the disputed line ----------
function A6() {
  const { snap, f, progress, crumb, run } = useA();
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`Pay the rest of ${f.inv.id} on time and hold ${inr(f.hold)}.`}
      what={<p>Hold only the disputed amount. The rest is owed, so pay it by the due date ({nice(f.inv.due)}).</p>}
      proof={<div className="grid gap-3 sm:grid-cols-2">
        <ProofCard title="Invoice says" label={{ kind: "simulated", source: "ERP invoice inbox" }}><p className="num">Total with GST: {inr(f.total)}</p><p>Due {nice(f.inv.due)}</p></ProofCard>
        <ProofCard title="Split" label={{ kind: "calculated" }}><p className="num">Hold: {inr(f.hold)}</p><p className="num">Pay now: {inr(f.payNow)}</p><p className="text-[var(--muted)]">Check your ERP allows part-payment.</p></ProofCard>
      </div>}
      action={<Gate owner="finance" needsA1 done={!!snap.done.A6} doneNode={<Done>Hold of {inr(f.hold)} recorded. Docket does not move money: make the payment run in your own system.</Done>}>
        <Primary onClick={() => run(snap.holdDisputed)}>Hold {inr(f.hold)}, pay the rest</Primary>
      </Gate>} />
  );
}

// ---------- A7 Send the dispute ----------
function A7() {
  const { snap, progress, crumb, run, f } = useA();
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`Send TalentBridge the dispute for ${f.inv.id}.`}
      what={<p>Docket has drafted the email. Read it, send it from your own email, then tell Docket.</p>}
      proof={<Draft text={disputeEmail(snap)} />}
      action={<Gate owner="finance" needsA1 done={!!snap.done.A7} doneNode={<Done>Recorded as sent. TalentBridge has been told.</Done>}>
        <Primary onClick={() => run(snap.sendDispute)}>I've sent this from my email</Primary>
      </Gate>} />
  );
}

// ---------- A8 Supplier responds ----------
function A8() {
  const { snap, f, progress, crumb, run } = useA();
  const amd = amendment2(), l = f.inv.lines[0];
  const supplierName = PEOPLE.supplier.name;
  const disagreed = snap.supplierReply === "disagreed";
  const waiting = disagreed && !snap.replyResent;
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`Larkspur says invoice ${f.inv.id} charged ${inr(f.billed)}/hr for SOW-1 in October.`}
      what={<p>Your signed Amendment 2 sets {inr(f.rate)}/hr from 1 Oct. Larkspur is asking for a credit note for the difference. {snap.replyResent && "Larkspur has replied with your signed Amendment 2."}</p>}
      proof={<div className="grid gap-3 sm:grid-cols-2">
        <ProofCard title="Contract says"><Quote text={amd.clauses[0].text} from={`Amendment 2, signed ${nice(amd.signed!)}`} /></ProofCard>
        <ProofCard title="Invoice says" label={{ kind: "simulated", source: "ERP invoice inbox" }}>
          <p>{f.inv.id}, line 1: {l.qty} hours at {inr(l.rate)}/hr</p>
          <p className="num">Difference: {f.overHours} h × {inr(f.perHour)} = {inr(f.base)}, plus GST {inr(f.gst)}</p>
          {disagreed && <p>Your reply: "We billed from our standard rate card."</p>}
        </ProofCard>
      </div>}
      action={!snap.done.A7 ? <Done>Larkspur has not sent this to the supplier yet. <Link to="/item/A7" className="underline">See the dispute step</Link></Done>
        : snap.done.A8 ? <Done>{supplierName} agreed. Credit note {CREDIT_NOTE_NO} for {inr(f.base)} plus GST {inr(f.gst)} was issued.</Done>
        : waiting ? (
          snap.role === "supplier" ? <Done>You replied. Waiting for Larkspur to answer.</Done> : (
            <Gate owner="finance" done={false} doneNode={null}>
              <p className="mb-3">TalentBridge replied: "We billed from our standard rate card." The signed Amendment 2 and the invoice line above show the agreed rate.</p>
              <Primary onClick={() => run(snap.replyWithAmendment)}>Reply with the amendment</Primary>
            </Gate>)
        ) : (
          <Gate owner="supplier" done={false} doneNode={null}>
            <Primary onClick={() => run(snap.supplierAgrees)}>Agree and issue credit note</Primary>
            <Secondary onClick={() => run(snap.supplierDisagrees)}>Explain why we disagree</Secondary>
            <p className="mt-2 text-sm text-[var(--muted)]">Signed in as {supplierName}, Billing. A credit note is a document from you that reduces what Larkspur owes.</p>
          </Gate>
        )}
      how={<HowCard title="The calculation" label="calculated"><Row k="Hours billed at the old rate">{f.overHours} h</Row><Row k="Rate gap per hour"><span className="num">{inr(f.billed)} − {inr(f.rate)} = {inr(f.perHour)}</span></Row><Row k="Difference"><span className="num font-semibold">{inr(f.base)}</span></Row><Row k="GST on the difference"><span className="num">{inr(f.gst)}</span></Row></HowCard>} />
  );
}

// ---------- A9 Record the credit note ----------
function A9() {
  const { snap, f, progress, crumb, run } = useA();
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`TalentBridge sent credit note ${CREDIT_NOTE_NO} for ${inr(f.base)} plus GST ${inr(f.gst)}.`}
      what={<p>A credit note is a document from the supplier that reduces what you owe. Record it once it reaches you. Only then does the money count as received.</p>}
      proof={<div className="grid gap-3 sm:grid-cols-2">
        <ProofCard title="Credit note says" label={{ kind: "simulated", source: "ERP (credit notes)" }}><p>{CREDIT_NOTE_NO} for invoice {f.inv.id}</p><p className="num">{inr(f.base)} plus GST {inr(f.gst)}</p></ProofCard>
        <ProofCard title="The dispute says" label={{ kind: "calculated" }}><p className="num">{inr(f.base)} plus GST {inr(f.gst)}</p><p className="text-[var(--muted)]">GST follows the base amount. It is not counted as a saving.</p></ProofCard>
      </div>}
      action={<Gate owner="finance" needsA1 done={!!snap.done.A9} doneNode={<Done>Recorded. {inr(f.base)} is now confirmed on the Value screen. Procurement has been told.</Done>}>
        <Primary onClick={() => run(snap.recordCredit)}>Record credit note</Primary>
      </Gate>} />
  );
}

// ---------- A10 Fix the price at source ----------
function A10() {
  const { snap, f, progress, crumb, run } = useA();
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title={`PO ${f.inv.pos[0]} still says ${inr(f.billed)}/hr.`}
      what={<p>Next month's invoice will repeat the overcharge unless the purchase order and the supplier rate table are fixed.</p>}
      proof={<Draft text={poUpdateText(snap)} />}
      action={<Gate owner="procurement" needsA1 done={!!snap.done.A10} doneNode={<Done>Recorded. Next, see December's invoice to check the fix worked. <Link to="/item/A11" className="underline">Check December</Link></Done>}>
        <Primary onClick={() => run(snap.sendPoUpdate)}>I've sent the update request</Primary>
      </Gate>} />
  );
}

// ---------- A11 December's invoice ----------
function A11() {
  const { snap, f, progress, crumb, run } = useA();
  const d = december(snap);
  return (
    <ItemFrame caseId="A" crumb={crumb} progress={progress} title="December's invoice: is the repeat overcharge gone?"
      what={<p>This fast-forwards to TalentBridge's next invoice, {d.inv.id}, to see whether the fix held.</p>}
      proof={snap.done.A11 ? (
        <div>
          <InvoiceTable id={d.inv.id} res={d.res} />
          {d.allMatch && <p className="mt-3 border border-[var(--line)] rounded-lg p-3 font-semibold">Repeat overcharge prevented: <span className="num">{inr(d.prevented)}</span> a month at the old rate ({d.hours} h × {inr(f.perHour)}). <Label kind="calculated" /></p>}
        </div>
      ) : <p className="text-sm text-[var(--muted)]">Not loaded yet.</p>}
      action={snap.done.A11 ? <Link to="/value" className="inline-flex items-center min-h-[44px] px-4 rounded-lg bg-navy text-white font-semibold">See the Value screen</Link>
        : <Primary onClick={() => run(snap.showDecember)}>Show December's invoice</Primary>}
      how={<HowCard title="How it is checked" label="calculated"><p>The same checks run on the new invoice.</p><p>They use the rate Legal confirmed.</p></HowCard>} />
  );
}
