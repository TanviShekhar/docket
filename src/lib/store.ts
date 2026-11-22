import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO_TODAY, PEOPLE, type Role, type TrustState } from "./data";
import { inr } from "./engine";
import { CREDIT_NOTE_NO, facts } from "./caseA";
import { contractRate } from "./todo";
import { dmy } from "./copy";
import { cdFacts, shFacts } from "./caseBC";
import { checkStateOf, seatsFor } from "./ledger";
import { blFees } from "./contracts";
import { coverage, pickOperative, trackerCheck } from "./engine";

export interface Notice { id: string; to: Role; from: string; text: string; at: string; link?: string }
// Event log: who did what, with evidence. Stored in this browser only (production needs a server-side log).
export interface DocketEvent { at: string; role: Role; person: string; action: string; caseId: string; evidence: string }

export interface Snapshot {
  role: Role;
  signedIn: boolean; // the simulated sign-in on the welcome screen
  done: Record<string, boolean>; // step id, for example "A1"
  termState: Record<string, TrustState>;
  mapConfirmed: Record<string, string | false>;
  expenseApproved: Record<string, boolean>;
  expenseDisputed: boolean;
  addedDocs: Record<string, boolean>;
  notices: Notice[];
  events: DocketEvent[];
  rejectReason: Record<string, string>;
  supplierReply: "agreed" | "disagreed" | null; // Case A8
  replyResent: boolean; // Finance sent the amendment back after a disagreement
  fmAccepted: boolean; // SwiftHaul: Procurement accepts force majeure
  capApplies: boolean; // CloudDesk: the 5% cap applies
  seats: number | null; // CloudDesk: null means use Docket's suggestion
  importance: "High" | "Medium" | "Low";
  renewalDecision: "renegotiate" | "asis" | "dont" | null;
  trackingNo: string;
  cdReply: boolean; // demo: CloudDesk's revised quote has been shown
  shReply: boolean; // demo: SwiftHaul's reply has been shown
  trackerFixed: Record<string, boolean>; // Excel tracker rows corrected, by supplier id
  requested: Record<string, boolean>; // contract requests started for suppliers with no contract, by name
  rejectedDocs: Record<string, string>; // documents Legal said are not valid, with the reason
}

const initial: Snapshot = {
  role: "finance", signedIn: false, done: {}, termState: {}, mapConfirmed: {}, expenseApproved: {}, expenseDisputed: false, addedDocs: {},
  notices: [], events: [], rejectReason: {}, supplierReply: null, replyResent: false, fmAccepted: false, capApplies: true, seats: null,
  importance: "Medium", renewalDecision: null, trackingNo: "", cdReply: false, shReply: false,
  trackerFixed: {}, requested: {}, rejectedDocs: {},
};

interface Actions {
  setRole: (r: Role) => void;
  signIn: (r: Role) => void;
  signOut: () => void;
  dismissNotice: (id: string) => void;
  // Case A. Each returns the toast text.
  confirmRate: () => string; // A1
  rejectRate: (reason: string) => string;
  confirmRole: (yes: boolean) => string; // A3
  resolveExpense: (attach: boolean) => string; // A4
  confirmDifference: () => string; // A5
  holdDisputed: () => string; // A6
  sendDispute: () => string; // A7
  supplierAgrees: () => string; // A8
  supplierDisagrees: () => string;
  replyWithAmendment: () => string;
  recordCredit: () => string; // A9
  sendPoUpdate: () => string; // A10
  showDecember: () => string; // A11
  // Case B
  decideCap: (applies: boolean) => string;
  setSeats: (n: number) => void;
  setImportance: (i: "High" | "Medium" | "Low") => void;
  decideRenewal: (d: "renegotiate" | "asis" | "dont") => string;
  dispatchNotice: (trackingNo: string) => string;
  showCdReply: () => string;
  recordRenewal: () => string;
  // Case C
  confirmSla: () => string;
  chooseFm: (accept: boolean) => string;
  sendClaim: () => string;
  showShReply: () => string;
  recordOffset: () => string;
  // Cases F to I
  confirmSigned: () => string;
  fixTracker: () => string;
  requestContract: (name: string) => string;
  addBrightline: () => string;
  rejectBrightline: (reason: string) => string;
  addZenith: () => string;
  // Cases D and E
  addRenegotiation: () => string;
  sendToIntake: () => string;
  reset: () => void;
}

// The toast is not saved: it only lives while the page is open.
export const useToast = create<{ text: string | null; show: (t: string) => void; hide: () => void }>((set) => ({
  text: null, show: (text) => set({ text }), hide: () => set({ text: null }),
}));

const stamp = () => `${DEMO_TODAY} ${new Date().toTimeString().slice(0, 5)}`;
type NoticeIn = Omit<Notice, "at">;

