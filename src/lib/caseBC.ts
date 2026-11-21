// Cases B (CloudDesk renewal) and C (SwiftHaul service credit): facts and drafted letters. Numbers come from engine.ts.
import { CD_SEATS, DEMO_TODAY, DOCS, PEOPLE, SH_DELIVERY, TERMS } from "./data";
import { claimDeadline, D, daysBetween, inr, renewalDates, renewalMoney, slaCalc, suggestedSeats } from "./engine";
import { dmy } from "./copy";
import { seatsFor } from "./ledger";
import type { Snapshot } from "./store";

const long = (s: string) => D(s).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// ---------- Case B ----------
export const capPct = () => TERMS.find((t) => t.id === "t6")!.value as number;
export const SEAT_BUFFER = 1.1; // same buffer suggestedSeats() uses in engine.ts

export function cdFacts(s: Snapshot) {
  const seats = seatsFor(s);
  const pct = s.capApplies ? capPct() : CD_SEATS.quoteUplift;
  const rm = renewalMoney(CD_SEATS, seats, pct);
  const dates = renewalDates(CD_SEATS.renewal, CD_SEATS.noticeDays);
  return {
    seats, pct, rm, dates,
    suggested: suggestedSeats(CD_SEATS),
    rawSeats: (CD_SEATS.active90 + CD_SEATS.seasonal + CD_SEATS.service) * SEAT_BUFFER,
    daysToDecide: daysBetween(DEMO_TODAY, dates.internal),
  };
}

export function cdAddress() {
  const t = DOCS.find((d) => d.id === "CD-SUB")!.clauses.find((c) => c.ref === "17.3")!.text;
  return t.slice(t.indexOf("registered office: ") + "registered office: ".length).replace(/\.$/, "");
}

export function noticeLetter(s: Snapshot) {
  const f = cdFacts(s);
  const [name, ...addr] = cdAddress().split(", Attn: Legal")[0].split(", ");
  const willing = s.renewalDecision === "dont"
    ? "Larkspur does not intend to renew."
    : `Larkspur is willing to renew ${f.seats} seats at no more than ${f.pct}%.`;
  const cap = s.capApplies
    ? `Clause 9.2 caps renewal increases at ${f.pct}%; the quote cites no change in law or regulation and attaches no evidence.`
    : "";
  return `Date: ${long(DEMO_TODAY)}

${name}
${addr.join(", ")}
Attn: Legal

Subject: Notice under clause 9.1: Subscription Agreement

Dear Sir or Madam,

Larkspur Technologies Pvt Ltd does not wish to renew on the quoted terms (CD-RQ-2291). ${cap} ${willing} Unless agreed in writing before the term ends on ${long(CD_SEATS.renewal)}, this letter is notice of non-renewal.

Signed,
${PEOPLE.procurement.name}, Procurement, Larkspur Technologies Pvt Ltd`.replace(/ {2,}/g, " ");
}

// ---------- Case C ----------
export function shFacts(s: Snapshot) {
  const accept = slaCalc(SH_DELIVERY, true), reject = slaCalc(SH_DELIVERY, false);
  const claimBy = claimDeadline(SH_DELIVERY.month);
  return { accept, reject, chosen: s.fmAccepted ? accept : reject, claimBy, daysLeft: daysBetween(DEMO_TODAY, claimBy) };
}
const n0 = (n: number) => n.toLocaleString("en-IN");
export const r2 = (n: number) => Number(n.toFixed(2)); // 90.59 and 91.5, as written in the story

export function claimLetter(s: Snapshot) {
  const f = shFacts(s), c = f.chosen, d = SH_DELIVERY;
  const excluded = s.fmAccepted ? `${d.customerCaused} delayed by Larkspur and ${d.fmClaimed} you cited as force majeure` : `${d.customerCaused} delayed by Larkspur`;
  const fm = s.fmAccepted
    ? `Force majeure: we have accepted your position on the ${d.fmClaimed} shipments you cited and excluded them.`
    : `Force majeure: you cited force majeure for ${d.fmClaimed} shipments. Clause 7.3 requires supporting evidence within 5 days. None was received in that time, so these shipments stay in the count.`;
  return `Subject: Service credit claim, October 2026

To: SwiftHaul Logistics Ltd

Clause 7.1 requires at least 95% of Eligible Shipments to be delivered on time each month.
In October 2026 there were ${n0(c.eligible)} Eligible Shipments (${n0(d.total)} less ${excluded}). ${n0(d.onTime)} were on time, which is ${r2(c.perf)}%.
That is ${c.points} full percentage points below the target. Under clause 7.4 the Service Credit is ${c.points} × 2% = ${c.pct}% of the monthly Service Fee of ${inr(d.fee)}, which is ${inr(c.credit)}. The 10% cap (${inr(c.cap)}) is not reached.
${fm}
Please apply ${inr(c.credit)} as an offset against the next invoice, as clause 7.4 provides.

Thanks,
${PEOPLE.procurement.name}, Procurement, Larkspur Technologies`;
}

export const claimByLabel = (s: Snapshot) => dmy(shFacts(s).claimBy);
