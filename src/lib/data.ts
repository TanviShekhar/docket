// Docket demo data. Every company, person, document and number is fictional and illustrative.
// Document types are modelled on Law Insider contract categories (Service Agreement, Statement of Work,
// Subscription Agreement, Services Agreement, Consulting Agreement). No real company appears here.
// DO NOT change numbers without updating engine.test.ts. The tests lock the story.

export const DEMO_TODAY = "2026-11-23"; // Monday. Every deadline is computed from this date.
export const BUYER = "Larkspur Technologies Pvt Ltd"; // the fictional company using Docket (3,000 employees)

export type Role = "finance" | "legal" | "procurement" | "owner" | "supplier";
export const PEOPLE: Record<Role, { name: string; title: string }> = {
  finance: { name: "Ritika Deshmukh", title: "Accounts Payable, Finance" },
  legal: { name: "Rushikesh Kulkarni", title: "Commercial Legal" },
  procurement: { name: "Yash Patil", title: "Procurement" },
  owner: { name: "Anuj Shinde", title: "Head of Customer Support (owns CloudDesk)" },
  supplier: { name: "Udit Pawar", title: "Billing, TalentBridge Staffing" },
};

export interface Supplier { id: string; name: string; short: string; category: string; owner: string; lawInsiderType: string }
export const SUPPLIERS: Supplier[] = [
  { id: "TB", name: "TalentBridge Staffing Pvt Ltd", short: "TalentBridge", category: "Staffing", owner: "Tejas Wagh (Engineering)", lawInsiderType: "Service Agreement + Statement of Work" },
  { id: "CD", name: "CloudDesk Software Pvt Ltd", short: "CloudDesk", category: "Software subscription", owner: "Anuj Shinde (Customer Support)", lawInsiderType: "Subscription Agreement" },
  { id: "SH", name: "SwiftHaul Logistics Ltd", short: "SwiftHaul", category: "Logistics", owner: "Mansi Rane (Supply Chain)", lawInsiderType: "Services Agreement" },
  { id: "PF", name: "PrimeFacility Services LLP", short: "PrimeFacility", category: "Facilities", owner: "Omkar Salvi (Admin)", lawInsiderType: "Services Agreement" },
  { id: "BL", name: "Brightline Marketing Pvt Ltd", short: "Brightline", category: "Marketing agency", owner: "Amruta Sawant (Marketing)", lawInsiderType: "Service Agreement" },
  { id: "MR", name: "Meridian IT Consulting Pvt Ltd", short: "Meridian", category: "IT consulting", owner: "Siddharth Naik (IT)", lawInsiderType: "Consulting Agreement" },
  { id: "ZE", name: "Zenith Events Pvt Ltd", short: "Zenith Events", category: "Events", owner: "Kunal Chavan (HR)", lawInsiderType: "Services Agreement" },
];

export type Exec = "signed" | "unsigned";
export interface Clause { ref: string; page: number; text: string }
export interface Doc {
  id: string; sup: string; type: "MSA" | "SOW" | "Amendment" | "Subscription" | "Agreement" | "Retainer" | "Side letter" | "Signed quote";
  title: string; signed: string | null; effective: string; expiry: string | null; exec: Exec;
  parent: string | null; scope: string; po?: string; signedBy: string; source: string; clauses: Clause[];
  filed?: boolean; // false = found outside Docket, not added yet (shadow contract)
}

