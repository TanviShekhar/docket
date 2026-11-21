import { useState } from "react";
import { AI_JUDGEMENTS, AI_RUNS } from "../lib/aiRuns";
import { CD_SEATS, CD_USAGE, DOCS, PEOPLE, SH_DELIVERY } from "../lib/data";
import { grounded, inr, lakh, LEAD } from "../lib/engine";
import { capPct, cdFacts, claimLetter, noticeLetter, r2, shFacts, SEAT_BUFFER } from "../lib/caseBC";
import { dmy, MON } from "../lib/copy";
import { useStore, useToast } from "../lib/store";
import { dueLine } from "../lib/todo";
import ItemFrame from "../components/ItemFrame";
import Label from "../components/Label";
import { Gate, Primary, ProofCard, Quote, Secondary } from "../components/ui";
import { Done, Draft } from "./CaseA";

const clause = (docId: string, ref: string) => DOCS.find((d) => d.id === docId)!.clauses.find((c) => c.ref === ref)!;
const judge = (id: string) => AI_JUDGEMENTS.find((j) => j.id === id)!;

export default function CaseBC({ id }: { id: string }) {
  switch (id) {
    case "B1": return <B1 />;
    case "B2": return <B2 />;
    case "B3": return <B3 />;
    case "B4": return <B4 />;
    case "C1": return <C1 />;
    case "C2": return <C2 />;
    case "C3": return <C3 />;
    case "C4": return <C4 />;
    case "C5": return <C5 />;
    default: return null;
  }
}

// ---------- Case B helpers ----------
const B_PROGRESS = ["Legal reading", "Owner decides", "Notice sent", "Supplier revises", "Renewal signed"];
function useB() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const f = cdFacts(snap);
  const d = snap.done;
  const doneCount = d.B4 ? 5 : snap.cdReply ? 4 : d.B3 ? 3 : d.B2 ? 2 : d.B1 ? 1 : 0;
  return { snap, f, progress: { steps: B_PROGRESS, doneCount }, run: (fn: () => string) => show(fn()), crumb: "CloudDesk renewal" };
}

function Deadlines() {
  const f = cdFacts(useStore.getState());
  return (
    <div className="border border-[var(--line)] rounded-lg p-4 text-sm">
      <h3 className="text-base">Deadlines <Label kind="calculated" /></h3>
      <ul className="mt-2 space-y-1">
        <li>Renewal: <span className="num">{dmy(f.dates.renewal)}</span></li>
        <li>Notice must be received by: <span className="num font-semibold">{dmy(f.dates.notice)}</span> ({CD_SEATS.noticeDays} days before, clause 9.1)</li>
        <li>Decide by: <span className="num font-semibold">{dmy(f.dates.internal)}</span> ({f.daysToDecide} days from today)</li>
      </ul>
      <details className="mt-2"><summary className="cursor-pointer min-h-[44px] flex items-center">Why that decide-by date</summary>
        <ul className="space-y-1">{LEAD.map((l) => <li key={l.step}>{l.step}: {l.days} working days</li>)}
          <li className="font-semibold">Total: {f.dates.lead} working days before the notice date</li></ul>
      </details>
    </div>
  );
}

