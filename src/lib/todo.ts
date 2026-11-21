// Builds the to-do cards from the case state machines (CLAUDE.md section 9). All numbers come from the engine.
import { CD_SEATS, DELEGATES, DEMO_TODAY, FILE_VERSIONS, INVOICES, SH_DELIVERY, type Role } from "./data";
import { checkInvoice, claimDeadline, coverage, escalation, inr, iso, priority, renewalDates, renewalMoney, resolveTerm, slaCalc, subWorkdays, D, LEAD, trackerCheck } from "./engine";
import { checkStateOf, seatsFor, talentBridgeDifference } from "./ledger";
import { shortDate } from "./copy";
import type { Snapshot } from "./store";

export interface Card {
  id: string; caseId: string; owner: Role; headline: string; amount: number | null;
  due: string | null; dueText: string; prio?: { impact: number; time: number; unc: number; total: number };
}

const tbInv = INVOICES[0];
const nsInv = INVOICES[1];

export function contractRate() { return resolveTerm("TB", "rate:Senior Developer", "SOW-1", "2026-10-15").winner!.t.value as number; }
export const invoiceRate = () => tbInv.lines[0].rate;

export function allCards(s: Snapshot): Card[] {
  const d = s.done;
  const tb = talentBridgeDifference(s);
  const rate = contractRate(), billed = invoiceRate();
  const dates = renewalDates(CD_SEATS.renewal, CD_SEATS.noticeDays);
  const seats = seatsFor(s);
  const rm = renewalMoney(CD_SEATS, seats, s.capApplies ? 5 : CD_SEATS.quoteUplift);
  const sh = slaCalc(SH_DELIVERY, s.fmAccepted);
  const claimBy = claimDeadline(SH_DELIVERY.month);
  const invDue = (iv: { due: string }) => ({ due: iv.due, dueText: `Invoice due ${shortDate(iv.due)}` });
  const out: Card[] = [];
  const line4 = checkInvoice(tbInv, { ...checkStateOf(s), termState: { ...s.termState, t4: "verified" } }).lines[3];
  const hold = tb.disputable + tb.disputableGst;

  // Case A: TalentBridge invoice. The card shows the current step only.
  const A: [string, Role, string, number | null][] = [
    ["A1", "legal", `TalentBridge billed ${inr(billed)}/hr. The contract says ${inr(rate)} since 1 Oct.`, tb.disputable],
    ["A3", "finance", `Line 4 of ${tbInv.id} says Technical Consultant. Docket thinks this is a Senior Developer (${Math.round(tbInv.lines[3].suggest!.conf * 100)}% sure).`, line4.diff ?? null],
    ["A5", "finance", `Confirm the difference on ${tbInv.id}: ${inr(tb.disputable)} plus GST ${inr(tb.disputableGst)}.`, tb.disputable],
    ["A6", "finance", `Pay the rest of ${tbInv.id} on time and hold ${inr(hold)}.`, hold],
    ["A7", "finance", `Send TalentBridge the dispute for ${tbInv.id}.`, hold],
    ["A8", "supplier", `Larkspur says invoice ${tbInv.id} charged ${inr(billed)}/hr for SOW-1 in October. Your signed Amendment 2 sets ${inr(rate)}/hr from 1 Oct.`, hold],
    ["A9", "finance", `TalentBridge sent credit note CN-TB-0091 for ${inr(tb.disputable)} plus GST ${inr(tb.disputableGst)}. Record it.`, tb.disputable],
    ["A10", "procurement", `PO ${tbInv.pos[0]} still says ${inr(billed)}/hr. Next month will repeat unless it is fixed.`, null],
  ];
  // If Legal rejects the new rate reading, the invoice dispute stops here.
  const rejected = s.termState.t4 === "rejected";
  let aNext: [string, Role, string, number | null] | undefined = rejected ? undefined : A.find(([id]) => !d[id]);
  // The supplier disagreed: Finance replies with the amendment before the supplier is asked again.
  if (aNext && aNext[0] === "A8" && s.supplierReply === "disagreed" && !s.replyResent) {
    aNext = ["A8r", "finance", "TalentBridge says they billed from their standard rate card. Reply with the signed amendment.", hold];
  }
  if (!aNext && !rejected && !d.A11) {
    aNext = ["A11", s.role === "supplier" ? "finance" : s.role, "Check December's invoice to see that the repeat overcharge is gone.", null];
  }
  if (!d.A1 && !rejected) {
    out.push({ id: "A2", caseId: "A", owner: "finance", headline: `Invoice ${tbInv.id} has ${tbInv.lines.length} lines. Line 1 is locked until Legal checks the rate.`, amount: checkInvoice(tbInv, {}).totals.potential, ...invDue(tbInv) });
  }
  if (aNext) { const [id, owner, headline, amount] = aNext; out.push({ id, caseId: "A", owner, headline, amount, ...invDue(tbInv) }); }
  if (d.A1 && !d.A4 && !rejected) {
    const ex = tbInv.lines[5];
    out.push({ id: "A4", caseId: "A", owner: "finance", headline: `${inr(ex.rate)} travel on ${tbInv.id} has no prior approval on file.`, amount: ex.rate, ...invDue(tbInv) });
  }

  // Case B: CloudDesk renewal
  const dispatchBy = iso(subWorkdays(D(dates.notice), LEAD[0].days));
  const B: [string, Role, string, number | null, string, string][] = [
    ["B1", "legal", "CloudDesk wants +7% on renewal. The contract caps it at 5% unless a change in law raises their cost.", renewalMoney(CD_SEATS, seats, 5).capSaving, dates.internal, "Decide by"],
    ["B2", "owner", `Decide CloudDesk's renewal. Docket suggests ${seats} seats instead of ${CD_SEATS.contracted}.`, rm.vsQuote, dates.internal, "Decide by"],
    ["B3", "procurement", "Send CloudDesk the notice by courier. Email does not count under clause 17.3.", rm.vsQuote, dispatchBy, "Dispatch by"],
    ["B4", "procurement", "Record CloudDesk's revised quote and the signed renewal.", rm.vsQuote, dates.notice, "Notice received by"],
  ];
  const bNext = B.find(([id]) => !d[id]);
  if (bNext) { const [id, owner, headline, amount, due, label] = bNext; out.push({ id, caseId: "B", owner, headline, amount, due, dueText: `${label} ${shortDate(due)}` }); }

  // Case C: SwiftHaul service credit
  const C: [string, Role, string, number | null][] = [
    ["C1", "legal", "SwiftHaul's service credit clause needs checking before any claim.", sh.credit],
    ["C2", "procurement", `SwiftHaul delivered ${sh.perf.toFixed(2)}% on time in October, below the 95% target. Review the exclusions.`, sh.credit],
    ["C3", "procurement", `Send SwiftHaul the October service credit claim for ${inr(sh.credit)}.`, sh.credit],
    ["C4", "procurement", "Waiting for SwiftHaul's reply to the claim.", sh.credit],
    ["C5", "finance", `Record the ${inr(sh.credit)} offset on SwiftHaul's December invoice.`, sh.credit],
  ];
  const cNext = C.find(([id]) => !d[id]);
  if (cNext) { const [id, owner, headline, amount] = cNext; out.push({ id, caseId: "C", owner, headline, amount, due: claimBy, dueText: `Claim by ${shortDate(claimBy)}` }); }

  // Single-step cases
  const none = { due: null, dueText: "No due date" };
  if (!d.D) out.push({ id: "D", caseId: "D", owner: "legal", headline: "PrimeFacility's contract says \"prompt response\" but gives no time limit, so Docket cannot measure it.", amount: null, ...none });
  if (!d.E) { const sub = checkInvoice(nsInv).totals.sub; out.push({ id: "E", caseId: "E", owner: "finance", headline: `${nsInv.entity} sent a ${inr(sub)} invoice. Docket found no matching contract.`, amount: sub, ...invDue(nsInv) }); }
  if (!d.F) {
    const signed = FILE_VERSIONS.filter((f) => f.signedBoth).length;
    out.push({ id: "F", caseId: "F", owner: "legal", headline: `Docket found ${FILE_VERSIONS.length} files for the TalentBridge main contract. Only ${signed} is signed by both parties.`, amount: null, ...none });
  }
  if (!d.G) {
    const n = trackerCheck(checkStateOf(s), DEMO_TODAY).filter((x) => !x.match && !s.trackerFixed[x.row.sup]).length;
    out.push({ id: "G", caseId: "G", owner: "procurement", headline: `Procurement's tracker disagrees with the contracts in ${n} ${n === 1 ? "place" : "places"}.`, amount: null, ...none });
  }
  if (!d.H) {
    const c = coverage(s.addedDocs);
    out.push({ id: "H", caseId: "H", owner: "procurement", headline: `${c.paid} suppliers were paid this year. ${c.covered} have a contract in Docket.`, amount: null, ...none });
  }
  // Case I: found outside Docket. Brightline: Nov and Dec of the Q4 discount are still ahead (two months).
  const BL_MONTHS_AHEAD = 2;
  if (!d.I1) {
    const gapPerMonth = (resolveTerm("BL", "fee", null, "2026-11-15").winner!.t.value as number) - 1575000;
    out.push({ id: "I1", caseId: "I", owner: "legal", headline: "Docket found a signed Brightline side letter that is not in the contract family.", amount: gapPerMonth * BL_MONTHS_AHEAD, due: "2026-12-01", dueText: `Next retainer invoice about ${shortDate("2026-12-01")}` });
  }
  if (!d.I2) out.push({ id: "I2", caseId: "I", owner: "legal", headline: "Docket found a signed Zenith Events quote in a personal folder.", amount: null, ...none });

  // Legal priority (just-in-time checking)
  const pr: Record<string, ReturnType<typeof priority>> = {
    B1: priority(renewalMoney(CD_SEATS, seats, 5).capSaving, 2, 0.88, true),
    C1: priority(slaCalc(SH_DELIVERY, false).credit, 7, 0.9, false),
    I1: priority(350000, 8, 0.95, false),
    A1: priority(talentBridgeDifference({ ...s, mapConfirmed: { L4: "Senior Developer" } }).disputable, 10, 0.94, false),
    D: priority(0, null, 0.93, true), I2: priority(0, null, 0.94, false), F: priority(0, null, 0.97, false),
  };
  out.forEach((c) => { if (c.owner === "legal" && pr[c.id]) c.prio = pr[c.id]; });
  return out;
}

// Reminder, escalation and overdue wording for a card (fixes "approvals stall").
export function escalationText(c: Card): string | null { return c.due && c.id !== "C4" ? dueLine(c.due, c.owner) : null; }
export function dueLine(due: string, owner: Role): string {
  const c = { due, owner };
  const e = escalation(c.due, DEMO_TODAY, false);
  const who = DELEGATES[c.owner];
  if (e.status === "overdue") return `Overdue: escalated to ${who.name}`;
  if (e.status === "reminded") return `${e.remindOn === DEMO_TODAY ? "Reminder sent today" : `Reminder sent ${shortDate(e.remindOn)}`}. Escalates to ${who.name} (${who.title}) on ${shortDate(e.escalateOn)} if not done`;
  return `On track, due ${shortDate(c.due)}`;
}

export function sortCards(cards: Card[], role: Role) {
  const key = (c: Card) => c.due ?? "9999";
  const byDue = (a: Card, b: Card) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  return [...cards].sort(role === "legal" ? (a, b) => (b.prio?.total ?? 0) - (a.prio?.total ?? 0) || byDue(a, b) : byDue);
}
