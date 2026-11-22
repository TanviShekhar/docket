import { DOCS, SUPPLIERS } from "./data";

// Case study copy that is data: assumptions, source systems, conflicts, metrics. Text follows CLAUDE.md sections 10 to 12.

export const ASSUMPTIONS: { code: string; text: string; why: string; wrong: string }[] = [
  { code: "A1", text: "About 2,500 suppliers; the number of contracts is unknown. The prototype uses " + SUPPLIERS.length + " fictional suppliers and " + DOCS.length + " documents", why: "The brief gives suppliers, not contracts", wrong: "The pilot counts documents first" },
  { code: "A2", text: "About ₹900 crore a year of supplier spend, context only", why: "Typical for 3,000 employees", wrong: "Nothing in the case depends on it" },
  { code: "A3", text: "Signed documents have already been gathered; migration is a dependency, not built", why: "Real day-one work, poor demo", wrong: "The pilot starts with an inventory" },
  { code: "A4", text: "Invoices, timesheets, usage and delivery data are simulated from the systems in the source systems table", why: "No real connectors in a prototype", wrong: "Real connectors are needed" },
  { code: "A5", text: "Rates in rupees, exclusive of GST, no foreign currency; invoice checks cover professional services only", why: "Keeps the scope credible", wrong: "Other categories come later" },
  { code: "A6", text: "All companies, people and documents are fictional; document types modelled on Law Insider categories", why: "No real company is accused of anything", wrong: "None" },
  { code: "A7", text: "Demo date fixed to Mon 23 Nov 2026; deadlines skip weekends but not public holidays", why: "The story reads the same whenever it is opened", wrong: "Add a holiday calendar" },
  { code: "A8", text: "The brief allows AI tools; AI outputs are recorded runs because the site is static", why: "No API key on a static site", wrong: "Live AI can be added on a server later" },
  { code: "A9", text: "Inbox and folder scanning, the Excel tracker and the corporate card feed are simulated; in production, people choose which mailboxes and folders Docket may read", why: "Privacy and IT approval", wrong: "Coverage of shadow contracts depends on what is connected" },
  { code: "A10", text: "The version that counts is the one signed by both parties with a completed e-signature record; otherwise Legal decides", why: "A clear, explainable rule", wrong: "Paper-signed contracts need a manual check" },
  { code: "A11", text: "Scanned and image-only documents are already read by OCR (text recognition) in an earlier intake pipeline, so Docket receives clean text. The prototype does not do this", why: "OCR is a solved, separate step, and it would add nothing to what this prototype demonstrates", wrong: "A real rollout needs the OCR pipeline first, and low-quality scans need a human check" },
];

export const SOURCE_SYSTEMS: [string, string, string][] = [
  ["Shared drives and email attachments", "Contract documents", "Contracts"],
  ["E-signature platform", "Whether both parties signed, and when", "Contract family (signed status)"],
  ["ERP (accounts payable)", "Invoices, purchase orders", "Invoice check"],
  ["Timesheet system", "Approved hours by role and month", "Invoice check (hours)"],
  ["SaaS admin console", "Monthly active seats", "Renewal"],
  ["Transport management system", "Shipments, on-time flags, delay reasons", "Service credit"],
  ["Supplier master", "Legal entity names, group companies", "Northstar check"],
  ["Excel trackers", "Copies of renewal dates, rates and SLAs kept by teams", "Tracker check"],
  ["Intake and OCR pipeline (assumed upstream, not built)", "Clean text from scanned and image-only documents", "Contracts"],
  ["Connected inboxes and shared folders (scanning)", "Contract-like files that were never filed", "Found outside Docket, version check"],
  ["Corporate card feed", "Payments made without a PO or invoice", "Coverage"],
  ["Company sign-in", "Roles", "Role switcher"],
];

export const LATER_SYSTEMS: [string, string][] = [
  ["Procure-to-pay or procurement suite", "Requisitions, POs, approvals, catalogues"],
  ["Vendor management system for contract staff", "Worker roles, rates and hours from staffing agencies"],
  ["GST e-invoice portal and GSTR-2B", "Confirms the supplier's credit note reached the tax records"],
  ["AP invoice capture (OCR)", "Turns PDF invoices into line items"],
  ["Service desk / ITSM", "Ticket times for IT and facilities service levels"],
  ["Warehouse management system", "Delivery and receiving data"],
  ["Payments and bank", "Proof of payment and refunds"],
  ["Courier tracking", "Proof that a notice was received in time"],
  ["Budgeting and planning", "Budget lines to compare renewals against"],
  ["Supplier risk feeds", "Credit ratings, company filings, sanctions, insolvency notices"],
  ["Collaboration tools (chat, email)", "Where informal approvals and changes often live"],
  ["Existing CLM (if any)", "Contracts already stored elsewhere"],
];

export const STAKEHOLDERS: [string, string, string][] = [
  ["Procurement", "Primary user", "Leverage at renewal and supplier performance"],
  ["Finance and AP", "Primary user", "To pay exactly what was agreed"],
  ["Legal", "Foundational user: nothing counts until Legal checks the term", "Accurate readings and low risk"],
  ["Business owner", "Decision-maker", "The service to keep working with little admin"],
  ["Supplier", "External party", "Full payment and renewals"],
  ["CFO", "Sponsor", "Confirmed value"],
  ["IT and Security", "Enabler", "Secure data and approved AI use"],
  ["Internal Audit", "Assurance", "Evidence for every decision"],
];