export const DOCS: Doc[] = [
  { id: "TB-MSA", sup: "TB", type: "MSA", title: "Master Services Agreement", signed: "2026-01-01", effective: "2026-01-01", expiry: "2028-12-31", exec: "signed", parent: null, scope: "All SOWs", signedBy: "Both parties", source: "Shared drive: /Legal/Suppliers/TalentBridge/MSA_signed.pdf (operative version, see FILE_VERSIONS)",
    clauses: [
      { ref: "2.1", page: 2, text: "The Customer shall pay the Supplier the hourly rates set out in Schedule 2 (Rate Card) for each Role, exclusive of GST." },
      { ref: "Sch 2", page: 11, text: "Schedule 2 Rate Card: Senior Developer INR 2,400 per hour; Business Analyst INR 1,800 per hour; Project Manager INR 2,900 per hour." },
      { ref: "6.4", page: 5, text: "Travel and out-of-pocket expenses are reimbursable at cost only where approved in writing by the Customer before they are incurred." },
      { ref: "14.2", page: 9, text: "In the event of conflict, a Statement of Work prevails over this Agreement for its own scope, and an Amendment prevails only over the provisions it expressly amends." },
    ] },
  { id: "TB-SOW1", sup: "TB", type: "SOW", title: "SOW-1: Customer platform rebuild", signed: "2026-02-15", effective: "2026-02-15", expiry: "2027-02-14", exec: "signed", parent: "TB-MSA", scope: "SOW-1", po: "4500012345", signedBy: "Both parties", source: "Email attachment from Tejas Wagh, 16 Feb 2026",
    clauses: [ { ref: "3", page: 2, text: "Resources: six (6) Senior Developers and two (2) Business Analysts, billed monthly in arrears against approved timesheets under PO 4500012345." } ] },
  { id: "TB-SOW2", sup: "TB", type: "SOW", title: "SOW-2: Data platform migration", signed: "2026-09-01", effective: "2026-09-01", expiry: "2026-12-31", exec: "signed", parent: "TB-MSA", scope: "SOW-2", po: "4500013310", signedBy: "Both parties", source: "E-signature envelope ES-55120",
    clauses: [ { ref: "3", page: 2, text: "Resources: one (1) Senior Developer at the Schedule 2 rate, billed monthly in arrears under PO 4500013310." } ] },
  { id: "TB-AMD1", sup: "TB", type: "Amendment", title: "Amendment 1 (draft): rate revision", signed: null, effective: "2026-09-01", expiry: null, exec: "unsigned", parent: "TB-MSA", scope: "SOW-1", signedBy: "Customer only", source: "Email attachment (Word): Amendment1_draft_v3.docx from TalentBridge, 12 Sep 2026",
    clauses: [ { ref: "1", page: 1, text: "The Senior Developer rate in Schedule 2 is revised to INR 2,000 per hour. [Signed by Customer only. Not countersigned by Supplier.]" } ] },
  { id: "TB-AMD2", sup: "TB", type: "Amendment", title: "Amendment 2: Senior Developer rate, SOW-1", signed: "2026-09-22", effective: "2026-10-01", expiry: null, exec: "signed", parent: "TB-MSA", scope: "SOW-1", signedBy: "Both parties", source: "E-signature envelope ES-56871",
    clauses: [ { ref: "1", page: 1, text: "With effect from 1 October 2026, the Senior Developer rate in Schedule 2 is revised to INR 2,200 per hour for Services under SOW-1 only. All other terms remain unchanged." } ] },
  { id: "CD-SUB", sup: "CD", type: "Subscription", title: "Subscription Agreement: CloudDesk Helpdesk", signed: "2025-01-20", effective: "2025-02-06", expiry: "2027-02-05", exec: "signed", parent: null, scope: "All", signedBy: "Both parties", source: "Shared drive: /IT/Licences/CloudDesk_Subscription.pdf",
    clauses: [
      { ref: "4.1", page: 2, text: "Subscription: 500 named-user seats at INR 7,600 per seat per year." },
      { ref: "9.1", page: 6, text: "This Agreement renews automatically for successive twelve (12) month terms unless either party gives written notice of non-renewal that is received at least sixty (60) days before the end of the then-current term." },
      { ref: "9.2", page: 6, text: "Fees may increase on renewal by no more than five percent (5%), except where a change in applicable law or regulation materially increases the Supplier's cost of providing the Services, in which case the Supplier shall provide written evidence of that change." },
      { ref: "17.3", page: 12, text: "Notices must be sent by registered post or courier to the Supplier's registered office: CloudDesk Software Pvt Ltd, 4th Floor, Orbit Tower, Whitefield, Bengaluru 560066, Attn: Legal." },
    ] },
  { id: "SH-MSA", sup: "SH", type: "MSA", title: "Logistics Services Agreement", signed: "2025-09-01", effective: "2025-09-01", expiry: "2027-08-31", exec: "signed", parent: null, scope: "All", signedBy: "Both parties", source: "Shared drive: /Supply Chain/Contracts/SwiftHaul_LSA.pdf",
    clauses: [
      { ref: "5.1", page: 3, text: "Monthly Service Fee: INR 42,00,000, exclusive of GST." },
      { ref: "7.1", page: 4, text: "Supplier shall deliver at least 95% of Eligible Shipments within the agreed Delivery Window in each calendar month." },
      { ref: "7.3", page: 4, text: "Eligible Shipments exclude shipments delayed by the Customer or by a Force Majeure Event notified with supporting evidence within 5 days." },
      { ref: "7.4", page: 5, text: "Service Credit: 2% of the monthly Service Fee for each full percentage point below 95%, capped at 10% of the monthly Service Fee. Credits must be claimed in writing within 30 days of the month end and are applied as an offset against the next invoice." },
    ] },
  { id: "PF-AGR", sup: "PF", type: "Agreement", title: "Facilities Management Agreement", signed: "2025-04-01", effective: "2025-04-01", expiry: "2027-03-31", exec: "signed", parent: null, scope: "All", signedBy: "Both parties", source: "Scanned paper copy: /Admin/Contracts/PrimeFacility_scan.pdf",
    clauses: [ { ref: "8.2", page: 6, text: "The Supplier shall provide a prompt response to all maintenance requests raised by the Customer." } ] },
  { id: "BL-RET", sup: "BL", type: "Retainer", title: "Creative Retainer Agreement", signed: "2026-03-01", effective: "2026-03-01", expiry: "2027-02-28", exec: "signed", parent: null, scope: "All", signedBy: "Both parties", source: "E-signature envelope ES-50144",
    clauses: [ { ref: "3.1", page: 2, text: "Monthly retainer fee of INR 17,50,000, exclusive of GST, fixed for the initial term." } ] },
  { id: "MR-MSA", sup: "MR", type: "MSA", title: "IT Consulting Master Agreement", signed: "2025-11-10", effective: "2025-11-10", expiry: "2027-11-09", exec: "signed", parent: null, scope: "All", signedBy: "Both parties", source: "Shared drive: /IT/Contracts/Meridian_MSA.pdf",
    clauses: [
      { ref: "11.2", page: 8, text: "Supplier shall deliver a current SOC 2 Type II report to the Customer by 31 March each year." },
      { ref: "12.1", page: 9, text: "Fees may increase on each anniversary by no more than four percent (4%)." },
    ] },
  // Shadow contracts: found outside Docket, not filed until Legal adds them
  { id: "BL-SL1", sup: "BL", type: "Side letter", title: "Side letter: Q4 retainer discount", signed: "2026-09-30", effective: "2026-10-01", expiry: "2026-12-31", exec: "signed", parent: "BL-RET", scope: "All", signedBy: "Both parties", source: "Found in Amruta Sawant's email: Brightline_side_letter_signed.pdf, 30 Sep 2026", filed: false,
    clauses: [ { ref: "1", page: 1, text: "For October, November and December 2026, the monthly retainer fee is reduced by ten percent (10%) to INR 15,75,000, exclusive of GST." } ] },
  { id: "ZE-Q", sup: "ZE", type: "Signed quote", title: "Signed quote: 2026 offsites and events", signed: "2026-02-10", effective: "2026-02-10", expiry: "2026-12-31", exec: "signed", parent: null, scope: "All", signedBy: "Both parties", source: "Found in a personal folder: /Users/kchavan/Events/Zenith_quote_signed.pdf", filed: false,
    clauses: [ { ref: "1", page: 1, text: "Zenith Events will manage three company offsites in 2026 at INR 2,80,000 per event, exclusive of GST, payable within 30 days of each event." } ] },
];

