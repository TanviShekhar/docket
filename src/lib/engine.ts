// Docket engine. Deterministic rules only: AI never does this arithmetic.
// Every function is pure and covered by engine.test.ts.
import { DOCS, TERMS, TIMESHEETS, PAID_INVOICE_NUMBERS, SUPPLIERS, FILE_VERSIONS, TRACKER, SPEND_2026, CD_SEATS, type Doc, type Term, type Invoice, type InvoiceLine, type TrustState, type FileVersion, type Spend } from "./data";

export const D = (s: string) => new Date(s + "T00:00:00");
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const subWorkdays = (d: Date, n: number) => { let x = new Date(d); while (n > 0) { x = addDays(x, -1); const w = x.getDay(); if (w !== 0 && w !== 6) n--; } return x; };
export const daysBetween = (a: string, b: string) => Math.round((D(b).getTime() - D(a).getTime()) / 86400000);
const month = (s: string) => s.slice(0, 7);
const covers = (termScope: string, scope: string | null) => termScope === "All SOWs" || termScope === "All" || termScope === scope;

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const lakh = (n: number) => "₹" + (n / 100000).toFixed(2) + " L";
export const nice = (s: string) => D(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// ---------- Precedence rules ----------
// Rule 1 signed only. Rule 2 scope must match. Rule 3 effective on or before the service date.
// Rule 4 latest effective date wins. Rule 5 same date, different value = conflict (goes to Legal).
export interface Candidate { t: Term; doc: Doc; reason: string | null }
export function resolveTerm(sup: string, key: string, scope: string | null, date: string, terms: Term[] = TERMS, docs: Doc[] = DOCS) {
  const cands: Candidate[] = terms.filter((t) => t.sup === sup && t.key === key).map((t) => {
    const doc = docs.find((d) => d.id === t.doc)!;
    let reason: string | null = null;
    if (doc.filed === false) reason = "Found outside Docket and not added yet (Legal must add it)";
    else if (doc.exec !== "signed") reason = "Not signed by both parties, so it does not count (rule 1)";
    else if (!covers(t.scope, scope)) reason = `Applies to ${t.scope} only (rule 2)`;
    else if (t.from > date) reason = `Starts ${nice(t.from)}, after this date (rule 3)`;
    else if (t.to && t.to < date) reason = `Ended ${nice(t.to)} (temporary term)`;
    return { t, doc, reason };
  });
  const live = cands.filter((c) => !c.reason).sort((a, b) => (a.t.from < b.t.from ? 1 : -1));
  if (!live.length) return { winner: null as Candidate | null, cands, conflict: false };
  const top = live[0];
  const conflict = live.some((c) => c !== top && c.t.from === top.t.from && c.t.value !== top.t.value);
  live.slice(1).forEach((c) => { c.reason = c.reason || `Replaced by ${top.doc.title} from ${nice(top.t.from)} (rule 4)`; });
  return { winner: top, cands, conflict };
}

// ---------- Invoice check ----------
export type LineStatus = "match" | "over" | "under" | "blocked" | "confirm-map" | "review" | "nocontract";
export interface LineResult { l: InvoiceLine; amount: number; status: LineStatus; reason: string; role?: string; exp?: number; diff?: number; win?: Candidate | null; cands?: Candidate[]; qty?: { approved?: number; ok: boolean } }
export interface CheckState { termState?: Record<string, TrustState>; mapConfirmed?: Record<string, string | false>; expenseApproved?: Record<string, boolean> }

export function withState(st: CheckState): Term[] {
  return TERMS.map((t) => (st.termState && st.termState[t.id] ? { ...t, state: st.termState[t.id] } : t));
}

export function checkInvoice(inv: Invoice, st: CheckState = {}) {
  const terms = withState(st);
  const header: { ok: boolean; label: string; note: string }[] = [];
  if (!inv.sup) {
    header.push({ ok: false, label: "Contract", note: `No matching contract found for ${inv.entity}. This is not treated as unauthorised spend until someone checks.` });
    const lines: LineResult[] = inv.lines.map((l) => ({ l, amount: l.qty * l.rate, status: "nocontract", reason: "No matching contract found" }));
    return { header, lines, totals: totals(inv, lines), nocontract: true };
  }
  const sup = SUPPLIERS.find((s) => s.id === inv.sup)!;
  const sows = DOCS.filter((d) => d.sup === inv.sup && d.type === "SOW");
  header.push({ ok: !PAID_INVOICE_NUMBERS.includes(inv.id), label: "Not a duplicate", note: "Invoice number not seen before" });
  header.push({ ok: inv.entity === sup.name, label: "Right company", note: `${inv.entity} is the company that signed the contract` });
  header.push({ ok: inv.pos.every((p) => sows.some((s) => s.po === p)), label: "Purchase orders", note: `${inv.pos.join(", ")} match SOW-1 and SOW-2` });
  header.push({ ok: inv.currency === "INR" && inv.taxBasis === "exclusive", label: "Currency and tax", note: "INR, rates exclude GST (MSA clause 2.1)" });

  const lines: LineResult[] = inv.lines.map((l) => {
    const amount = l.qty * l.rate;
    if (l.kind === "expense") {
      const ok = !!st.expenseApproved?.[l.id];
      const r = resolveTerm(inv.sup!, "expenses", l.sow, l.from, terms);
      return { l, amount, status: ok ? "match" : "review", reason: ok ? "Prior approval attached by Finance" : "MSA clause 6.4 needs written approval before the expense. None found.", win: r.winner };
    }
    let role = l.role || (terms.some((t) => t.sup === inv.sup && t.key === "rate:" + l.desc) ? l.desc : undefined);
    let pendingMap = false;
    if (!role && l.suggest) {
      const m = st.mapConfirmed?.[l.id];
      if (m === false) return { l, amount, status: "review", reason: "Finance said this is not a Senior Developer. Ask the supplier which rate card role applies." };
      role = l.suggest.role; pendingMap = !m;
    }
    if (!role) return { l, amount, status: "review", reason: "This role is not on the rate card." };
    const r = resolveTerm(inv.sup!, "rate:" + role, l.sow, l.from, terms);
    if (!r.winner) return { l, amount, status: "review", reason: "No rate applies to this role and date." };
    const exp = r.winner.t.value as number;
    const diff = (l.rate - exp) * l.qty;
    const approved = TIMESHEETS[`${l.sow}|${role}|${month(l.from)}`];
    const billed = inv.lines.filter((x) => x.kind === "labour" && x.sow === l.sow && month(x.from) === month(l.from) && (x.role || x.suggest?.role || x.desc) === role).reduce((a, x) => a + x.qty, 0);
    const qty = { approved, ok: approved !== undefined && billed <= approved };
    let status: LineStatus = diff > 0 ? "over" : diff < 0 ? "under" : "match";
    let reason = diff === 0 ? "Billed at the rate in force" : diff > 0 ? "Billed above the rate in force" : "Billed below the rate in force";
    if (diff !== 0 && r.winner.t.state !== "verified") { status = "blocked"; reason = "The rate in force has not been checked by Legal yet, so this cannot be disputed."; }
    if (pendingMap) { status = "confirm-map"; reason = `Docket thinks this is a ${role} (${Math.round(l.suggest!.conf * 100)}% sure). Finance must confirm.`; }
    return { l, amount, role, exp, diff, status, reason, win: r.winner, cands: r.cands, qty };
  });
  return { header, lines, totals: totals(inv, lines) };
}

function totals(inv: Invoice, lines: LineResult[]) {
  const sub = inv.lines.reduce((a, l) => a + l.qty * l.rate, 0);
  const disputable = lines.filter((x) => x.status === "over").reduce((a, x) => a + (x.diff || 0), 0);
  const potential = lines.filter((x) => x.status === "blocked" || x.status === "confirm-map").reduce((a, x) => a + Math.max(0, x.diff || 0), 0);
  return { sub, gst: Math.round(sub * inv.gst), total: Math.round(sub * (1 + inv.gst)), disputable, disputableGst: Math.round(disputable * inv.gst), potential, potentialGst: Math.round(potential * inv.gst) };
}

// ---------- Renewal ----------
// Notice must be RECEIVED noticeDays before the term ends. Internal deadline leaves working days for review and dispatch.
export const LEAD = [
  { step: "Courier transit and proof of delivery", days: 3 },
  { step: "Legal check of the notice", days: 2 },
  { step: "Procurement review", days: 2 },
  { step: "Buffer", days: 1 },
];
export function renewalDates(renewal: string, noticeDays: number) {
  const notice = addDays(D(renewal), -noticeDays);
  const lead = LEAD.reduce((a, x) => a + x.days, 0);
  return { renewal, notice: iso(notice), internal: iso(subWorkdays(notice, lead)), lead };
}
export function renewalMoney(c: { contracted: number; price: number; quoteUplift: number }, seats: number, capPct: number) {
  const current = c.contracted * c.price;
  const asQuote = Math.round(current * (1 + c.quoteUplift / 100));
  const atCap = Math.round(current * (1 + capPct / 100));
  const atSeats = Math.round(seats * c.price * (1 + capPct / 100));
  return { current, asQuote, atCap, atSeats, capSaving: asQuote - atCap, seatSaving: atCap - atSeats, vsQuote: asQuote - atSeats, vsBudget: current - atSeats };
}
// (active + seasonal + service) x 1.1 buffer, rounded up to the next 10-seat increment
export const suggestedSeats = (c: { active90: number; seasonal: number; service: number }) => Math.ceil(((c.active90 + c.seasonal + c.service) * 1.1) / 10) * 10;

// ---------- Service credit (SwiftHaul clauses 7.1 to 7.4) ----------
export function slaCalc(s: { total: number; onTime: number; customerCaused: number; fmClaimed: number; fee: number }, fmAccepted: boolean) {
  const eligible = s.total - s.customerCaused - (fmAccepted ? s.fmClaimed : 0);
  const perf = (s.onTime / eligible) * 100;
  const shortfall = 95 - perf;
  const points = Math.max(0, Math.floor(shortfall));
  const pct = Math.min(points * 2, 10);
  return { eligible, perf, shortfall, points, pct, credit: Math.round((s.fee * pct) / 100), capped: points * 2 > 10, cap: Math.round(s.fee * 0.1) };
}
export const claimDeadline = (monthYYYYMM: string) => { const [y, m] = monthYYYYMM.split("-").map(Number); return iso(addDays(new Date(y, m, 0), 30)); };

// ---------- Legal priority (just-in-time verification) ----------
// Each factor scored 1 to 5, total 3 to 15.
export function priority(impactInr: number, daysToDeadline: number | null, conf: number, unclear: boolean) {
  const impact = impactInr >= 1000000 ? 5 : impactInr >= 200000 ? 4 : impactInr >= 50000 ? 3 : impactInr >= 10000 ? 2 : 1;
  const time = daysToDeadline == null ? 1 : daysToDeadline <= 7 ? 5 : daysToDeadline <= 14 ? 4 : daysToDeadline <= 30 ? 3 : daysToDeadline <= 90 ? 2 : 1;
  const unc = unclear ? 5 : conf < 0.85 ? 4 : conf < 0.92 ? 3 : conf < 0.97 ? 2 : 1;
  return { impact, time, unc, total: impact + time + unc };
}

// ---------- Rule-based clause parser (NOT AI) ----------
export function ruleParse(text: string) {
  const out: { type: string; value: string; quote: string }[] = [];
  const push = (type: string, re: string) => { const r = new RegExp(re, "gi"); let m: RegExpExecArray | null; while ((m = r.exec(text)) && out.length < 40) out.push({ type, value: m[0].trim(), quote: sentenceAt(text, m.index) }); };
  push("Money", "(?:INR|Rs\\.?|₹|USD|\\$|EUR|€)\\s?[\\d,]+(?:\\.\\d+)?(?:\\s?(?:lakh|crore|million))?");
  push("Percentage", "\\d+(?:\\.\\d+)?\\s?(?:%|percent)");
  push("Notice or term", "\\(?\\d+\\)?\\s?(?:\\(\\w+\\)\\s?)?(?:calendar |business |working )?(?:days?|months?)");
  push("Date", "\\b(?:\\d{1,2}(?:st|nd|rd|th)?\\s(?:January|February|March|April|May|June|July|August|September|October|November|December),?\\s\\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s\\d{1,2},?\\s\\d{4}|\\d{4}-\\d{2}-\\d{2})");
  const ar = text.search(/renew(s|al)? automatically|auto-?renew|automatically renew/i);
  if (ar >= 0) out.push({ type: "Auto-renewal", value: "Auto-renewal wording found", quote: sentenceAt(text, ar) });
  return out;
}
function sentenceAt(text: string, i: number) {
  let s = i, e = i;
  while (s > 0 && !/[.;\n]/.test(text[s - 1])) s--;
  while (e < text.length && !/[.;\n]/.test(text[e])) e++;
  return text.slice(s, Math.min(e + 1, text.length)).trim().slice(0, 260);
}
// Evidence check: does the quote appear in the source? Proves the quote exists, not that its meaning was read correctly.
export function grounded(text: string, quote: string) {
  const n = (x: string) => String(x || "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
  return !!quote && n(text).includes(n(quote));
}
// Duplicate check: same normalised text = same document
export const sameDoc = (a: string, b: string) => a.replace(/\s+/g, " ").trim().toLowerCase() === b.replace(/\s+/g, " ").trim().toLowerCase();

// Docs with Legal's "add to family" decisions applied (shadow contracts become filed)
export const withFiled = (added: Record<string, boolean>, docs: Doc[] = DOCS) => docs.map((d) => (d.filed === false && added[d.id] ? { ...d, filed: true } : d));

// ---------- Version chaos ----------
// The version that counts: signed by both parties AND has a completed e-signature record. Drafts are listed with their differences.
export function pickOperative(files: FileVersion[] = FILE_VERSIONS) {
  const signed = files.filter((f) => f.signedBoth && f.eSign);
  if (signed.length !== 1) return { operative: null as FileVersion | null, others: files, needsLegal: true, diffs: [] as { name: string; note: string }[] };
  const op = signed[0];
  const others = files.filter((f) => f !== op);
  const diffs = others.filter((f) => f.seniorDevRate !== op.seniorDevRate).map((f) => ({ name: f.name, note: `Senior Developer ${inr(f.seniorDevRate)}/hr here, ${inr(op.seniorDevRate)}/hr in the signed copy` }));
  return { operative: op, others, needsLegal: false, diffs };
}

// ---------- Excel tracker vs contract ----------
export function trackerCheck(st: CheckState = {}, today: string) {
  const terms = withState(st);
  return TRACKER.map((row) => {
    let contract: number | null = null, source = "", consequence = "";
    if (row.field === "notice") {
      const t = terms.find((x) => x.sup === row.sup && x.key === "notice")!;
      contract = t.value as number; source = `${t.doc} clause ${t.ref}`;
      if (row.value !== contract) {
        const trackerDeadline = iso(addDays(D(CD_SEATS.renewal), -row.value));
        const real = renewalDates(CD_SEATS.renewal, contract).notice;
        consequence = `Following the tracker, notice would go by ${nice(trackerDeadline)}. The real deadline is ${nice(real)}, so you would miss it by ${daysBetween(real, trackerDeadline)} days.`;
      }
    } else if (row.field === "rate:Senior Developer") {
      const r = resolveTerm(row.sup, row.field, row.scope || null, today, terms);
      contract = r.winner ? (r.winner.t.value as number) : null; source = r.winner ? `${r.winner.doc.title}` : "";
      if (contract !== null && row.value !== contract) consequence = `The tracker still shows the old rate. Anyone using it would approve ${inr(row.value)}/hr invoices.`;
    } else {
      const key = row.field === "sla" ? "sla" : row.field;
      const t = terms.find((x) => x.sup === row.sup && x.key === key)!;
      contract = row.field === "sla" ? 95 : (t.value as number); source = `${t.doc} clause ${t.ref}`;
    }
    return { row, contract, source, match: row.value === contract, consequence };
  });
}

// ---------- Coverage (shadow contracts type 1: paid but no contract) ----------
export function coverage(addedDocs: Record<string, boolean> = {}, spend: Spend[] = SPEND_2026) {
  const docs = withFiled(addedDocs);
  const has = (s: Spend) => !!s.sup && docs.some((d) => d.sup === s.sup && d.exec === "signed" && d.filed !== false);
  const covered = spend.filter(has), shadow = spend.filter((s) => !has(s));
  const total = spend.reduce((a, s) => a + s.amount, 0), cov = covered.reduce((a, s) => a + s.amount, 0);
  return { paid: spend.length, covered: covered.length, shadow, bySupplierPct: Math.round((covered.length / spend.length) * 100), bySpendPct: Math.round((cov / total) * 1000) / 10 };
}

// ---------- Keyword search across every clause ----------
export function searchClauses(q: string, f: { sup?: string; type?: string; signedOnly?: boolean } = {}, docs: Doc[] = DOCS) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits: { doc: Doc; ref: string; page: number; text: string }[] = [];
  for (const d of docs) {
    if (f.sup && d.sup !== f.sup) continue;
    if (f.type && d.type !== f.type) continue;
    if (f.signedOnly && (d.exec !== "signed" || d.filed === false)) continue;
    for (const c of d.clauses) { const t = (d.title + " " + c.text).toLowerCase(); if (words.every((w) => t.includes(w))) hits.push({ doc: d, ref: c.ref, page: c.page, text: c.text }); }
  }
  return hits;
}

// ---------- Reminders and escalation ----------
// Reminder 2 working days before the step is due; escalation to the delegate on the due date if still open.
export function escalation(due: string, today: string, done: boolean) {
  const remindOn = iso(subWorkdays(D(due), 2));
  const status = done ? "done" : today > due ? "overdue" : today >= remindOn ? "reminded" : "on track";
  return { remindOn, escalateOn: due, status };
}
