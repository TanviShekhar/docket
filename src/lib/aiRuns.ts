// Recorded AI runs. These are real outputs from Claude (Opus 5.5), produced on 22 Nov 2026 while Docket was
// being built, using EXTRACTION_PROMPT below on each document's text. Stored unedited.
// The site shows them with the label "Recorded AI run". It never presents them as live.

export const RUN_META = { model: "Claude Opus 5.5", date: "2026-11-22", note: "Run once during the build. Outputs stored unedited." };

export const EXTRACTION_PROMPT = `You read supplier contracts for a Finance and Procurement team.
From the document text below, extract every commercial term that could affect money or a deadline:
rates and fees, price caps, renewal and notice terms, service levels and credits, expense rules,
scope (which SOW or service a term applies to), effective dates, and signature status.
For each term return: field, value, the exact quote from the text (copied word for word), clause, and your confidence from 0 to 1.
Do not guess. If something is unclear or could be read two ways, say so in "flag".
Return JSON only: {"fields":[{"field","value","quote","clause","confidence","flag"}]}`;

export interface AIField { field: string; value: string; quote: string; clause: string; confidence: number; flag?: string }
export const AI_RUNS: Record<string, AIField[]> = {
  "TB-MSA": [
    { field: "Rate basis", value: "Hourly rates per Schedule 2, exclusive of GST", quote: "The Customer shall pay the Supplier the hourly rates set out in Schedule 2 (Rate Card) for each Role, exclusive of GST.", clause: "2.1", confidence: 0.97 },
    { field: "Senior Developer rate", value: "INR 2,400 per hour", quote: "Senior Developer INR 2,400 per hour", clause: "Sch 2", confidence: 0.97 },
    { field: "Business Analyst rate", value: "INR 1,800 per hour", quote: "Business Analyst INR 1,800 per hour", clause: "Sch 2", confidence: 0.97 },
    { field: "Project Manager rate", value: "INR 2,900 per hour", quote: "Project Manager INR 2,900 per hour", clause: "Sch 2", confidence: 0.96 },
    { field: "Expenses", value: "Reimbursable at cost only with written approval before they are incurred", quote: "Travel and out-of-pocket expenses are reimbursable at cost only where approved in writing by the Customer before they are incurred.", clause: "6.4", confidence: 0.95 },
    { field: "Order of precedence", value: "SOW prevails for its own scope; an amendment prevails only over the provisions it expressly amends", quote: "a Statement of Work prevails over this Agreement for its own scope, and an Amendment prevails only over the provisions it expressly amends", clause: "14.2", confidence: 0.93 },
  ],
  "TB-SOW1": [
    { field: "Resources", value: "6 Senior Developers and 2 Business Analysts", quote: "six (6) Senior Developers and two (2) Business Analysts", clause: "3", confidence: 0.96 },
    { field: "Billing", value: "Monthly in arrears against approved timesheets, PO 4500012345", quote: "billed monthly in arrears against approved timesheets under PO 4500012345", clause: "3", confidence: 0.95 },
  ],
  "TB-SOW2": [
    { field: "Resources", value: "1 Senior Developer at the Schedule 2 rate", quote: "one (1) Senior Developer at the Schedule 2 rate", clause: "3", confidence: 0.95 },
    { field: "Billing", value: "Monthly in arrears, PO 4500013310", quote: "billed monthly in arrears under PO 4500013310", clause: "3", confidence: 0.95 },
  ],
  "TB-AMD1": [
    { field: "Senior Developer rate", value: "INR 2,000 per hour", quote: "The Senior Developer rate in Schedule 2 is revised to INR 2,000 per hour.", clause: "1", confidence: 0.91, flag: "The document says it is signed by the Customer only and not countersigned by the Supplier. It may not be in force." },
  ],
  "TB-AMD2": [
    { field: "Senior Developer rate", value: "INR 2,200 per hour", quote: "the Senior Developer rate in Schedule 2 is revised to INR 2,200 per hour", clause: "1", confidence: 0.94 },
    { field: "Effective date", value: "1 October 2026", quote: "With effect from 1 October 2026", clause: "1", confidence: 0.96 },
    { field: "Scope", value: "Services under SOW-1 only", quote: "for Services under SOW-1 only", clause: "1", confidence: 0.92, flag: "The change applies to SOW-1 only. SOW-2 still uses the Schedule 2 rate." },
  ],
  "CD-SUB": [
    { field: "Seats and price", value: "500 named-user seats at INR 7,600 per seat per year", quote: "500 named-user seats at INR 7,600 per seat per year", clause: "4.1", confidence: 0.97 },
    { field: "Auto-renewal", value: "Renews automatically for 12-month terms", quote: "This Agreement renews automatically for successive twelve (12) month terms", clause: "9.1", confidence: 0.96 },
    { field: "Non-renewal notice", value: "Written notice received at least 60 days before the term ends", quote: "written notice of non-renewal that is received at least sixty (60) days before the end of the then-current term", clause: "9.1", confidence: 0.96, flag: "The notice must be received, not just sent, by the deadline." },
    { field: "Renewal price cap", value: "Up to 5%", quote: "Fees may increase on renewal by no more than five percent (5%)", clause: "9.2", confidence: 0.88, flag: "Exception: the cap does not apply where a change in law or regulation materially increases the Supplier's cost, and the Supplier must give written evidence. Needs a Legal reading for each renewal." },
    { field: "Notice method", value: "Registered post or courier to the registered office in Whitefield, Bengaluru, Attn: Legal", quote: "Notices must be sent by registered post or courier to the Supplier's registered office", clause: "17.3", confidence: 0.95, flag: "Email is not a valid notice method under this clause." },
  ],
  "SH-MSA": [
    { field: "Monthly fee", value: "INR 42,00,000 exclusive of GST", quote: "Monthly Service Fee: INR 42,00,000, exclusive of GST.", clause: "5.1", confidence: 0.97 },
    { field: "On-time SLA", value: "At least 95% of Eligible Shipments within the Delivery Window, each calendar month", quote: "Supplier shall deliver at least 95% of Eligible Shipments within the agreed Delivery Window in each calendar month.", clause: "7.1", confidence: 0.93 },
    { field: "Exclusions", value: "Customer-caused delays; force majeure notified with evidence within 5 days", quote: "Eligible Shipments exclude shipments delayed by the Customer or by a Force Majeure Event notified with supporting evidence within 5 days.", clause: "7.3", confidence: 0.9, flag: "Force majeure counts only if notified with supporting evidence within 5 days." },
    { field: "Service credit", value: "2% of monthly fee per full point below 95%, capped at 10%", quote: "2% of the monthly Service Fee for each full percentage point below 95%, capped at 10% of the monthly Service Fee", clause: "7.4", confidence: 0.9, flag: "Only full percentage points count. 3.5 points below means 3 points." },
    { field: "Claim window", value: "Claim in writing within 30 days of month end; offset against the next invoice", quote: "Credits must be claimed in writing within 30 days of the month end and are applied as an offset against the next invoice.", clause: "7.4", confidence: 0.94 },
  ],
  "PF-AGR": [
    { field: "Maintenance response", value: "\"Prompt response\" (no time stated)", quote: "The Supplier shall provide a prompt response to all maintenance requests raised by the Customer.", clause: "8.2", confidence: 0.93, flag: "No time limit or measurement method is given, so performance and any credit cannot be calculated." },
  ],
  "BL-RET": [
    { field: "Monthly retainer", value: "INR 17,50,000 exclusive of GST, fixed for the initial term", quote: "Monthly retainer fee of INR 17,50,000, exclusive of GST, fixed for the initial term.", clause: "3.1", confidence: 0.98 },
  ],
  "MR-MSA": [
    { field: "SOC 2 report", value: "Current SOC 2 Type II report due by 31 March each year", quote: "Supplier shall deliver a current SOC 2 Type II report to the Customer by 31 March each year.", clause: "11.2", confidence: 0.92 },
    { field: "Anniversary price cap", value: "Up to 4% per anniversary", quote: "Fees may increase on each anniversary by no more than four percent (4%).", clause: "12.1", confidence: 0.95 },
  ],
  "BL-SL1": [
    { field: "Temporary retainer fee", value: "INR 15,75,000 per month for Oct, Nov and Dec 2026 (10% off)", quote: "the monthly retainer fee is reduced by ten percent (10%) to INR 15,75,000, exclusive of GST", clause: "1", confidence: 0.95, flag: "Temporary: applies to October, November and December 2026 only. This document was found in an email inbox and is not yet in the contract family." },
  ],
  "ZE-Q": [
    { field: "Fee per event", value: "INR 2,80,000 per event, three offsites in 2026", quote: "three company offsites in 2026 at INR 2,80,000 per event, exclusive of GST", clause: "1", confidence: 0.94, flag: "A signed quote acting as the contract. Found in a personal folder, so it may not have gone through Procurement or Legal." },
    { field: "Payment terms", value: "Within 30 days of each event", quote: "payable within 30 days of each event", clause: "1", confidence: 0.95 },
  ],
};