// Terms extracted from the documents. conf = model-reported confidence. state = trust state.
export type TrustState = "unverified" | "verified" | "ambiguous" | "not-measurable" | "rejected";
export interface Term {
  id: string; sup: string; key: string; label: string; value: number | string; unit: string;
  doc: string; ref: string; scope: string; from: string; conf: number; state: TrustState;
  by?: string; at?: string; why?: string; to?: string; // to = last date the term applies
}
export const TERMS: Term[] = [
  { id: "t1", sup: "TB", key: "rate:Senior Developer", label: "Senior Developer rate", value: 2400, unit: "INR/hr", doc: "TB-MSA", ref: "Sch 2", scope: "All SOWs", from: "2026-01-01", conf: 0.97, state: "verified", by: "Rushikesh Kulkarni", at: "2026-01-05" },
  { id: "t2", sup: "TB", key: "rate:Business Analyst", label: "Business Analyst rate", value: 1800, unit: "INR/hr", doc: "TB-MSA", ref: "Sch 2", scope: "All SOWs", from: "2026-01-01", conf: 0.97, state: "verified", by: "Rushikesh Kulkarni", at: "2026-01-05" },
  { id: "t3", sup: "TB", key: "rate:Senior Developer", label: "Senior Developer rate", value: 2000, unit: "INR/hr", doc: "TB-AMD1", ref: "1", scope: "SOW-1", from: "2026-09-01", conf: 0.91, state: "unverified" },
  { id: "t4", sup: "TB", key: "rate:Senior Developer", label: "Senior Developer rate", value: 2200, unit: "INR/hr", doc: "TB-AMD2", ref: "1", scope: "SOW-1", from: "2026-10-01", conf: 0.94, state: "unverified" },
  { id: "t5", sup: "TB", key: "expenses", label: "Expenses rule", value: "Prior written approval", unit: "", doc: "TB-MSA", ref: "6.4", scope: "All SOWs", from: "2026-01-01", conf: 0.95, state: "verified", by: "Rushikesh Kulkarni", at: "2026-01-05" },
  { id: "t6", sup: "CD", key: "cap", label: "Renewal price cap", value: 5, unit: "%", doc: "CD-SUB", ref: "9.2", scope: "All", from: "2025-02-06", conf: 0.88, state: "ambiguous", why: "The cap has an exception for changes in law or regulation. Legal must decide whether it applies." },
  { id: "t7", sup: "CD", key: "notice", label: "Non-renewal notice", value: 60, unit: "days before term end, received", doc: "CD-SUB", ref: "9.1", scope: "All", from: "2025-02-06", conf: 0.96, state: "verified", by: "Rushikesh Kulkarni", at: "2025-02-02" },
  { id: "t8", sup: "SH", key: "sla", label: "On-time delivery SLA and credit", value: "95% target, 2% per full point, cap 10%", unit: "", doc: "SH-MSA", ref: "7.1 to 7.4", scope: "All", from: "2025-09-01", conf: 0.9, state: "unverified" },
  { id: "t9", sup: "PF", key: "sla", label: "Maintenance response SLA", value: "\"prompt response\"", unit: "", doc: "PF-AGR", ref: "8.2", scope: "All", from: "2025-04-01", conf: 0.93, state: "not-measurable", why: "The clause gives no time limit or way to measure it, so no credit can be calculated. Legal should review." },
  { id: "t10", sup: "BL", key: "fee", label: "Monthly retainer", value: 1750000, unit: "INR/month", doc: "BL-RET", ref: "3.1", scope: "All", from: "2026-03-01", conf: 0.98, state: "verified", by: "Rushikesh Kulkarni", at: "2026-03-04" },
  { id: "t11", sup: "MR", key: "cap", label: "Anniversary price cap", value: 4, unit: "%", doc: "MR-MSA", ref: "12.1", scope: "All", from: "2025-11-10", conf: 0.95, state: "verified", by: "Rushikesh Kulkarni", at: "2025-11-20" },
  { id: "t12", sup: "MR", key: "obligation", label: "SOC 2 Type II report due", value: "31 March each year", unit: "", doc: "MR-MSA", ref: "11.2", scope: "All", from: "2025-11-10", conf: 0.92, state: "verified", by: "Rushikesh Kulkarni", at: "2025-11-20" },
  { id: "t13", sup: "BL", key: "fee", label: "Monthly retainer (Q4 discount)", value: 1575000, unit: "INR/month", doc: "BL-SL1", ref: "1", scope: "All", from: "2026-10-01", to: "2026-12-31", conf: 0.95, state: "unverified" },
  { id: "t14", sup: "ZE", key: "fee", label: "Fee per event", value: 280000, unit: "INR/event", doc: "ZE-Q", ref: "1", scope: "All", from: "2026-02-10", to: "2026-12-31", conf: 0.94, state: "unverified" },
];

