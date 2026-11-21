// Value ledger. Amounts come from engine.ts. Only "Confirmed" counts as confirmed value.
import { CD_SEATS, INVOICES, SH_DELIVERY } from "./data";
import { checkInvoice, renewalMoney, slaCalc, suggestedSeats } from "./engine";
import type { Snapshot } from "./store";

export type Stage = "Unchecked" | "Flagged" | "Confirmed by Finance" | "Sent" | "Confirmed";
export interface ValueItem { id: string; label: string; category: "Cash recovered" | "Credit received" | "Cost avoided" | "Negotiated saving"; kind: "one-off" | "annual"; stage: Stage; amount: number }

const stageOf = (done: Record<string, boolean>, flag: string, valid: string, sent: string, final: string): Stage =>
  done[final] ? "Confirmed" : done[sent] ? "Sent" : done[valid] ? "Confirmed by Finance" : done[flag] ? "Flagged" : "Unchecked";

export const seatsFor = (s: Snapshot) => s.seats ?? suggestedSeats(CD_SEATS);

export function checkStateOf(s: Snapshot) { return { termState: s.termState, mapConfirmed: s.mapConfirmed, expenseApproved: s.expenseApproved }; }

// The TalentBridge difference as if Legal had checked the rate (shows money at stake before the check).
export function talentBridgeDifference(s: Snapshot) {
  return checkInvoice(INVOICES[0], { ...checkStateOf(s), termState: { ...s.termState, t4: "verified" } }).totals;
}

export function valueItems(s: Snapshot): ValueItem[] {
  const tb = talentBridgeDifference(s);
  const rm = renewalMoney(CD_SEATS, seatsFor(s), s.capApplies ? 5 : CD_SEATS.quoteUplift);
  const sh = slaCalc(SH_DELIVERY, s.fmAccepted);
  const claimsB = s.renewalDecision !== "asis" && s.renewalDecision !== "dont"; // only a renegotiation saves money
  const bStage = stageOf(s.done, "B1", "B2", "B3", "B4");
  return [
    { id: "A", label: "TalentBridge rate overcharge, INV-TB-1103", category: "Credit received", kind: "one-off", stage: stageOf(s.done, "A1", "A5", "A7", "A9"), amount: tb.disputable },
    { id: "B-cap", label: "CloudDesk renewal price cap held at 5%", category: "Cost avoided", kind: "annual", stage: bStage, amount: s.capApplies && claimsB ? rm.capSaving : 0 },
    { id: "B-seats", label: "CloudDesk renewal at fewer seats", category: "Negotiated saving", kind: "annual", stage: bStage, amount: claimsB ? rm.seatSaving : 0 },
    { id: "C", label: "SwiftHaul October service credit", category: "Credit received", kind: "one-off", stage: stageOf(s.done, "C1", "C2", "C3", "C5"), amount: sh.credit },
  ];
}

const counted = (st: Stage) => st === "Confirmed";
const moving = (st: Stage) => st === "Flagged" || st === "Confirmed by Finance" || st === "Sent";

export function valueTotals(s: Snapshot) {
  const items = valueItems(s);
  const sum = (f: (i: ValueItem) => boolean) => items.filter(f).reduce((a, i) => a + i.amount, 0);
  return {
    confirmedOneOff: sum((i) => counted(i.stage) && i.kind === "one-off"),
    confirmedAnnual: sum((i) => counted(i.stage) && i.kind === "annual"),
    progressOneOff: sum((i) => moving(i.stage) && i.kind === "one-off"),
    progressAnnual: sum((i) => moving(i.stage) && i.kind === "annual"),
  };
}

export const STAGES: Stage[] = ["Unchecked", "Flagged", "Confirmed by Finance", "Sent", "Confirmed"];
export const CATEGORIES: ValueItem["category"][] = ["Cash recovered", "Credit received", "Cost avoided", "Negotiated saving"];

// Totals by category and by one-off vs annual. One-off and annual are never added together.
export function breakdown(s: Snapshot) {
  const items = valueItems(s);
  const sum = (f: (i: ValueItem) => boolean, g: (i: ValueItem) => boolean) => items.filter((i) => f(i) && g(i)).reduce((a, i) => a + i.amount, 0);
  const confirmed = (i: ValueItem) => counted(i.stage);
  const inProgress = (i: ValueItem) => moving(i.stage);
  return {
    byCategory: CATEGORIES.map((c) => ({ category: c, kind: items.find((i) => i.category === c)?.kind ?? null,
      confirmed: sum((i) => i.category === c, confirmed), progress: sum((i) => i.category === c, inProgress) })),
    byKind: (["one-off", "annual"] as const).map((k) => ({ kind: k, confirmed: sum((i) => i.kind === k, confirmed), progress: sum((i) => i.kind === k, inProgress) })),
  };
}

// GST on the TalentBridge credit follows the base amount. It is reported, never counted as a saving.
export const gstAdjustment = (s: Snapshot) => talentBridgeDifference(s).disputableGst;