// The four judgements plain code could not make. Each one is confirmed by a person before it counts.
export const AI_JUDGEMENTS = [
  { id: "j-scope", title: "Amendment 2 applies to SOW-1 only", confirmedBy: "legal" as const, input: "Amendment 2, clause 1", output: "The new rate of INR 2,200 applies to Services under SOW-1 only. SOW-2 keeps the Schedule 2 rate of INR 2,400.", why: "The clause says \"for Services under SOW-1 only\" and \"All other terms remain unchanged\". MSA 14.2 says an amendment prevails only over what it expressly amends." },
  { id: "j-map", title: "\"Technical Consultant\" is a Senior Developer", confirmedBy: "finance" as const, input: "Invoice INV-TB-1103 line 4, timesheet for R. Jadhav, SOW-1 resources", output: "Likely Senior Developer (82% confident).", why: "\"Technical Consultant\" is not a role on the rate card. The approved timesheet lists R. Jadhav as Senior Developer. SOW-1 staffs only Senior Developers and Business Analysts, and 800 + 160 hours = 960, which is 6 developers at 160 hours." },
  { id: "j-cap", title: "The CloudDesk price-cap exception is not triggered", confirmedBy: "legal" as const, input: "Clause 9.2 and renewal quote CD-RQ-2291", output: "The 5% cap applies. The quote does not meet the exception.", why: "The exception needs a change in law or regulation plus written evidence. The quote cites infrastructure and staffing costs, names no law or regulation, and attaches no evidence." },
  { id: "j-fm", title: "SwiftHaul's force majeure claim does not qualify", confirmedBy: "procurement" as const, input: "Clause 7.3 and supplier email of 3 Nov", output: "The 12 shipments should not be excluded.", why: "Clause 7.3 needs notice with supporting evidence within 5 days. The email arrived on 3 Nov, more than 5 days after 9 and 10 Oct, and attaches no evidence." },
];