export interface InvoiceLine { id: string; desc: string; sow: string | null; from: string; to: string; qty: number; rate: number; kind: "labour" | "expense" | "service"; role?: string; suggest?: { role: string; conf: number; why: string } }
export interface Invoice { id: string; sup: string | null; entity: string; date: string; due: string; currency: string; taxBasis: "exclusive" | "inclusive"; gst: number; pos: string[]; source: string; lines: InvoiceLine[] }

export const INVOICES: Invoice[] = [
  { id: "INV-TB-1103", sup: "TB", entity: "TalentBridge Staffing Pvt Ltd", date: "2026-11-03", due: "2026-12-03", currency: "INR", taxBasis: "exclusive", gst: 0.18, pos: ["4500012345", "4500013310"], source: "ERP invoice inbox (simulated)",
    lines: [
      { id: "L1", desc: "Senior Developer", sow: "SOW-1", from: "2026-10-01", to: "2026-10-31", qty: 800, rate: 2400, kind: "labour" },
      { id: "L2", desc: "Senior Developer (late-billed)", sow: "SOW-1", from: "2026-09-16", to: "2026-09-30", qty: 120, rate: 2400, kind: "labour", role: "Senior Developer" },
      { id: "L3", desc: "Business Analyst", sow: "SOW-1", from: "2026-10-01", to: "2026-10-31", qty: 320, rate: 1800, kind: "labour" },
      { id: "L4", desc: "Technical Consultant", sow: "SOW-1", from: "2026-10-01", to: "2026-10-31", qty: 160, rate: 2400, kind: "labour", suggest: { role: "Senior Developer", conf: 0.82, why: "\"Technical Consultant\" is not on the rate card. The approved timesheet lists this person (R. Jadhav) as Senior Developer, and SOW-1 has no Technical Consultant role." } },
      { id: "L5", desc: "Senior Developer", sow: "SOW-2", from: "2026-10-01", to: "2026-10-31", qty: 160, rate: 2400, kind: "labour" },
      { id: "L6", desc: "Travel: client site visit, Pune", sow: "SOW-1", from: "2026-10-14", to: "2026-10-15", qty: 1, rate: 12000, kind: "expense" },
    ] },
  { id: "INV-NS-221", sup: null, entity: "Northstar Advisory LLP", date: "2026-11-06", due: "2026-12-06", currency: "INR", taxBasis: "exclusive", gst: 0.18, pos: [], source: "ERP invoice inbox (simulated)",
    lines: [ { id: "N1", desc: "Strategy workshop facilitation", sow: null, from: "2026-10-20", to: "2026-10-21", qty: 1, rate: 450000, kind: "service" } ] },
];

