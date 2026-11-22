// The guided tour (CLAUDE.md section 14). Each step points at one area of the page (data-tour="...") and explains it.
// "Do it for me" calls the same store action a person would trigger.
import { create } from "zustand";
import { checkInvoice, coverage, inr } from "./engine";
import { INVOICES } from "./data";
import { useStore, type Snapshot } from "./store";
import { contractRate, invoiceRate } from "./todo";
import type { Role } from "./data";

export interface TourStep {
  title: string;
  text: string;
  points?: [string, string | string[]][]; // what each part of the highlighted area means
  route: string;
  target?: string; // data-tour name of the area to ring
  role?: Role;
  isDone?: (s: Snapshot) => boolean; // already done by hand: "Do it for me" has nothing left to do
  run?: () => string; // returns the toast text
  then?: string; // where to go after "Do it for me"
}
export interface Chapter { name: string; blurb: string; steps: TourStep[]; end: string }

const st = () => useStore.getState();
const rate = inr(contractRate()), billed = inr(invoiceRate());
const gap = inr(checkInvoice(INVOICES[0], { termState: { t4: "verified" } }).totals.disputable);

export const CHAPTERS: Chapter[] = [
  {
    name: "Invoice", blurb: "Find an overcharge, prove it, recover it. About 2 minutes.", end: "That's the core loop: find the gap, prove it, recover it, stop it repeating.",
    steps: [
      { title: "The story", route: "/", target: "gap", role: "finance",
        text: `A staffing supplier, TalentBridge, billed ${billed}/hr. The signed contract says ${rate}/hr.`,
        points: [
          ["What happened", [`The invoice charged ${billed}/hr.`, `A change to the contract (Amendment 2) cut the rate to ${rate}/hr from 1 October.`, "The invoice did not follow it."]],
          ["What should have happened", [`Finance pays ${rate}/hr.`, `The extra ${gap} on one line never leaves the company.`]],
          ["How Docket points it out", ["Reads the contract family.", "Works out which rate applies.", "Checks the invoice against it.", "Sends the gap to the person who can act."]],
        ] },
      { title: "The invoice, line by line", route: "/item/A2", target: "proof", role: "finance",
        text: "You are Finance. Docket checked every line of the invoice against the contracts.",
        points: [["Tick marks", "Four basic checks passed: not a duplicate, right company, right purchase orders, right currency."], ["Matches", "The line is billed at the rate in force."], ["Locked", "Line 1 depends on a new rate that Legal has not checked, so nobody can dispute it yet."], ["Docket needs your answer", "Line 4 uses a role name that is not on the rate card."]] },
      { title: "Legal sees the proof", route: "/item/A1", target: "proof", role: "legal",
        text: "Now you are Legal. Legal must check a rate before anyone can dispute an invoice with it.",
        points: [["Contract says", "The exact clauses, word for word, with page and clause number."], ["Invoice says", "The invoice line, and how far over it is if the new rate is confirmed."], ["Recorded AI run", "The AI read the amendment and said it covers SOW-1 only. Legal makes the final call."]] },
      { title: "Legal confirms the rate", route: "/item/A1", target: "action", role: "legal", isDone: (s) => !!s.done.A1, run: () => st().confirmRate(),
        text: "One tap. This button only appears for Legal. Anyone else sees \"Switch to Legal\" instead." },
      { title: "Finance is told", route: "/", target: "notices", role: "finance",
        text: "Back as Finance. A notice appears at the top of the to-do page: the rate is checked, and the invoice line is now an overcharge. Every step hands over to the next person like this." },
      { title: "Docket asks one question", route: "/item/A3", target: "proof", role: "finance",
        text: "Line 4 says \"Technical Consultant\", which is not on the rate card.",
        points: [["Contract says", "The rate card has no Technical Consultant."], ["Timesheet says", "The approved timesheet lists this person as a Senior Developer."], ["Your answer", "Docket is only 82% sure, so Finance decides. AI suggests, people confirm."]] },
      { title: "Confirm the role", route: "/item/A3", target: "action", role: "finance", isDone: (s) => !!s.done.A3, run: () => st().confirmRole(true),
        text: "Say yes. Line 4 now counts as part of the overcharge too." },
      { title: "Confirm the difference", route: "/item/A5", target: "proof", role: "finance", isDone: (s) => !!s.done.A5, run: () => st().confirmDifference(),
        text: "The maths is done by tested code, never by AI.",
        points: [["Line difference", "Hours multiplied by the rate gap, per overcharged line."], ["GST adjustment", "GST follows the base amount. It is shown but never counted as a saving."], ["Total correction", "What the supplier should credit back."]] },
      { title: "Hold only the disputed amount", route: "/item/A6", target: "proof", role: "finance", isDone: (s) => !!s.done.A6, run: () => st().holdDisputed(),
        text: "Pay the undisputed part on time and hold only the disputed amount. That keeps the supplier relationship healthy." },
      { title: "Docket drafts, you send", route: "/item/A7", target: "proof", role: "finance", isDone: (s) => !!s.done.A7, run: () => st().sendDispute(),
        text: "Docket never sends anything. It drafts the email with the clause and the sum filled in. Finance sends it from their own mailbox, then tells Docket." },
      { title: "The supplier's view", route: "/item/A8", target: "action", role: "supplier", isDone: (s) => !!s.done.A8, run: () => st().supplierAgrees(),
        text: "Now you are the supplier. The page is deliberately simple: the clause, the invoice line, the sum. They can agree and issue a credit note, or explain why they disagree." },
      { title: "Record the credit note", route: "/", target: "gap", role: "finance", isDone: (s) => !!s.done.A9, run: () => st().recordCredit(),
        text: "A credit note is a document from the supplier that reduces what you owe. When Finance records it, the gap on the to-do page turns from magenta to teal: money recovered." },
      { title: "Stop it happening again", route: "/item/A10", target: "proof", role: "procurement", isDone: (s) => !!s.done.A10, run: () => st().sendPoUpdate(),
        text: "The purchase order still carries the old rate. Procurement sends an update so next month does not repeat the mistake." },
      { title: "December's invoice", route: "/item/A11", target: "proof", isDone: (s) => !!s.done.A11, run: () => st().showDecember(),
        text: "Fast-forward a month. Every line matches, and Docket shows the repeat overcharge that was prevented." },
      { title: "Confirmed value", route: "/value", target: "value-big", text: "Only money Finance has recorded counts as confirmed. That is the one number the CFO cares about." },
    ],
  },
  {
    name: "Renewal", blurb: "A renewal with a notice deadline and a price cap.", end: "Renewals are decided before the notice deadline, with the facts in front of the owner.",
    steps: [
      { title: "Legal reads the cap", route: "/item/B1", target: "proof", role: "legal", isDone: (s) => !!s.done.B1, run: () => st().decideCap(true),
        text: "CloudDesk wants a 7% increase. The contract caps it at 5% unless a change in law raised their costs.",
        points: [["Contract says", "The cap, and the exception that needs written evidence."], ["Quote says", "Their reason is infrastructure and staffing costs: no law, no evidence."], ["Deadlines", "The notice must be received by 7 Dec, so the decision is due earlier."]] },
      { title: "The owner decides", route: "/item/B2", target: "proof", role: "owner", isDone: (s) => !!s.done.B2, run: () => st().decideRenewal("renegotiate"),
        text: "You are the business owner. Drag the slider: every number below it updates.",
        points: [["Usage chart", "Seats actually used each month. It fell all year."], ["Two savings views", "Against today's budget, and against their quote."], ["Recommendation", "Based on real usage plus a buffer. The owner makes the call."]] },
      { title: "Send the notice", route: "/item/B3", target: "action", role: "procurement", isDone: (s) => !!s.done.B3, run: () => st().dispatchNotice("TOUR-0001"),
        text: "The contract says notice must go by courier or post. Email does not count. Procurement ticks the dispatch checklist and enters a tracking number." },
      { title: "Record the renewal", route: "/item/B4", target: "action", role: "procurement", isDone: (s) => !!s.done.B4, run: () => { if (!st().cdReply) st().showCdReply(); return st().recordRenewal(); },
        text: "CloudDesk replies with a revised quote. Procurement records the signed renewal." },
      { title: "Yearly savings", route: "/value", target: "value-big", text: "Yearly savings are shown apart from one-off amounts. Docket never adds the two together." },
    ],
  },
  {
    name: "Service credit", blurb: "A late-delivery month and the credit the contract promises.", end: "Every claim cites the clause and the data, and only confirmed credits count.",
    steps: [
      { title: "Legal checks the clause", route: "/item/C1", target: "proof", role: "legal", isDone: (s) => !!s.done.C1, run: () => st().confirmSla(),
        text: "SwiftHaul must deliver 95% of shipments on time. The contract gives a credit if it does not." },
      { title: "Procurement reviews exclusions", route: "/item/C2", target: "proof", role: "procurement", isDone: (s) => !!s.done.C2, run: () => st().chooseFm(false),
        text: "Some late shipments are excluded. Compare the two options below.",
        points: [["Full points only", "The contract counts whole percentage points, so 4.41 becomes 4."], ["Force majeure", "The supplier blamed rain but sent no evidence in time. Accepting it lowers the credit."]] },
      { title: "Send the claim", route: "/item/C3", target: "proof", role: "procurement", isDone: (s) => !!s.done.C3, run: () => st().sendClaim(),
        text: "Docket drafts the claim with the clause and the data. Procurement sends it." },
      { title: "The supplier agrees", route: "/item/C4", target: "action", role: "procurement", isDone: (s) => !!s.done.C4, run: () => st().showShReply(),
        text: "This step fast-forwards to SwiftHaul's reply." },
      { title: "Record the offset", route: "/item/C5", target: "action", role: "finance", isDone: (s) => !!s.done.C5, run: () => st().recordOffset(),
        text: "The credit comes off the next invoice. When Finance records it, the credit counts as confirmed." },
      { title: "Who did what", route: "/item/C5", target: "history", role: "finance", text: "History shows every step by person and role. In production this log lives on a secure server." },
    ],
  },
  {
    name: "One source of truth", blurb: "Which file counts, what the tracker got wrong, who was never contracted.", end: "Read the case analysis to see why this stage, who it is for, and how success is measured.",
    steps: [
      { title: "Four files, one contract", route: "/item/F", target: "proof", role: "legal", isDone: (s) => !!s.done.F, run: () => st().confirmSigned(),
        text: "The same main contract exists as Word drafts and a signed PDF. Only the one signed by both parties, with an e-signature record, counts." },
      { title: "The Excel tracker drifted", route: "/item/G", target: "proof", role: "procurement",
        text: "Procurement's spreadsheet says CloudDesk needs 30 days' notice. The contract says 60. Following the sheet would miss the deadline by 30 days." },
      { title: "Who was never contracted", route: "/item/H", target: "proof", role: "procurement", isDone: () => coverage(st().addedDocs).shadow.every((x) => st().requested[x.name]),
        run: () => { coverage(st().addedDocs).shadow.forEach((x) => { if (!st().requested[x.name]) st().requestContract(x.name); }); return "Done. The contract requests are logged."; },
        text: "Suppliers paid this year with no contract in Docket. Most money is covered, but not most suppliers." },
      { title: "A side letter in someone's inbox", route: "/item/I1", target: "proof", role: "legal", isDone: (s) => !!s.done.I1, run: () => st().addBrightline(),
        text: "A signed discount was found in an email. Adding it changes the fee in force for October to December, and January goes back to normal." },
      { title: "Now the case analysis", route: "/case-study", text: "Why this stage, who it is for, the problem, and how success is measured. This page is part of the submission, not part of the product." },
    ],
  },
];

interface TourState { open: boolean; chapter: number | null; step: number; leaving: string | null; start: () => void; pick: (i: number) => void; go: (n: number) => void; end: () => void }
export const useTour = create<TourState>((set) => ({
  open: false, chapter: null, step: 0, leaving: null,
  start: () => set({ open: true, chapter: null, step: 0, leaving: null }),
  pick: (chapter) => set({ chapter, step: 0, leaving: null }),
  go: (step) => set({ step }),
  end: () => set({ open: false, chapter: null, step: 0, leaving: null }),
}));