// Preloaded messy sample for the "Read a contract" box. Fictional company.
export const MESSY_SAMPLE = `HOUSEKEEPING SERVICES AGREEMENT  (Orchid Facility Services Pvt Ltd  /  Larkspur Technologies)

1. Term. This agmt starts 1 April 2026 and shall renew automatically for further periods of one (1) year unless terminated by either party by giving ninety (90) days written notice prior to expiry.
2. Fees : Rs. 6,40,000 per month plus applicable taxes;  fees may be revised by up to 6% on each renewal .
3. Response -- Supplier to attend urgent cleaning requests within 4 hours ; failing which a deduction of INR 5,000 per incident applies (max INR 50,000 / month).
4.  Payment within 45 days of invoice.`;

export const MESSY_RUN: AIField[] = [
  { field: "Start date", value: "1 April 2026", quote: "This agmt starts 1 April 2026", clause: "1", confidence: 0.95 },
  { field: "Auto-renewal", value: "Renews automatically for 1-year periods", quote: "shall renew automatically for further periods of one (1) year", clause: "1", confidence: 0.94 },
  { field: "Termination notice", value: "90 days written notice before expiry", quote: "giving ninety (90) days written notice prior to expiry", clause: "1", confidence: 0.92, flag: "It does not say whether notice must be received or only sent by the deadline." },
  { field: "Monthly fee", value: "INR 6,40,000 per month plus taxes", quote: "Rs. 6,40,000 per month plus applicable taxes", clause: "2", confidence: 0.96 },
  { field: "Renewal price cap", value: "Up to 6% per renewal", quote: "fees may be revised by up to 6% on each renewal", clause: "2", confidence: 0.93 },
  { field: "Urgent response SLA", value: "Within 4 hours", quote: "Supplier to attend urgent cleaning requests within 4 hours", clause: "3", confidence: 0.94 },
  { field: "SLA deduction", value: "INR 5,000 per missed incident, max INR 50,000 per month", quote: "a deduction of INR 5,000 per incident applies (max INR 50,000 / month)", clause: "3", confidence: 0.93 },
  { field: "Payment terms", value: "45 days from invoice", quote: "Payment within 45 days of invoice", clause: "4", confidence: 0.95 },
];