// Fast-forward invoice used to show "Recurrence prevented" after the PO update.
export const NEXT_INVOICE: Invoice = { id: "INV-TB-1203", sup: "TB", entity: "TalentBridge Staffing Pvt Ltd", date: "2026-12-03", due: "2027-01-02", currency: "INR", taxBasis: "exclusive", gst: 0.18, pos: ["4500012345", "4500013310"], source: "ERP invoice inbox (simulated, fast-forward)",
  lines: [
    { id: "M1", desc: "Senior Developer", sow: "SOW-1", from: "2026-11-01", to: "2026-11-30", qty: 960, rate: 2200, kind: "labour" },
    { id: "M2", desc: "Business Analyst", sow: "SOW-1", from: "2026-11-01", to: "2026-11-30", qty: 320, rate: 1800, kind: "labour" },
    { id: "M3", desc: "Senior Developer", sow: "SOW-2", from: "2026-11-01", to: "2026-11-30", qty: 160, rate: 2400, kind: "labour" },
  ] };

// Approved hours from the timesheet system (simulated). Key: SOW|role|YYYY-MM
export const TIMESHEETS: Record<string, number> = {
  "SOW-1|Senior Developer|2026-10": 960, "SOW-1|Senior Developer|2026-09": 120, "SOW-1|Business Analyst|2026-10": 320, "SOW-2|Senior Developer|2026-10": 160,
  "SOW-1|Senior Developer|2026-11": 960, "SOW-1|Business Analyst|2026-11": 320, "SOW-2|Senior Developer|2026-11": 160,
};
export const PAID_INVOICE_NUMBERS = ["INV-TB-1002", "INV-TB-0904", "INV-TB-0805"];