// ---------- B1 Legal reads the cap exception ----------
function B1() {
  const { snap, f, progress, crumb, run } = useB();
  const c = clause("CD-SUB", "9.2"), j = judge("j-cap");
  const ai = AI_RUNS["CD-SUB"].find((x) => x.clause === "9.2")!;
  const text = DOCS.find((d) => d.id === "CD-SUB")!.clauses.map((x) => x.text).join("\n");
  return (
    <ItemFrame caseId="B" crumb={crumb} progress={progress} status={dueLine(f.dates.internal, "legal")}
      title={`CloudDesk wants +${CD_SEATS.quoteUplift}% on renewal. The contract caps it at ${capPct()}%.`}
      what={<p>The contract caps renewal increases at 5% unless a change in law or regulation raises CloudDesk's cost, with written evidence. Legal needs to say whether that exception applies, because it decides how much can be saved.</p>}
      proof={<div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProofCard title="Contract says"><Quote text={c.text} from={`Subscription Agreement, page ${c.page}, clause ${c.ref}`} /></ProofCard>
          <ProofCard title="Quote says" label={{ kind: "simulated", source: "Shared inbox" }}><p>{CD_SEATS.quoteText}</p><p>No law or regulation is named and no evidence is attached.</p></ProofCard>
        </div>
        <p className="text-sm"><Label kind="ai" /> {j.output}</p>
        <Deadlines />
      </div>}
      action={<Gate owner="legal" done={!!snap.done.B1} doneNode={<Done>{snap.capApplies ? "The 5% cap applies. The business owner has been told." : "The exception applies, so the cap saving is not claimable. Only fewer seats can save money."} Checked by {PEOPLE.legal.name}.</Done>}>
        <Primary onClick={() => run(() => snap.decideCap(true))}>Cap applies: no regulation named, no evidence</Primary>
        <Secondary onClick={() => run(() => snap.decideCap(false))}>Exception applies</Secondary>
      </Gate>}
      how={<>
        <div><h3 className="text-base">What the AI read <Label kind="ai" /></h3><p>{ai.field}: {ai.value}. Confidence {Math.round(ai.confidence * 100)}%. Flag: {ai.flag}</p>
          <p>Evidence check: {grounded(text, ai.quote) ? "Quote found in the document." : "Quote NOT found."} This proves the quote exists, not that its meaning was read correctly.</p><p>Why: {j.why}</p></div>
        <div><h3 className="text-base">The calculation <Label kind="calculated" /></h3>
          <p className="num">At the quote: {inr(f.rm.asQuote)}. At the cap: {inr(cdFacts({ ...snap, capApplies: true }).rm.atCap)}. Cap saving: {inr(cdFacts({ ...snap, capApplies: true }).rm.capSaving)} a year.</p></div></>} />
  );
}

// ---------- B2 Owner decides ----------
function B2() {
  const { snap, f, progress, crumb, run } = useB();
  const locked = !!snap.done.B2;
  const capRm = cdFacts({ ...snap, capApplies: true }).rm;
  const months = CD_USAGE.map((_, i) => MON[(11 + i) % 12]);
  const max = Math.max(...CD_USAGE);
  const decisionText = { renegotiate: `Renegotiate at ${f.seats} seats`, asis: "Renew as quoted", dont: "Do not renew" };
  return (
    <ItemFrame caseId="B" crumb={crumb} progress={progress} status={dueLine(f.dates.internal, "owner")}
      title={`Decide CloudDesk's renewal. Docket suggests ${f.suggested} seats instead of ${CD_SEATS.contracted}.`}
      what={<p>CloudDesk renews on {dmy(f.dates.renewal)}. You pay for {CD_SEATS.contracted} seats, but only {CD_SEATS.active90} people used it in the last 90 days.</p>}
      proof={<div className="space-y-3">
        <ProofCard title="Seats used each month" label={{ kind: "simulated", source: "SaaS admin console" }}>
          <div className="flex items-end gap-1 h-28" role="img" aria-label={`Monthly active seats fell from ${CD_USAGE[0]} to ${CD_USAGE[CD_USAGE.length - 1]}`}>
            {CD_USAGE.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[10px] num">{v}</span>
                <div className="w-full bg-bar rounded-sm" style={{ height: `${(v / max) * 80}%` }} />
              </div>
            ))}
          </div>
          <div className="flex gap-1 text-[10px] text-[var(--muted)]">{months.map((m, i) => <span key={i} className="flex-1 text-center">{m}</span>)}</div>
          <p className="num">{CD_SEATS.active90} active in the last 90 days. {CD_SEATS.seasonalNote}. {CD_SEATS.serviceNote}.</p>
        </ProofCard>
        <ProofCard title="How many seats" label={{ kind: "calculated" }}>
          <p className="num">({CD_SEATS.active90} + {CD_SEATS.seasonal} + {CD_SEATS.service}) × {SEAT_BUFFER} = {f.rawSeats.toFixed(1)}, rounded up to the next 10 seats = {f.suggested}</p>
          <label htmlFor="seats" className="block">Seats to renew <Label kind="input" /></label>
          <input id="seats" type="range" min={300} max={500} step={10} value={f.seats} disabled={locked}
            onChange={(e) => snap.setSeats(Number(e.target.value))} className="w-full" />
          <p className="num font-semibold">{f.seats} seats</p>
        </ProofCard>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProofCard title="Against today's budget" label={{ kind: "calculated" }}>
            <p className="num">{lakh(f.rm.current)} → {lakh(f.rm.atSeats)}</p><p className="num font-semibold">Saves {lakh(f.rm.vsBudget)} a year</p>
          </ProofCard>
          <ProofCard title="Against their quote" label={{ kind: "calculated" }}>
            <p className="num">{lakh(f.rm.asQuote)} → {lakh(f.rm.atSeats)}</p>
            <p className="num font-semibold">Avoids {lakh(f.rm.vsQuote)} a year</p>
            <p className="num">Price cap {snap.capApplies ? inr(capRm.capSaving) : "not claimable"} + fewer seats {lakh(f.rm.seatSaving)}</p>
          </ProofCard>
        </div>
        <fieldset className="border border-[var(--line)] rounded-lg p-4 text-sm">
          <legend className="px-1">How important is CloudDesk to your team? <Label kind="input" /></legend>
          {(["High", "Medium", "Low"] as const).map((i) => (
            <label key={i} className="inline-flex items-center gap-2 min-h-[44px] mr-4">
              <input type="radio" name="imp" checked={snap.importance === i} disabled={locked} onChange={() => snap.setImportance(i)} /> {i}
            </label>
          ))}
        </fieldset>
        <p className="text-sm"><span className="font-semibold">Docket's recommendation:</span> renegotiate at {f.suggested} seats. Based on {CD_SEATS.active90} active, {CD_SEATS.seasonal} seasonal and {CD_SEATS.service} service seats, a {Math.round((SEAT_BUFFER - 1) * 100)}% buffer, importance {snap.importance}, and the 5% cap {snap.capApplies ? "applying" : "not applying"}. <Label kind="calculated" /></p>
        <Deadlines />
      </div>}
      action={<Gate owner="owner" done={locked} doneNode={<Done>Decision recorded: {snap.renewalDecision ? decisionText[snap.renewalDecision] : ""}. {snap.renewalDecision !== "asis" && "Procurement has been told."}</Done>}>
        <Primary onClick={() => run(() => snap.decideRenewal("renegotiate"))}>Renegotiate at {f.seats} seats</Primary>
        <Secondary onClick={() => run(() => snap.decideRenewal("asis"))}>Renew as quoted</Secondary>
        <Secondary onClick={() => run(() => snap.decideRenewal("dont"))}>Don't renew</Secondary>
      </Gate>}
      how={<p className="num">{f.seats} seats × {inr(CD_SEATS.price)} × (1 + {f.pct}%) = {inr(f.rm.atSeats)}. Today: {CD_SEATS.contracted} × {inr(CD_SEATS.price)} = {inr(f.rm.current)}. <Label kind="calculated" /></p>} />
  );
}

