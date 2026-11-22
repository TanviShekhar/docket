import { Link } from "react-router-dom";
import { december, CREDIT_NOTE_NO } from "../lib/caseA";
import { inr } from "../lib/engine";
import { breakdown, gstAdjustment, STAGES, valueItems, valueTotals, type Stage, type ValueItem } from "../lib/ledger";
import { useStore } from "../lib/store";
import Label from "../components/Label";
import FilesBar from "../components/FilesBar";
import { valueFile } from "../lib/dataFiles";

const WHAT: Record<string, string> = {
  A: `Finance records credit note ${CREDIT_NOTE_NO}`,
  "B-cap": "Procurement records the signed renewal",
  "B-seats": "Procurement records the signed renewal",
  C: "Finance records the offset on the December invoice",
};
const LINK: Record<string, string> = { A: "/item/A1", "B-cap": "/item/B1", "B-seats": "/item/B2", C: "/item/C1" };

function StageTrack({ stage }: { stage: Stage }) {
  const at = STAGES.indexOf(stage);
  return (
    <div>
      <div className="flex gap-1" aria-hidden>{STAGES.map((s, i) => <span key={s} className={`h-2 w-6 rounded-sm ${i <= at ? (stage === "Confirmed" ? "bg-ok" : "bg-bar") : "bg-[var(--line)]"}`} />)}</div>
      <p className="mt-1 text-xs">{stage}</p>
    </div>
  );
}

const money = (i: ValueItem, capApplies: boolean, decision: string | null) =>
  i.amount === 0 ? (i.id === "B-cap" && !capApplies ? "Not claimable" : decision === "asis" || decision === "dont" ? "No saving" : inr(0)) : inr(i.amount);

export default function Value() {
  const snap = useStore();
  const items = valueItems(snap);
  const t = valueTotals(snap);
  const b = breakdown(snap);
  const dec = december(snap);
  const seen = !!snap.done.A11;
  return (
    <main className="page py-8">
      <h1 className="text-3xl md:text-4xl">Value</h1>

      <section className="mt-6" aria-labelledby="conf" data-tour="value-big">
        <h2 id="conf" className="text-lg font-semibold">Confirmed value <Label kind="calculated" /></h2>
        <div className="mt-2 flex flex-wrap gap-x-10 gap-y-2">
          <p><span className="font-display text-4xl font-bold num">{inr(t.confirmedOneOff)}</span> <span className="text-[var(--muted)]">one-off</span></p>
          <p><span className="font-display text-4xl font-bold num">{inr(t.confirmedAnnual)}</span> <span className="text-[var(--muted)]">a year</span></p>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)] max-w-3xl">Counted only when Finance records the credit note, offset or signed renewal. GST is not counted. One-off and yearly amounts are never added together.</p>
        <p className="mt-1 text-sm num">In progress, not counted yet: {inr(t.progressOneOff)} one-off, {inr(t.progressAnnual)} a year.</p>
      </section>

      <section className="mt-10" aria-labelledby="items">
        <h2 id="items" className="text-2xl">Every item</h2>
        <div className="mt-3 overflow-x-auto border border-[var(--line)] rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--muted)]">
              <tr><th className="p-2">Item</th><th className="p-2">Category</th><th className="p-2">One-off or yearly</th><th className="p-2">Stage</th><th className="p-2 text-right">Amount</th><th className="p-2">What would make it confirmed</th></tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-[var(--line)] align-top">
                  <td className="p-2"><Link to={LINK[i.id]} className="underline">{i.label}</Link></td>
                  <td className="p-2">{i.category}</td>
                  <td className="p-2">{i.kind === "one-off" ? "One-off" : "Every year"}</td>
                  <td className="p-2"><StageTrack stage={i.stage} /></td>
                  <td className={`p-2 text-right num ${i.stage === "Confirmed" ? "text-ok font-semibold" : i.stage === "Unchecked" ? "text-locked" : ""}`}>{money(i, snap.capApplies, snap.renewalDecision)}{i.stage === "Unchecked" && i.amount > 0 ? <span className="block text-xs">possible</span> : null}</td>
                  <td className="p-2">{i.stage === "Confirmed" ? "Done" : WHAT[i.id]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Stages: Unchecked, Flagged, Confirmed by Finance, Sent, Confirmed. Only Confirmed counts.</p>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2" aria-label="Totals">
        <div>
          <h2 className="text-xl">By category</h2>
          <div className="mt-2 overflow-x-auto border border-[var(--line)] rounded-lg">
            <table className="w-full text-sm">
              <thead className="text-left text-[var(--muted)]"><tr><th className="p-2">Category</th><th className="p-2 text-right">Confirmed</th><th className="p-2 text-right">In progress</th></tr></thead>
              <tbody>{b.byCategory.map((c) => (
                <tr key={c.category} className="border-t border-[var(--line)]">
                  <td className="p-2">{c.category}{c.kind ? <span className="block text-xs text-[var(--muted)]">{c.kind === "one-off" ? "One-off" : "Every year"}</span> : null}</td>
                  <td className="p-2 text-right num">{inr(c.confirmed)}</td><td className="p-2 text-right num">{inr(c.progress)}</td>
                </tr>))}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-xl">One-off or yearly</h2>
          <div className="mt-2 overflow-x-auto border border-[var(--line)] rounded-lg">
            <table className="w-full text-sm">
              <thead className="text-left text-[var(--muted)]"><tr><th className="p-2">Type</th><th className="p-2 text-right">Confirmed</th><th className="p-2 text-right">In progress</th></tr></thead>
              <tbody>{b.byKind.map((k) => (
                <tr key={k.kind} className="border-t border-[var(--line)]">
                  <td className="p-2">{k.kind === "one-off" ? "One-off" : "Every year"}</td>
                  <td className="p-2 text-right num">{inr(k.confirmed)}</td><td className="p-2 text-right num">{inr(k.progress)}</td>
                </tr>))}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-10 border border-[var(--line)] rounded-lg p-4" aria-labelledby="rep">
        <h2 id="rep" className="text-xl">Repeat overcharges prevented</h2>
        {seen && dec.allMatch
          ? <p className="mt-2"><span className="num font-semibold">{inr(dec.prevented)}</span> a month at the old TalentBridge rate ({dec.hours} h × the rate difference). December's invoice matched the contract. <Label kind="calculated" /></p>
          : <p className="mt-2 text-sm text-[var(--muted)]">Nothing to show yet. <Link to="/item/A11" className="underline">Check December's invoice</Link> once the purchase order is fixed.</p>}
        <p className="mt-2 text-sm text-[var(--muted)]">This is not counted in Confirmed value. It shows a mistake that did not happen again.</p>
      </section>

      <section className="mt-4 border border-[var(--line)] rounded-lg p-4" aria-labelledby="gst">
        <h2 id="gst" className="text-xl">GST adjustments (follow the base, not savings)</h2>
        <p className="mt-2 num">TalentBridge credit: {inr(gstAdjustment(snap))} {snap.done.A9 ? "recorded with the credit note" : "will follow the credit note"}. <Label kind="calculated" /></p>
        <p className="mt-1 text-sm text-[var(--muted)]">GST moves with the base amount. It is reported here and never added to Confirmed value.</p>
      </section>
      <FilesBar files={[valueFile(snap)]} />
    </main>
  );
}
