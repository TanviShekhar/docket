// The data behind each page as small files people can open in Excel. Every number comes from the same code as the page.
import { CD_USAGE, DEMO_TODAY, FILE_VERSIONS, INVOICES, SH_DELIVERY, SPEND_2026, TIMESHEETS, TRACKER, TRACKER_FILE } from "./data";
import { checkInvoice, coverage, trackerCheck } from "./engine";
import { MON } from "./copy";
import { rows as contractRows } from "./contracts";
import { checkStateOf, valueItems } from "./ledger";
import type { DataFile } from "./csv";
import type { Snapshot } from "./store";

const invoiceFile = (s: Snapshot): DataFile => {
  const inv = INVOICES[0], r = checkInvoice(inv, checkStateOf(s));
  return { name: `${inv.id}_lines`, rows: [
    ["Line", "Description", "Project order", "From", "To", "Quantity", "Rate (INR)", "Amount (INR)", "Docket result", "Possible difference (INR)"],
    ...r.lines.map((l, i) => [i + 1, l.l.desc, l.l.sow ?? "", l.l.from, l.l.to, l.l.qty, l.l.rate, l.amount, l.status, l.diff ?? 0]),
  ] };
};
const timesheetFile = (): DataFile => ({ name: "Approved_hours_timesheet", rows: [["Project order", "Role", "Month", "Approved hours"], ...Object.entries(TIMESHEETS).map(([k, v]) => [...k.split("|"), v])] });

export function filesFor(id: string, s: Snapshot): DataFile[] {
  if (/^A\d+r?$/.test(id)) return [invoiceFile(s), timesheetFile()];
  if (id === "B2") return [{ name: "CloudDesk_monthly_active_seats", rows: [["Month", "Active seats"], ...CD_USAGE.map((v, i) => [`${MON[(11 + i) % 12]} ${i === 0 ? 2025 : 2026}`, v])] }];
  if (id === "C2") return [{ name: "SwiftHaul_October_deliveries", rows: [["Measure", "Shipments"], ["Total shipments", SH_DELIVERY.total], ["On time", SH_DELIVERY.onTime], ["Late", SH_DELIVERY.late], ["Late, delayed by Larkspur", SH_DELIVERY.customerCaused], ["Late, supplier claims force majeure", SH_DELIVERY.fmClaimed], ["Late, supplier's fault", SH_DELIVERY.supplierLate]] }];
  if (id === "G") return [{ name: "Supplier_contracts_tracker_check", rows: [["Tracker file", TRACKER_FILE], [], ["Row", "Cell", "Tracker says", "Contract says", "Match"],
    ...trackerCheck(checkStateOf(s), DEMO_TODAY).map((r) => [r.row.label, r.row.cell, r.row.value, r.contract ?? "", r.match ? "Yes" : "No"])] }];
  if (id === "H") return [{ name: "Suppliers_paid_this_year", rows: [["Supplier", "How paid", "Amount (INR)", "Contract in Docket"],
    ...SPEND_2026.map((x) => [x.name, x.how, x.amount, coverage(s.addedDocs).shadow.some((y) => y.name === x.name) ? "No" : "Yes"])] }];
  if (id === "F") return [{ name: "TalentBridge_main_contract_files", rows: [["File", "Where", "Date", "Signed by both", "E-signature", "Senior Developer rate (INR/hr)"],
    ...FILE_VERSIONS.map((f) => [f.name, f.where, f.date, f.signedBoth ? "Yes" : "No", f.eSign ?? "", f.seniorDevRate])] }];
  return [];
}

export const contractsFile = (s: Snapshot): DataFile => ({ name: "Contracts_and_where_found", rows: [["Document", "Supplier", "Type", "Source", "Status"], ...contractRows(s).map((r) => [r.title, r.sup, r.type, r.source, r.status])] });
export const valueFile = (s: Snapshot): DataFile => ({ name: "Value_items", rows: [["Item", "Category", "One-off or yearly", "Stage", "Amount (INR)"], ...valueItems(s).map((i) => [i.label, i.category, i.kind, i.stage, i.amount])] });