// Northstar investigation results (simulated supplier master and PO search)
export const NORTHSTAR_CHECKS = [
  { check: "Parent or group company has a contract", result: "None found in supplier master" },
  { check: "Other trading names", result: "Possible match: Northstar Consulting Group LLP has MSA NS-2025. Different legal entity, so not a match yet." },
  { check: "Blanket purchase order", result: "None found" },
  { check: "Regional entity", result: "None found" },
];

// CloudDesk usage from the SaaS admin console (simulated). Monthly active seats, Dec 2025 to Nov 2026.
export const CD_USAGE = [428, 421, 410, 396, 382, 371, 355, 342, 330, 322, 314, 310];
export const CD_SEATS = { contracted: 500, active90: 310, seasonal: 30, service: 6, price: 7600, quoteUplift: 7, renewal: "2027-02-05", noticeDays: 60,
  quoteText: "Renewal quote CD-RQ-2291: fees increase 7% to reflect higher infrastructure and staffing costs.",
  seasonalNote: "30 seats used only in Q4 by the holiday support team", serviceNote: "6 service accounts used by integrations" };

// SwiftHaul delivery records for October 2026 (simulated transport management system)
export const SH_DELIVERY = { month: "2026-10", total: 1240, onTime: 1098, late: 142, customerCaused: 28, fmClaimed: 12, supplierLate: 102, fee: 4200000,
  fmEvidence: "Supplier email of 3 Nov cites heavy rain on 9 and 10 Oct. No supporting evidence was sent within 5 days, as clause 7.3 requires.",
  note: "All 40 excluded shipments are late ones. A shipment is only excluded to excuse a late delivery, so the on-time count stays 1,098 either way." };

export const SOURCES = [
  { pub: "World Commerce & Contracting", year: "2025", metric: "Average business loses almost 9% of value annually through poor contract management. Best about 3%, worst 15% or more.", use: "Context only. Broad contract value erosion, not a share of supplier spend and not Docket's recoverable savings.", url: "https://info.worldcc.com/contract-management-aug-2025" },
  { pub: "Ironclad summary of WorldCC and CCM Institute, ROI of Contracting Excellence 2026", year: "2026", metric: "About 9 to 10% of contract value lost. Poor post-signing oversight is a top-three cause of erosion in every segment.", use: "Supports focusing after signature. A vendor's summary of independent research.", url: "https://ironcladapp.com/resources/articles/key-takeaways-from-the-roi-of-contracting-excellence-2026-report" },
  { pub: "Tellius guide on contract leakage", year: "n.d.", metric: "Checking invoice lines against the contract catches orders raised above contract even when the invoice matches the PO.", use: "Explains why PO matching alone misses amendment-level overcharges.", url: "https://www.tellius.com/resources/blog/how-to-prevent-contract-leakage-on-supplier-invoices" },
  { pub: "EY Compliance IQ", year: "n.d.", metric: "About 3% to 5% of invoice charges EY sees are incorrect.", use: "Directional only. A service provider's own observation. Incorrect does not mean recoverable.", url: "https://www.ey.com/en_ca/services/supply-chain/compliance-iq" },
  { pub: "Redress Compliance invoice review", year: "2026", metric: "About one software vendor invoice in twelve had a material error; 0.5 to 2% of audited spend recoverable.", use: "Narrow: software vendor invoices in an advisory firm's own client file. Not applied to this company.", url: "https://redresscompliance.com/software-invoice-reconciliation-guide" },
  { pub: "Law Insider sample contract categories", year: "n.d.", metric: "Public catalogue of sample contracts by type (Service, Consulting, Subscription, Supply agreements).", use: "Docket's sample documents are modelled on these contract types. Company names are fictional.", url: "https://www.lawinsider.com/tags/category" },
];