// ---------- B3 Send the notice ----------
function B3() {
  const { snap, f, progress, crumb, run } = useB();
  const [printed, setPrinted] = useState(false), [booked, setBooked] = useState(false), [track, setTrack] = useState("");
  const [warn, setWarn] = useState(false);
  const go = () => { if (printed && booked && track.trim()) run(() => snap.dispatchNotice(track.trim())); else setWarn(true); };
  return (
    <ItemFrame caseId="B" crumb={crumb} progress={progress} status={dueLine(f.dates.internal, "procurement")}
      title="Send CloudDesk the notice by courier."
      what={<p>The notice must reach CloudDesk by {dmy(f.dates.notice)}. Email does not count as notice under clause 17.3, so it goes by registered post or courier.</p>}
      proof={<div className="space-y-3"><Draft text={noticeLetter(snap)} /><Deadlines /></div>}
      action={<Gate owner="procurement" done={!!snap.done.B3} doneNode={<Done>Dispatched. Tracking number {snap.trackingNo}. {snap.renewalDecision === "dont" ? "The non-renewal notice is on its way." : "Next, record CloudDesk's reply."}</Done>}>
        <fieldset className="space-y-1 text-sm">
          <legend className="font-semibold">Dispatch checklist</legend>
          <label className="flex items-center gap-2 min-h-[44px]"><input type="checkbox" checked={printed} onChange={(e) => setPrinted(e.target.checked)} /> Printed and signed</label>
          <label className="flex items-center gap-2 min-h-[44px]"><input type="checkbox" checked={booked} onChange={(e) => setBooked(e.target.checked)} /> Registered post or courier booked</label>
          <label className="block">Tracking number <input value={track} onChange={(e) => setTrack(e.target.value)} className="ml-2 border border-[var(--line)] rounded-lg px-2 min-h-[44px] bg-transparent" /></label>
        </fieldset>
        {warn && <p className="mt-2 text-sm text-warn">Tick both boxes and enter the tracking number first.</p>}
        <div className="mt-3"><Primary onClick={go}>Mark as dispatched</Primary></div>
      </Gate>} />
  );
}

