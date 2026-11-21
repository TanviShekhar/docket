// Contracts page data: where documents were found, ready questions, supplier list. Numbers come from engine.ts.
import { DEMO_TODAY, DOCS, FILE_VERSIONS, INVOICES, SUPPLIERS, TERMS, TRACKER_FILE } from "./data";
import { checkInvoice, daysBetween, inr, pickOperative, renewalDates, resolveTerm, withFiled } from "./engine";
import { CD_SEATS } from "./data";
import { dmy } from "./copy";
import { checkStateOf } from "./ledger";
import { allCards } from "./todo";
import type { Snapshot } from "./store";

export type Tag = "email" | "word" | "drive" | "excel" | "esign" | "scanned" | "outside";
export const TAGS: { tag: Tag; label: string }[] = [
  { tag: "email", label: "Email attachments" }, { tag: "word", label: "Word files" }, { tag: "drive", label: "Shared drives" },
  { tag: "excel", label: "Excel tracker" }, { tag: "esign", label: "E-signature records" }, { tag: "scanned", label: "Scanned paper" },
  { tag: "outside", label: "Found outside Docket" },
];
const SOURCE_NAME: Record<Tag, string> = { email: "inboxes", word: "Word files", drive: "shared drives", excel: "the Excel tracker", esign: "the e-signature platform", scanned: "scanned paper", outside: "connected inboxes and folders" };
export const sourceName = (t: Tag) => SOURCE_NAME[t];

export interface Row { id: string; title: string; sup: string; type: string; source: string; tags: Tag[]; status: string; draft?: boolean }

const tagsFromSource = (src: string): Tag[] => {
  const t: Tag[] = [];
  if (/Email attachment|email/i.test(src)) t.push("email");
  if (/\(Word\)|\.docx/i.test(src)) t.push("word");
  if (/Shared drive|shared drive/.test(src)) t.push("drive");
  if (/E-signature envelope/.test(src)) t.push("esign");
  if (/Scanned paper/.test(src)) t.push("scanned");
  return t;
};

export function rows(s: Snapshot): Row[] {
  const op = pickOperative().operative;
  const out: Row[] = DOCS.map((d) => {
    const tags = tagsFromSource(d.source);
    if (d.id === "TB-MSA" && op?.eSign && !tags.includes("esign")) tags.push("esign"); // MSA_signed.pdf has e-signature record ES-48803
    if (d.filed === false) tags.push("outside"); // found by scanning, whether or not Legal has added it since
    const added = !!s.addedDocs[d.id];
    const status = d.exec === "unsigned" ? "Does not count: not signed by both parties"
      : d.filed === false ? (s.rejectedDocs[d.id] ? "Not a valid contract" : added ? "Added to the contract family" : "Found outside Docket, not added yet") : "Signed and filed";
    return { id: d.id, title: d.title, sup: d.sup, type: d.type, source: d.source, tags, status };
  });
  FILE_VERSIONS.filter((f) => f !== op).forEach((f) => {
    out.push({ id: f.name, title: f.name, sup: "TB", type: "MSA draft", source: f.where, draft: true,
      tags: ["word", ...(/Email attachment/.test(f.where) ? ["email" as Tag] : []), ...(/Shared drive/.test(f.where) ? ["drive" as Tag] : [])],
      status: s.done.F ? "Not current" : "Draft, not signed" });
  });
  out.push({ id: "tracker", title: "Supplier_contracts_tracker.xlsx", sup: "", type: "Excel tracker", source: TRACKER_FILE, tags: ["excel"], status: "A copy kept by Procurement" });
  return out;
}

export const tagCounts = (r: Row[]) => TAGS.map((t) => ({ ...t, n: r.filter((x) => x.tags.includes(t.tag)).length }));
export const supName = (id: string) => SUPPLIERS.find((x) => x.id === id)?.short ?? "";