// ---------- Version chaos: every file Docket found for the TalentBridge main contract ----------
export interface FileVersion { name: string; format: "Word" | "PDF"; where: string; date: string; signedBoth: boolean; eSign: string | null; seniorDevRate: number }
export const FILE_VERSIONS: FileVersion[] = [
  { name: "MSA_v1.docx", format: "Word", where: "Shared drive /Legal/Suppliers/TalentBridge/", date: "2025-11-18", signedBoth: false, eSign: null, seniorDevRate: 2600 },
  { name: "MSA_v2_clean.docx", format: "Word", where: "Email attachment from TalentBridge, 9 Dec 2025", date: "2025-12-09", signedBoth: false, eSign: null, seniorDevRate: 2500 },
  { name: "MSA_final_FINAL.docx", format: "Word", where: "Shared drive /Legal/Suppliers/TalentBridge/", date: "2025-12-28", signedBoth: false, eSign: null, seniorDevRate: 2500 },
  { name: "MSA_signed.pdf", format: "PDF", where: "Shared drive /Legal/Suppliers/TalentBridge/", date: "2026-01-01", signedBoth: true, eSign: "ES-48803 (completed 1 Jan 2026)", seniorDevRate: 2400 },
];

// ---------- Excel: Procurement's tracker (simulated Supplier_contracts_tracker.xlsx) ----------
export interface TrackerRow { sup: string; field: "notice" | "rate:Senior Developer" | "sla" | "fee" | "cap"; label: string; value: number; unit: string; scope?: string; cell: string }
export const TRACKER_FILE = "Supplier_contracts_tracker.xlsx (Procurement shared drive, last edited 14 Mar 2026)";
export const TRACKER: TrackerRow[] = [
  { sup: "CD", field: "notice", label: "CloudDesk notice period", value: 30, unit: "days", cell: "Sheet Renewals, F12" },
  { sup: "TB", field: "rate:Senior Developer", label: "TalentBridge Senior Developer rate", value: 2400, unit: "INR/hr", scope: "SOW-1", cell: "Sheet Rates, D7" },
  { sup: "SH", field: "sla", label: "SwiftHaul on-time target", value: 95, unit: "%", cell: "Sheet SLAs, C4" },
  { sup: "MR", field: "cap", label: "Meridian price cap", value: 4, unit: "%", cell: "Sheet Renewals, H9" },
];

// ---------- Coverage: suppliers paid this year vs contracts in Docket (simulated AP + corporate card feed) ----------
export interface Spend { name: string; sup: string | null; amount: number; how: string }
export const SPEND_2026: Spend[] = [
  { name: "TalentBridge Staffing Pvt Ltd", sup: "TB", amount: 48000000, how: "Invoices (ERP)" },
  { name: "CloudDesk Software Pvt Ltd", sup: "CD", amount: 3800000, how: "Invoices (ERP)" },
  { name: "SwiftHaul Logistics Ltd", sup: "SH", amount: 46200000, how: "Invoices (ERP)" },
  { name: "PrimeFacility Services LLP", sup: "PF", amount: 16000000, how: "Invoices (ERP)" },
  { name: "Brightline Marketing Pvt Ltd", sup: "BL", amount: 21000000, how: "Invoices (ERP)" },
  { name: "Meridian IT Consulting Pvt Ltd", sup: "MR", amount: 32000000, how: "Invoices (ERP)" },
  { name: "Northstar Advisory LLP", sup: null, amount: 450000, how: "One invoice (ERP), no PO" },
  { name: "QuickPrint Solutions", sup: null, amount: 120000, how: "Corporate card, 7 payments" },
  { name: "Zenith Events Pvt Ltd", sup: "ZE", amount: 840000, how: "3 purchase orders (ERP)" },
];

// ---------- Reminders and escalation (approvals stall) ----------
export const DELEGATES: Record<Role, { name: string; title: string }> = {
  finance: { name: "Sagar More", title: "AP Lead" },
  legal: { name: "Pooja Gaikwad", title: "Legal Counsel" },
  procurement: { name: "Nikhil Bhandari", title: "Procurement Lead" },
  owner: { name: "Sneha Bhosale", title: "Support Operations Manager" },
  supplier: { name: "TalentBridge account manager", title: "Supplier side" },
};