export const useStore = create<Snapshot & Actions>()(
  persist(
    (set, get) => {
      // One place that changes state, writes the event and adds hand-off notices.
      const commit = (patch: Partial<Snapshot>, role: Role, action: string, evidence: string, notices: ((next: Snapshot) => NoticeIn)[] = [], caseId = "A") => {
        const s = get();
        const next = { ...s, ...patch } as Snapshot;
        const at = stamp();
        set({
          ...patch,
          events: [...s.events, { at, role, person: PEOPLE[role].name, action, caseId, evidence }],
          notices: [...s.notices.filter((n) => !notices.some((f) => f(next).id === n.id)), ...notices.map((f) => ({ ...f(next), at }))],
        });
      };
      const markDone = (id: string, extra: Partial<Snapshot> = {}) => ({ done: { ...get().done, [id]: true }, ...extra });

      return {
        ...initial,
        setRole: (role) => set({ role }),
        signIn: (role) => set({ signedIn: true, role }),
        signOut: () => set({ signedIn: false }),
        dismissNotice: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),

        confirmRate: () => {
          const s = get();
          const termState = { ...s.termState, t4: "verified" as TrustState };
          commit(markDone("A1", { termState }), "legal", `Checked the Senior Developer rate for SOW-1 (${inr(contractRate())}/hr from 1 Oct)`, "Amendment 2, clause 1",
            [(n) => ({ id: "n-A1", to: "finance", from: "Legal", link: "/item/A3", text: `the ${inr(contractRate())} rate is checked. The invoice line is now a ${inr(facts(n).base)} overcharge.` })]);
          return "Done. Finance has been told.";
        },
        rejectRate: (reason) => {
          const s = get();
          commit(markDone("A1", { termState: { ...s.termState, t4: "rejected" }, rejectReason: { ...s.rejectReason, A1: reason } }), "legal",
            `Said the new rate reading is wrong: ${reason}`, "Amendment 2, clause 1",
            [() => ({ id: "n-A1", to: "finance", from: "Legal", text: "Legal did not accept the new rate, so the invoice line is not disputed for now." })]);
          return "Done. Finance has been told.";
        },
        confirmRole: (yes) => {
          const s = get();
          commit(markDone("A3", { mapConfirmed: { ...s.mapConfirmed, L4: yes ? "Senior Developer" : false } }), "finance",
            yes ? "Confirmed that line 4 (Technical Consultant) is a Senior Developer" : "Said line 4 is not a Senior Developer and asked the supplier", "Timesheet and rate card");
          return "Done. Line 4 is recorded.";
        },
        resolveExpense: (attach) => {
          const s = get();
          commit(markDone("A4", attach ? { expenseApproved: { ...s.expenseApproved, L6: true } } : { expenseDisputed: true }), "finance",
            attach ? "Attached the approval email for the travel line (demo)" : "Chose to dispute the travel line as well", "MSA clause 6.4");
          return "Done. The travel line is recorded.";
        },
        confirmDifference: () => {
          commit(markDone("A5"), "finance", "Confirmed the difference on the invoice", "Calculated from the invoice and the rate in force");
          return "Done. The difference is confirmed.";
        },
        holdDisputed: () => {
          commit(markDone("A6"), "finance", "Chose to hold only the disputed amount and pay the rest on time", "Invoice terms");
          return "Done. The hold is recorded.";
        },
        sendDispute: () => {
          commit(markDone("A7"), "finance", "Sent the dispute email from their own mailbox", "Dispute email (template)",
            [(n) => ({ id: "n-A7", to: "supplier", from: "Larkspur", link: "/item/A8", text: `a question about invoice ${facts(n).inv.id}. Please check it.` })]);
          return "Done. TalentBridge has been told.";
        },
        supplierAgrees: () => {
          commit(markDone("A8", { supplierReply: "agreed" }), "supplier", `Agreed and issued credit note ${CREDIT_NOTE_NO}`, "Amendment 2, clause 1",
            [(n) => ({ id: "n-A8", to: "finance", from: "TalentBridge", link: "/item/A9", text: `agreed and sent credit note ${CREDIT_NOTE_NO} for ${inr(facts(n).base)} plus GST ${inr(facts(n).gst)}.` })]);
          return "Done. Larkspur has been told.";
        },
        supplierDisagrees: () => {
          commit({ supplierReply: "disagreed", replyResent: false }, "supplier", "Disagreed: \"We billed from our standard rate card.\"", "Supplier reply",
            [() => ({ id: "n-A8", to: "finance", from: "TalentBridge", link: "/item/A8r", text: "they disagree and say they billed from their standard rate card." })]);
          return "Done. Larkspur has been told.";
        },
        replyWithAmendment: () => {
          commit({ replyResent: true }, "finance", "Replied with the signed Amendment 2", "Amendment 2, clause 1",
            [() => ({ id: "n-A8b", to: "supplier", from: "Larkspur", link: "/item/A8", text: "we replied with the signed Amendment 2. Please check it again." })]);
          return "Done. TalentBridge has been told.";
        },
        recordCredit: () => {
          commit(markDone("A9"), "finance", `Recorded credit note ${CREDIT_NOTE_NO}`, `Credit note ${CREDIT_NOTE_NO}`,
            [(n) => ({ id: "n-A9", to: "procurement", from: "Finance", link: "/item/A10", text: `credit note ${CREDIT_NOTE_NO} is recorded. PO ${facts(n).inv.pos[0]} still says ${inr(facts(n).billed)}/hr.` })]);
          return "Done. The credit is recorded. Procurement has been told.";
        },
        sendPoUpdate: () => {
          commit(markDone("A10"), "procurement", "Sent the PO and rate table update request", "Amendment 2, clause 1");
          return "Done. The update request is recorded.";
        },
        showDecember: () => {
          commit(markDone("A11"), s_role(get), "Loaded December's invoice to check the fix", "INV-TB-1203 (simulated)");
          return "Done. December's invoice is loaded.";
        },
        decideCap: (applies) => {
          commit(markDone("B1", { capApplies: applies, termState: applies ? { ...get().termState, t6: "verified" as TrustState } : get().termState }), "legal", applies ? "Read clause 9.2: the 5% cap applies" : "Read clause 9.2: the change-in-law exception applies", "Clause 9.2 and quote CD-RQ-2291", [
            (n) => ({ id: "n-B1", to: "owner", from: "Legal", link: "/item/B2", text: n.capApplies ? `the 5% cap holds. Renewing at the quote would cost ${inr(cdFacts(n).rm.asQuote - cdFacts(n).rm.atCap)} more than the cap allows.` : "the cap exception applies, so only fewer seats can save money." })], "B");
          return "Done. The business owner has been told.";
        },
        setSeats: (seats) => set({ seats }),
        setImportance: (importance) => set({ importance }),
        decideRenewal: (d) => {
          const s = get();
          const label = d === "renegotiate" ? `Chose to renegotiate at ${seatsFor(s)} seats` : d === "asis" ? "Chose to renew as quoted" : "Chose not to renew";
          commit({ ...markDone("B2", d === "asis" ? { done: { ...get().done, B2: true, B3: true, B4: true } } : {}), renewalDecision: d }, "owner", label, `Usage and savings shown (importance: ${s.importance})`,
            d === "asis" ? [] : [(n) => ({ id: "n-B2", to: "procurement", from: "Anuj Shinde", link: "/item/B3", text: `${label.toLowerCase()}. Send the notice by courier. It must reach CloudDesk by ${dmy(cdFacts(n).dates.notice)}.` })], "B");
          return d === "asis" ? "Done. The renewal is recorded." : "Done. Procurement has been told.";
        },
        dispatchNotice: (trackingNo) => {
          const s = get();
          commit({ done: { ...s.done, B3: true, ...(s.renewalDecision === "dont" ? { B4: true } : {}) }, trackingNo }, "procurement", `Dispatched the notice by courier (tracking ${trackingNo})`, "Notice letter and clause 17.3");
          return "Done. The dispatch is recorded.";
        },
        showCdReply: () => { commit({ cdReply: true }, "procurement", "Recorded CloudDesk's revised quote", "Revised quote (demo)"); return "Done. CloudDesk's reply is shown."; },
        recordRenewal: () => { commit(markDone("B4"), "procurement", "Recorded the signed renewal", "Signed renewal (demo)"); return "Done. The renewal is recorded."; },

        confirmSla: () => {
          commit(markDone("C1", { termState: { ...get().termState, t8: "verified" } }), "legal", "Checked the service-level clauses 7.1, 7.3 and 7.4", "SwiftHaul agreement, clauses 7.1 to 7.4", [
            () => ({ id: "n-C1", to: "procurement", from: "Legal", link: "/item/C2", text: "the SwiftHaul service credit clause is checked. Review the late shipments before you claim." })], "C");
          return "Done. Procurement has been told.";
        },
        chooseFm: (accept) => {
          commit(markDone("C2", { fmAccepted: accept }), "procurement", accept ? "Accepted force majeure for 12 shipments" : "Did not accept force majeure for 12 shipments", "Clause 7.3 and supplier email of 3 Nov", [], "C");
          return "Done. Your choice is recorded.";
        },
        sendClaim: () => { commit(markDone("C3"), "procurement", "Sent the service credit claim from their own email", "Claim letter (template)", [], "C"); return "Done. The claim is recorded as sent."; },
        showShReply: () => {
          commit(markDone("C4"), "procurement", "Recorded SwiftHaul's agreement to the credit", "SwiftHaul reply (demo)", [
            (n) => ({ id: "n-C4", to: "finance", from: "Procurement", link: "/item/C5", text: `SwiftHaul agreed to a ${inr(shFacts(n).chosen.credit)} credit. Record the offset on the December invoice.` })], "C");
          return "Done. Finance has been told.";
        },
        recordOffset: () => { commit(markDone("C5"), "finance", "Recorded the offset on the next SwiftHaul invoice", "Agreed credit", [], "C"); return "Done. The credit is recorded."; },

        confirmSigned: () => {
          commit(markDone("F"), "legal", "Confirmed MSA_signed.pdf as the contract that counts and marked the drafts as not current", "E-signature record " + (pickOperative().operative?.eSign ?? ""), [], "F");
          return "Done. The drafts are marked as not current.";
        },
        fixTracker: () => {
          const s = get();
          const known = trackerCheck(checkStateOf(s), DEMO_TODAY).filter((r) => !r.match && !s.trackerFixed[r.row.sup] && (r.row.sup !== "TB" || s.termState.t4 === "verified"));
          const fixed = { ...s.trackerFixed, ...Object.fromEntries(known.map((r) => [r.row.sup, true])) };
          const left = trackerCheck(checkStateOf(s), DEMO_TODAY).filter((r) => !r.match && !fixed[r.row.sup]).length;
          commit({ trackerFixed: fixed, done: left === 0 ? { ...s.done, G: true } : s.done }, "procurement", `Updated ${known.length} tracker ${known.length === 1 ? "row" : "rows"} from the signed contracts`, "Supplier_contracts_tracker.xlsx", [], "G");
          return left === 0 ? "Done. The tracker rows are fixed." : "Done. The rest waits for Legal to check the rate.";
        },
        requestContract: (name) => {
          const s = get();
          const requested = { ...s.requested, [name]: true };
          const allIn = coverage(s.addedDocs).shadow.every((x) => requested[x.name]);
          commit({ requested, done: allIn ? { ...s.done, H: true } : s.done }, "procurement", `Started a contract request for ${name}`, "Coverage check (ERP and corporate card feed)", [], "H");
          return "Done. The contract request is logged for intake.";
        },
        addBrightline: () => {
          const s = get();
          const addedDocs = { ...s.addedDocs, "BL-SL1": true };
          commit({ addedDocs, done: { ...s.done, I1: true } }, "legal", "Added the Brightline side letter to Brightline's contract family", "Side letter, clause 1", [
            () => { const f = blFees(addedDocs); return { id: "n-I1", to: "finance", from: "Legal", text: `Brightline's retainer is ${inr(f.during)} a month for Oct to Dec, not ${inr(f.before)}. Check its invoices.` }; }], "I");
          return "Done. Brightline's fee in force has changed.";
        },
        rejectBrightline: (reason) => {
          const s = get();
          commit({ rejectedDocs: { ...s.rejectedDocs, "BL-SL1": reason }, done: { ...s.done, I1: true } }, "legal", `Said the Brightline side letter is not a valid contract: ${reason}`, "Side letter", [], "I");
          return "Done. Your reason is recorded.";
        },
        addZenith: () => {
          const s = get();
          commit({ addedDocs: { ...s.addedDocs, "ZE-Q": true }, done: { ...s.done, I2: true } }, "legal", "Added the Zenith Events signed quote as Zenith's contract", "Signed quote, clause 1", [
            () => ({ id: "n-I2", to: "procurement", from: "Legal", text: "a Zenith Events quote was signed outside Procurement. It is now Zenith's contract in Docket." })], "I");
          return "Done. Procurement has been told.";
        },
        addRenegotiation: () => { commit(markDone("D"), "legal", "Added PrimeFacility to the renegotiation list for March 2027", "Clause 8.2", [], "D"); return "Done. It is on the renegotiation list."; },
        sendToIntake: () => {
          commit(markDone("E"), "finance", "Sent the Northstar Advisory invoice to Procurement as a new contract request", "Supplier checks", [
            () => ({ id: "n-E", to: "procurement", from: "Finance", text: "a new contract request for Northstar Advisory LLP is waiting in intake." })], "E");
          return "Done. Procurement has been told.";
        },
        reset: () => { set({ ...initial, signedIn: true }); useToast.getState().hide(); },
      };
    },
    { name: "docket-v1" }
  )
);

// December can be shown by anyone, so the event is logged under whoever is viewing.
function s_role(get: () => Snapshot): Role { return get().role; }