// Brightline fee in force, with and without the side letter (shadow contract type 2).
export function blFees(added: Record<string, boolean>) {
  const fee = (date: string, docs = withFiled(added)) => resolveTerm("BL", "fee", null, date, undefined, docs).winner!.t.value as number;
  const withLetter = withFiled({ "BL-SL1": true });
  return { before: fee("2026-11-15", withFiled({})), during: fee("2026-11-15"), withLetter: fee("2026-11-15", withLetter), january: fee("2027-01-15"), gap: fee("2026-11-15", withFiled({})) - fee("2026-11-15", withLetter) };
}

// ---------- The four ready questions (answers are computed, never typed) ----------
export interface Answer { text: string; link?: string }
export interface Question { id: string; title: string; answers: Answer[]; empty: string }

export function questions(s: Snapshot): Question[] {
  const state = (id: string) => s.termState[id] ?? TERMS.find((t) => t.id === id)!.state;
  const d = renewalDates(CD_SEATS.renewal, CD_SEATS.noticeDays);
  const q1: Answer[] = [];
  const days = daysBetween(DEMO_TODAY, d.notice);
  if (days >= 0 && days <= 90) q1.push({ text: `CloudDesk: notice must be received by ${dmy(d.notice)} (${days} days from today). Subscription Agreement, clause 9.1.`, link: "/item/B1" });

  const q2: Answer[] = TERMS.filter((t) => t.key === "cap" && typeof t.value === "number" && (t.value as number) <= 5 && state(t.id) === "verified")
    .map((t) => ({ text: `${supName(t.sup)}: ${t.value}% cap. ${DOCS.find((x) => x.id === t.doc)!.title}, clause ${t.ref}.`, link: t.sup === "CD" ? "/item/B1" : undefined }));

  const q3: Answer[] = [];
  const tb = checkInvoice(INVOICES[0], checkStateOf(s));
  if (!s.done.A9) {
    const open = tb.lines.filter((l) => ["over", "blocked", "confirm-map", "review"].includes(l.status));
    q3.push({ text: `${INVOICES[0].id} (TalentBridge): ${open.length} lines need attention, ${inr(open.reduce((a, l) => a + Math.max(0, l.diff ?? 0), 0))} possible difference.`, link: "/item/A2" });
  }
  if (!s.done.E) q3.push({ text: `${INVOICES[1].id} (Northstar Advisory LLP): no matching contract, ${inr(checkInvoice(INVOICES[1]).totals.sub)}.`, link: "/item/E" });

  const q4: Answer[] = TERMS.filter((t) => ["Amendment", "Side letter"].includes(DOCS.find((x) => x.id === t.doc)!.type) && state(t.id) !== "verified" && !(t.doc === "BL-SL1" && s.rejectedDocs["BL-SL1"]))
    .map((t) => {
      const doc = DOCS.find((x) => x.id === t.doc)!;
      return { text: `${supName(t.sup)}: ${doc.title}, clause ${t.ref}.${doc.exec === "unsigned" ? " Unsigned, so it does not count." : ""}`, link: t.doc === "TB-AMD2" ? "/item/A1" : t.doc === "BL-SL1" ? "/item/I1" : undefined };
    });

  return [
    { id: "q1", title: "Which renewals have a notice deadline in the next 90 days?", answers: q1, empty: "None." },
    { id: "q2", title: "Which suppliers have a checked price cap of 5% or less?", answers: q2, empty: "None checked yet." },
    { id: "q3", title: "Which invoices have open differences?", answers: q3, empty: "None." },
    { id: "q4", title: "Which changes to contracts have not been checked yet?", answers: q4, empty: "None." },
  ];
}

// Open to-do items by supplier, for the supplier list.
export function openItems(s: Snapshot, supId: string) {
  const map: Record<string, string> = { A: "TB", F: "TB", B: "CD", C: "SH", D: "PF", I1: "BL", I2: "ZE" };
  return allCards(s).filter((c) => (map[c.id] ?? map[c.caseId]) === supId).length;
}
