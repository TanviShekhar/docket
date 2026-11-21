// The guided tour (CLAUDE.md section 14). "Do it for me" calls the same store action a person would trigger.
import { create } from "zustand";
import { coverage } from "./engine";
import { useStore, type Snapshot } from "./store";
import type { Role } from "./data";

export interface TourStep {
  text: string;
  route: string;
  role?: Role;
  isDone?: (s: Snapshot) => boolean; // already done by hand: "Do it for me" has nothing left to do
  run?: () => string; // returns the toast text
  then?: string; // where to go after "Do it for me"
}
export interface Chapter { name: string; blurb: string; steps: TourStep[]; end: string }

const st = () => useStore.getState();

export const CHAPTERS: Chapter[] = [
  {
    name: "Invoice", blurb: "About 90 seconds. Find an overcharge, prove it, recover it.", end: "That's the core loop: find the gap, prove it, recover it, stop it repeating.",
    steps: [
      { text: "Finance opens the invoice. Line 1 is locked: it depends on a new rate that Legal has not checked yet.", route: "/item/A2", role: "finance" },
      { text: "Legal checks the new rate against Amendment 2. One tap confirms it.", route: "/item/A1", role: "legal", isDone: (s) => !!s.done.A1, run: () => st().confirmRate() },
      { text: "Back as Finance, a notice appears: the rate is checked and the invoice line is now an overcharge.", route: "/", role: "finance" },
      { text: "Finance answers Docket's one question: is \"Technical Consultant\" really a Senior Developer?", route: "/item/A3", role: "finance", isDone: (s) => !!s.done.A3, run: () => st().confirmRole(true) },
      { text: "Finance confirms the difference, with the GST that follows it.", route: "/item/A5", role: "finance", isDone: (s) => !!s.done.A5, run: () => st().confirmDifference() },
      { text: "Pay the rest of the invoice on time and hold only the disputed amount.", route: "/item/A6", role: "finance", isDone: (s) => !!s.done.A6, run: () => st().holdDisputed() },
      { text: "Docket drafts the dispute email. Finance sends it from their own mailbox, then tells Docket.", route: "/item/A7", role: "finance", isDone: (s) => !!s.done.A7, run: () => st().sendDispute() },
      { text: "The supplier sees a simple page with the clause, the invoice line and the sum. Here they agree.", route: "/item/A8", role: "supplier", isDone: (s) => !!s.done.A8, run: () => st().supplierAgrees() },
      { text: "Finance records the credit note. Watch the gap on the To-do page turn teal.", route: "/item/A9", role: "finance", isDone: (s) => !!s.done.A9, run: () => st().recordCredit(), then: "/" },
      { text: "Procurement fixes the price at source, so next month does not repeat it.", route: "/item/A10", role: "procurement", isDone: (s) => !!s.done.A10, run: () => st().sendPoUpdate() },
      { text: "Fast-forward to December's invoice: every line matches, and the repeat overcharge is prevented.", route: "/item/A11", isDone: (s) => !!s.done.A11, run: () => st().showDecember() },
      { text: "The Value screen counts the credit as confirmed, because Finance recorded it.", route: "/value" },
    ],
  },
  {
    name: "Renewal", blurb: "A renewal with a notice deadline and a price cap.", end: "Renewals are decided before the notice deadline, with the facts in front of the owner.",
    steps: [
      { text: "Legal reads the cap clause. CloudDesk wants 7%, the contract caps it at 5% unless a law changed.", route: "/item/B1", role: "legal", isDone: (s) => !!s.done.B1, run: () => st().decideCap(true) },
      { text: "The business owner decides. Drag the seat slider: every number changes. Docket suggests a seat count from real usage.", route: "/item/B2", role: "owner", isDone: (s) => !!s.done.B2, run: () => st().decideRenewal("renegotiate") },
      { text: "Procurement sends the notice by courier. Email does not count under the contract.", route: "/item/B3", role: "procurement", isDone: (s) => !!s.done.B3, run: () => st().dispatchNotice("TOUR-0001") },
      { text: "CloudDesk replies with a revised quote. Procurement records the signed renewal.", route: "/item/B4", role: "procurement", isDone: (s) => !!s.done.B4, run: () => { if (!st().cdReply) st().showCdReply(); return st().recordRenewal(); } },
      { text: "The Value screen shows the yearly savings as confirmed, kept apart from one-off amounts.", route: "/value" },
    ],
  },
  {
    name: "Service credit", blurb: "A late-delivery month and the credit the contract promises.", end: "Every claim cites the clause and the data, and only confirmed credits count.",
    steps: [
      { text: "Legal checks the service-level clauses before anyone makes a claim.", route: "/item/C1", role: "legal", isDone: (s) => !!s.done.C1, run: () => st().confirmSla() },
      { text: "Procurement reviews the exclusions. Note the full-point step: only whole points count.", route: "/item/C2", role: "procurement", isDone: (s) => !!s.done.C2, run: () => st().chooseFm(false) },
      { text: "Docket drafts the claim letter. Procurement sends it.", route: "/item/C3", role: "procurement", isDone: (s) => !!s.done.C3, run: () => st().sendClaim() },
      { text: "SwiftHaul agrees to the credit.", route: "/item/C4", role: "procurement", isDone: (s) => !!s.done.C4, run: () => st().showShReply() },
      { text: "Finance records the offset on the next invoice.", route: "/item/C5", role: "finance", isDone: (s) => !!s.done.C5, run: () => st().recordOffset() },
      { text: "Open History at the bottom: who did what, lane by lane.", route: "/item/C5", role: "finance" },
    ],
  },
  {
    name: "One source of truth", blurb: "Which file counts, what the tracker got wrong, who was never contracted.", end: "Read the case study to see why this stage, who it is for, and how success is measured.",
    steps: [
      { text: "Four files exist for one main contract. Only one is signed by both parties. Legal confirms it.", route: "/item/F", role: "legal", isDone: (s) => !!s.done.F, run: () => st().confirmSigned() },
      { text: "Procurement's Excel tracker says 30 days for CloudDesk. The contract says 60. Following the tracker would miss the deadline by 30 days.", route: "/item/G", role: "procurement" },
      { text: "Coverage: suppliers paid this year with no contract in Docket. Most money is covered, but not most suppliers.", route: "/item/H", role: "procurement", isDone: () => coverage(st().addedDocs).shadow.every((x) => st().requested[x.name]), run: () => { coverage(st().addedDocs).shadow.forEach((x) => { if (!st().requested[x.name]) st().requestContract(x.name); }); return "Done. The contract requests are logged."; } },
      { text: "A signed Brightline side letter was found in someone's email. Adding it changes the fee in force for October to December.", route: "/item/I1", role: "legal", isDone: (s) => !!s.done.I1, run: () => st().addBrightline() },
      { text: "Now read the case study: why this stage, the stakeholders, the problem, and how success is measured.", route: "/case-study" },
    ],
  },
];

interface TourState { open: boolean; chapter: number | null; step: number; start: () => void; pick: (i: number) => void; go: (n: number) => void; end: () => void }
export const useTour = create<TourState>((set) => ({
  open: false, chapter: null, step: 0,
  start: () => set({ open: true, chapter: null, step: 0 }),
  pick: (chapter) => set({ chapter, step: 0 }),
  go: (step) => set({ step }),
  end: () => set({ open: false, chapter: null, step: 0 }),
}));