// ---------- B4 Revised quote and signed renewal ----------
function B4() {
  const { snap, f, progress, crumb, run } = useB();
  return (
    <ItemFrame caseId="B" crumb={crumb} progress={progress} status={dueLine(f.dates.notice, "procurement")}
      title="Record CloudDesk's revised quote and the signed renewal."
      what={<p>This step fast-forwards to CloudDesk's reply.</p>}
      proof={snap.cdReply
        ? <ProofCard title="Revised quote" label={{ kind: "simulated", source: "Shared inbox" }}><p className="num">{f.seats} seats at {f.pct}%: {inr(f.rm.atSeats)} a year.</p></ProofCard>
        : <p className="text-sm text-[var(--muted)]">No reply yet.</p>}
      action={<Gate owner="procurement" done={!!snap.done.B4} doneNode={<Done>Signed renewal recorded. Confirmed: {inr(snap.capApplies ? f.rm.capSaving : 0)} a year cost avoided plus {inr(f.rm.seatSaving)} a year negotiated saving.</Done>}>
        {!snap.cdReply ? <Primary onClick={() => run(snap.showCdReply)}>Show CloudDesk's reply</Primary> : <Primary onClick={() => run(snap.recordRenewal)}>Record signed renewal</Primary>}
      </Gate>} />
  );
}

// ---------- Case C helpers ----------
const C_PROGRESS = ["Legal checks clause", "Procurement reviews exclusions", "Claim sent", "Supplier agrees", "Offset on next invoice"];
function useC() {
  const snap = useStore();
  const show = useToast((t) => t.show);
  const f = shFacts(snap);
  const n = ["C1", "C2", "C3", "C4", "C5"].filter((k) => snap.done[k]).length;
  return { snap, f, progress: { steps: C_PROGRESS, doneCount: n }, run: (fn: () => string) => show(fn()), crumb: "SwiftHaul service credit" };
}

// ---------- C1 Legal checks the clause ----------
function C1() {
  const { snap, f, progress, crumb, run } = useC();
  const cl = ["7.1", "7.3", "7.4"].map((r) => clause("SH-MSA", r));
  const text = DOCS.find((d) => d.id === "SH-MSA")!.clauses.map((x) => x.text).join("\n");
  return (
    <ItemFrame caseId="C" crumb={crumb} progress={progress} status={dueLine(f.claimBy, "legal")}
      title="SwiftHaul's service credit clause needs checking before any claim."
      what={<p>SwiftHaul must deliver at least 95% of shipments on time. If not, the contract gives a credit. Claims must be made by {dmy(f.claimBy)}, which is {f.daysLeft} days from today.</p>}
      proof={<div className="space-y-3">
        {cl.map((c) => <ProofCard key={c.ref} title={`Contract says, clause ${c.ref}`}><Quote text={c.text} from={`Logistics Services Agreement, page ${c.page}`} /></ProofCard>)}
        <p className="text-sm"><Label kind="ai" /> The AI read these as: {AI_RUNS["SH-MSA"].map((a) => `${a.field} (${Math.round(a.confidence * 100)}% sure)`).join("; ")}.</p>
      </div>}
      action={<Gate owner="legal" done={!!snap.done.C1} doneNode={<Done>Checked by {PEOPLE.legal.name}. Procurement has been told.</Done>}>
        <Primary onClick={() => run(snap.confirmSla)}>Confirm clause</Primary>
      </Gate>}
      how={<>{AI_RUNS["SH-MSA"].map((a) => (
        <div key={a.field}><h3 className="text-base">{a.field} <Label kind="ai" /></h3><p>{a.value}. Confidence {Math.round(a.confidence * 100)}%.{a.flag ? ` Flag: ${a.flag}` : ""}</p>
          <p>Evidence check: {grounded(text, a.quote) ? "Quote found in the document." : "Quote NOT found."} This proves the quote exists, not that its meaning was read correctly.</p></div>
      ))}</>} />
  );
}

// ---------- C2 Procurement reviews the exclusions ----------
function C2() {
  const { snap, f, progress, crumb, run } = useC();
  const d = SH_DELIVERY, j = judge("j-fm");
  const opt = (title: string, r: typeof f.reject, onClick: () => void, primary: boolean) => (
    <ProofCard title={title} label={{ kind: "calculated" }}>
      <p className="num">{d.onTime.toLocaleString("en-IN")} / {r.eligible.toLocaleString("en-IN")} = {r2(r.perf)}% on time</p>
      <p className="num">95 − {r2(r.perf)} = {r2(r.shortfall)} below the target</p>
      <p>Only full points count, so {r2(r.shortfall)} becomes {r.points}.</p>
      <p className="num">{r.points} full points × 2% = {r.pct}% of {inr(d.fee)} = <span className="font-semibold">{inr(r.credit)}</span></p>
      <p className="text-[var(--muted)] num">The 10% cap ({inr(r.cap)}) is not reached.</p>
      {!snap.done.C2 && (primary ? <Primary onClick={onClick}>{title}</Primary> : <Secondary onClick={onClick}>{title}</Secondary>)}
    </ProofCard>
  );
  return (
    <ItemFrame caseId="C" crumb={crumb} progress={progress} status={dueLine(f.claimBy, "procurement")}
      title={`SwiftHaul delivered ${r2(f.reject.perf)}% on time in October, below the 95% target.`}
      what={<p>{d.late} of {d.total.toLocaleString("en-IN")} shipments were late. You decide whether to accept the force majeure reason SwiftHaul gave for {d.fmClaimed} of them.</p>}
      proof={<div className="space-y-3">
        <ProofCard title="October data" label={{ kind: "simulated", source: "Transport management system" }}>
          <p className="num">{d.total.toLocaleString("en-IN")} shipments = {d.onTime.toLocaleString("en-IN")} on time + {d.late} late.</p>
          <p className="num">Late: {d.customerCaused} delayed by us, {d.fmClaimed} the supplier says were force majeure, {d.supplierLate} the supplier's fault.</p>
          <p>{d.note}</p>
        </ProofCard>
        <ProofCard title="Supplier's reason"><p>{d.fmEvidence}</p><p><Label kind="ai" /> {j.output}</p></ProofCard>
        <div className="grid gap-3 sm:grid-cols-2">
          {opt(`Don't accept force majeure`, f.reject, () => run(() => snap.chooseFm(false)), true)}
          {opt("Accept force majeure", f.accept, () => run(() => snap.chooseFm(true)), false)}
        </div>
      </div>}
      action={<Gate owner="procurement" done={!!snap.done.C2} doneNode={<Done>You {snap.fmAccepted ? "accepted" : "did not accept"} force majeure. The claim is {inr(f.chosen.credit)}.</Done>}>
        <p className="text-sm">Choose an option above. The {d.customerCaused} shipments delayed by us stay excluded either way.</p>
      </Gate>}
      how={<><p>{j.why}</p><p className="num">Eligible shipments: {d.total} − {d.customerCaused}{" "}= {f.reject.eligible} (or {f.accept.eligible} if force majeure is accepted).</p></>} />
  );
}

// ---------- C3 Send the claim ----------
function C3() {
  const { snap, f, progress, crumb, run } = useC();
  return (
    <ItemFrame caseId="C" crumb={crumb} progress={progress} status={dueLine(f.claimBy, "procurement")}
      title={`Send SwiftHaul the October service credit claim for ${inr(f.chosen.credit)}.`}
      what={<p>Claims must be in writing within 30 days of the month end: by {dmy(f.claimBy)}. Docket has drafted it.</p>}
      proof={<Draft text={claimLetter(snap)} />}
      action={<Gate owner="procurement" done={!!snap.done.C3} doneNode={<Done>Recorded as sent.</Done>}>
        <Primary onClick={() => run(snap.sendClaim)}>I've sent the claim</Primary>
      </Gate>} />
  );
}

// ---------- C4 Supplier agrees (demo) ----------
function C4() {
  const { snap, f, progress, crumb, run } = useC();
  return (
    <ItemFrame caseId="C" crumb={crumb} progress={progress}
      title="Waiting for SwiftHaul's reply to the claim."
      what={<p>This step fast-forwards to SwiftHaul's reply.</p>}
      proof={snap.done.C4 ? <ProofCard title="SwiftHaul replied" label={{ kind: "simulated", source: "Shared inbox" }}><p>Agreed. A credit of <span className="num">{inr(f.chosen.credit)}</span> will be applied to the next invoice.</p></ProofCard> : <p className="text-sm text-[var(--muted)]">No reply yet.</p>}
      action={<Gate owner="procurement" done={!!snap.done.C4} doneNode={<Done>Recorded. Finance has been told.</Done>}>
        <Primary onClick={() => run(snap.showShReply)}>Show SwiftHaul's reply</Primary>
      </Gate>} />
  );
}

// ---------- C5 Record the offset ----------
function C5() {
  const { snap, f, progress, crumb, run } = useC();
  return (
    <ItemFrame caseId="C" crumb={crumb} progress={progress}
      title={`December's SwiftHaul invoice will be reduced by ${inr(f.chosen.credit)}.`}
      what={<p>SwiftHaul agreed to the credit. Clause 7.4 applies it as an offset against the next invoice.</p>}
      proof={<ProofCard title="The credit" label={{ kind: "calculated" }}><p className="num">{f.chosen.points} full points × 2% = {f.chosen.pct}% of {inr(SH_DELIVERY.fee)} = {inr(f.chosen.credit)}</p></ProofCard>}
      action={<Gate owner="finance" done={!!snap.done.C5} doneNode={<Done>Recorded. {inr(f.chosen.credit)} is now confirmed on the Value screen.</Done>}>
        <Primary onClick={() => run(snap.recordOffset)}>Record offset</Primary>
      </Gate>} />
  );
}