// Lines on the map. Each conflict can be drawn between more than one pair.
export const CONFLICTS: { id: number; title: string; text: string }[] = [
  { id: 1, title: "Business owner and Procurement", text: "Keep the service running vs use the renewal as leverage. Docket shows usage and rupees; the owner decides, Procurement acts." },
  { id: 2, title: "Finance and Business owner / Supplier", text: "Recover money vs keep the relationship. Docket recommends holding only the disputed amount and paying the rest on time." },
  { id: 3, title: "Finance and Procurement vs Legal", text: "Speed vs accuracy. Only terms checked by Legal can start a dispute or claim." },
  { id: 4, title: "Legal vs scale", text: "2,500 suppliers is too many to check upfront. Just-in-time checking: Legal checks a term the first time money or a deadline depends on it, ordered by rupee impact, urgency and uncertainty." },
  { id: 5, title: "Procurement and Supplier", text: "Claims vs goodwill. Every claim cites the clause and the data. Waivers are recorded as decisions, not misses." },
  { id: 6, title: "IT and Security and everyone", text: "AI on contract data. Production needs sign-in, role-based access, encryption, retention rules and a tamper-proof audit log." },
];

export const OWNERSHIP: [string, string, string][] = [
  ["Check a term", "Legal", "Legal analyst"],
  ["Invoice difference and role mapping", "Finance", "AP analyst"],
  ["Renewal decision", "Business owner", "Procurement"],
  ["Service-level exclusions and claim", "Procurement", "Supplier manager"],
  ["Waive a claim", "Business owner", "Authorised approver"],
];

export const METRICS: [string, string][] = [
  ["Coverage", "% of suppliers and % of spend linked to checked terms in force. Report both: spend coverage hides small shadow suppliers."],
  ["Shadow contracts", "Documents found outside Docket per month, and time to add them."],
  ["Source of truth", "Tracker or draft mismatches found and fixed."],
  ["AI quality before human correction", "Field precision and recall, amendment-resolution accuracy, critical-field error rate (rates, notice dates, caps), human correction rate."],
  ["Flag quality", "Precision and recall."],
  ["Adoption", "% of eligible invoices checked through Docket."],
  ["Speed", "Invoice received to difference confirmed."],
  ["Renewals", "% decided before the internal deadline and before the notice deadline."],
  ["Outcomes", "% of flags Finance confirms, % of confirmed disputes resolved in our favour, time to close."],
  ["Repeat prevention", "% of corrected rates with no repeat overcharge next invoice."],
  ["Guardrails", "False flags per 100 invoices, missed differences, delayed payments on undisputed lines, alerts per person per week."],
];

export const PHASES: [string, string, string][] = [
  ["Days 1 to 30", "Inventory, family rebuild, retrospective audit", "Money at stake found"],
  ["Days 31 to 90", "Invoice-check pilot on top 50 suppliers", "Confirmed differences"],
  ["Months 4 to 6", "Wider coverage and renewals", "Confirmed corrections"],
  ["Months 7 to 12", "Service-level checks", "Confirmed credits and savings"],
];

export const RETHINK: string[] = [
  "Critical-field errors stay high: narrow to human-checked top suppliers.",
  "Finance rejects most flags: fix matching before scaling.",
  "More than 40% of renewal recommendations are overridden: show facts only, no recommendation.",
  "Good coverage but little confirmed value: the leakage is upstream in vague contracts, so move to an enforceability check at negotiation.",
];

export const TRIGGERS: [string, string][] = [
  ["New file in a watched inbox or folder", "Version check and \"found outside Docket\""],
  ["Supplier paid with no contract", "Coverage item"],
  ["New signed document", "Re-check terms in force"],
  ["Invoice received", "Invoice check"],
  ["Deadline approaching (daily)", "Renewal item"],
  ["Month closes", "Service-level check"],
  ["Credit note received", "Value confirmed"],
];

export const PRECEDENCE: string[] = [
  "Only documents signed by both parties count.",
  "A change covers only the scope it names.",
  "The start date decides, not the signature date.",
  "The latest start date wins.",
  "Two changes to the same term on the same date go to Legal.",
  "Invoices are checked by service date.",
];

export const PROTO_VS_PROD: [string, string, string][] = [
  ["Who you are", "Role switcher", "Company sign-in and server-side access control"],
  ["History", "Browser storage", "Tamper-proof server log"],
  ["AI", "Recorded AI runs", "Live AI with an API key held on a server"],
  ["Data feeds", "Simulated feeds", "Real connectors"],
];

export const REAL_VS_SIM: [string, string, string][] = [
  ["Calculations", "Real", "Run by engine.ts, which has tests that lock every number in the story"],
  ["AI reading of documents", "Recorded AI runs", "Real Claude output, stored unedited"],
  ["Rule-based reader", "Real", "Runs on any text you give it"],
  ["Invoices, timesheets, usage, delivery data", "Simulated", "Made up to stand in for the systems in the source systems table"],
  ["Sign-in and permissions", "Simulated", "A role switcher"],
  ["History", "Real, in your browser only", "Production needs a server-side tamper-proof log"],
  ["Sending emails or post", "Never", "People send, Docket records"],
];
