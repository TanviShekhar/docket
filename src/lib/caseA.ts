// Case A (TalentBridge invoice) facts and drafted text. Every number comes from engine.ts.
import { DOCS, INVOICES, NEXT_INVOICE, PEOPLE } from "./data";
import { checkInvoice, D, inr } from "./engine";
import { dmy } from "./copy";
import { checkStateOf } from "./ledger";
import { contractRate, invoiceRate } from "./todo";
import type { Snapshot } from "./store";

export const CREDIT_NOTE_NO = "CN-TB-0091";
const long = (s: string) => D(s).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function facts(s: Snapshot) {
  const inv = INVOICES[0];
  const res = checkInvoice(inv, checkStateOf(s));
  const t = res.totals;
  const overHours = res.lines.filter((l) => l.status === "over").reduce((a, l) => a + l.l.qty, 0);
  const hold = t.disputable + t.disputableGst;
  return { inv, res, rate: contractRate(), billed: invoiceRate(), perHour: invoiceRate() - contractRate(), overHours, base: t.disputable, gst: t.disputableGst, hold, payNow: t.total - hold, total: t.total };
}

export const amendment2 = () => DOCS.find((d) => d.id === "TB-AMD2")!;
export const supplierFirstName = () => PEOPLE.supplier.name.split(" ")[0];

export function disputeEmail(s: Snapshot) {
  const f = facts(s), amd = amendment2();
  const travel = s.expenseApproved.L6 ? "" : s.expenseDisputed
    ? `\nWe are also asking you to send the written approval for the ${inr(f.inv.lines[5].rate)} travel on line 6, which we could not find.\n` : "";
  return `Subject: ${f.inv.id}: Senior Developer rate for SOW-1 in October

Hi ${supplierFirstName()},

Thanks for invoice ${f.inv.id}. Under Amendment 2 (signed ${dmy(amd.signed!)}), the Senior Developer rate for SOW-1 is ${inr(f.rate)}/hr from ${long(amd.effective)}. The invoice bills ${f.overHours} October hours at ${inr(f.billed)}/hr.

Difference: ${f.overHours} h × ${inr(f.perHour)} = ${inr(f.base)}, plus GST of ${inr(f.gst)}.
${travel}
We're paying the rest of the invoice on time and holding ${inr(f.hold)}. Could you send a credit note for this amount?

Clause: "${amd.clauses[0].text}"

Thanks,
${PEOPLE.finance.name}, Accounts Payable, Larkspur Technologies`;
}

export function poUpdateText(s: Snapshot) {
  const f = facts(s), amd = amendment2();
  return `Subject: Please update PO ${f.inv.pos[0]} and the supplier rate table

To: Internal buying team, ${PEOPLE.supplier.name} at TalentBridge

Please update PO ${f.inv.pos[0]} and the supplier rate table for Senior Developer (SOW-1) to ${inr(f.rate)}/hr from ${long(amd.effective)}, as set by Amendment 2. The PO currently says ${inr(f.billed)}/hr.

Thanks,
${PEOPLE.procurement.name}, Procurement, Larkspur Technologies`;
}

// December's invoice, fast-forwarded: every line should match, and the old rate would have cost this much again.
export function december(s: Snapshot) {
  const res = checkInvoice(NEXT_INVOICE, checkStateOf(s));
  const hours = NEXT_INVOICE.lines[0].qty;
  return { inv: NEXT_INVOICE, res, allMatch: res.lines.every((l) => l.status === "match"), hours, prevented: hours * (invoiceRate() - contractRate()) };
}
