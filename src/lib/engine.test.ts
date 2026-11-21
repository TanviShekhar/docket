// These tests lock the demo story. If one fails, fix the code, not the expected number.
import { describe, it, expect } from "vitest";
import { checkInvoice, resolveTerm, renewalDates, renewalMoney, suggestedSeats, slaCalc, claimDeadline, priority, daysBetween, ruleParse, grounded } from "./engine";
import { INVOICES, NEXT_INVOICE, CD_SEATS, SH_DELIVERY, DEMO_TODAY, DOCS } from "./data";
import { pickOperative, trackerCheck, coverage, searchClauses, escalation, withFiled } from "./engine";

const tb = INVOICES[0];

describe("precedence rules (TalentBridge Senior Developer rate)", () => {
  it("SOW-1 in October: Amendment 2 wins at 2,200; unsigned Amendment 1 is excluded", () => {
    const r = resolveTerm("TB", "rate:Senior Developer", "SOW-1", "2026-10-15");
    expect(r.winner!.t.value).toBe(2200);
    expect(r.cands.find((c) => c.t.id === "t3")!.reason).toMatch(/rule 1/);
    expect(r.cands.find((c) => c.t.id === "t1")!.reason).toMatch(/rule 4/);
  });
  it("SOW-1 in September: still 2,400 (Amendment 2 starts 1 Oct)", () => {
    expect(resolveTerm("TB", "rate:Senior Developer", "SOW-1", "2026-09-20").winner!.t.value).toBe(2400);
  });
  it("SOW-2 in October: 2,400 (Amendment 2 covers SOW-1 only)", () => {
    const r = resolveTerm("TB", "rate:Senior Developer", "SOW-2", "2026-10-15");
    expect(r.winner!.t.value).toBe(2400);
    expect(r.cands.find((c) => c.t.id === "t4")!.reason).toMatch(/rule 2/);
  });
});

describe("invoice INV-TB-1103", () => {
  it("before Legal checks the rate: line 1 is blocked, line 4 needs mapping, potential 1,92,000", () => {
    const r = checkInvoice(tb, {});
    expect(r.lines.map((x) => x.status)).toEqual(["blocked", "match", "match", "confirm-map", "match", "review"]);
    expect(r.totals.potential).toBe(192000);
    expect(r.totals.disputable).toBe(0);
    expect(r.totals.sub).toBe(3564000);
  });
  it("after Legal checks: line 1 overcharge 1,60,000, GST adjustment 28,800", () => {
    const r = checkInvoice(tb, { termState: { t4: "verified" } });
    expect(r.lines[0].status).toBe("over");
    expect(r.lines[0].diff).toBe(160000);
    expect(r.totals.disputable).toBe(160000);
    expect(r.totals.disputableGst).toBe(28800);
  });
  it("after Finance confirms the mapping: 1,92,000 and GST 34,560", () => {
    const r = checkInvoice(tb, { termState: { t4: "verified" }, mapConfirmed: { L4: "Senior Developer" } });
    expect(r.totals.disputable).toBe(192000);
    expect(r.totals.disputableGst).toBe(34560);
    expect(r.lines.every((x) => x.l.kind !== "labour" || x.qty!.ok)).toBe(true); // 960 billed = 960 approved
  });
  it("if Finance rejects the mapping, line 4 goes to review and is not counted", () => {
    const r = checkInvoice(tb, { termState: { t4: "verified" }, mapConfirmed: { L4: false } });
    expect(r.lines[3].status).toBe("review");
    expect(r.totals.disputable).toBe(160000);
  });
  it("Northstar invoice: no matching contract", () => {
    expect(checkInvoice(INVOICES[1]).nocontract).toBe(true);
  });
  it("December fast-forward invoice: everything matches (recurrence prevented)", () => {
    const r = checkInvoice(NEXT_INVOICE, { termState: { t4: "verified" } });
    expect(r.lines.every((x) => x.status === "match")).toBe(true);
  });
});

describe("CloudDesk renewal", () => {
  it("dates from the contract", () => {
    const d = renewalDates(CD_SEATS.renewal, CD_SEATS.noticeDays);
    expect(d.notice).toBe("2026-12-07");
    expect(d.internal).toBe("2026-11-25");
    expect(daysBetween(DEMO_TODAY, d.internal)).toBe(2);
  });
  it("seat suggestion: (310+30+6) x 1.1 = 380.6, next 10-seat increment = 390", () => {
    expect(suggestedSeats(CD_SEATS)).toBe(390);
  });
  it("money at 390 seats and 5% cap", () => {
    const m = renewalMoney(CD_SEATS, 390, 5);
    expect([m.current, m.asQuote, m.atCap, m.atSeats]).toEqual([3800000, 4066000, 3990000, 3112200]);
    expect([m.capSaving, m.seatSaving, m.vsQuote, m.vsBudget]).toEqual([76000, 877800, 953800, 687800]);
  });
});

describe("SwiftHaul service credit", () => {
  it("accept force majeure: 91.5%, 3 full points, 6%, 2,52,000", () => {
    const r = slaCalc(SH_DELIVERY, true);
    expect([r.eligible, r.perf, r.points, r.pct, r.credit]).toEqual([1200, 91.5, 3, 6, 252000]);
  });
  it("reject force majeure: 90.59%, 4 full points, 8%, 3,36,000", () => {
    const r = slaCalc(SH_DELIVERY, false);
    expect(r.eligible).toBe(1212);
    expect(r.perf.toFixed(2)).toBe("90.59");
    expect([r.points, r.pct, r.credit, r.cap]).toEqual([4, 8, 336000, 420000]);
  });
  it("late breakdown adds up", () => {
    expect(SH_DELIVERY.onTime + SH_DELIVERY.late).toBe(SH_DELIVERY.total);
    expect(SH_DELIVERY.customerCaused + SH_DELIVERY.fmClaimed + SH_DELIVERY.supplierLate).toBe(SH_DELIVERY.late);
  });
  it("claim deadline is 30 days after month end", () => {
    expect(claimDeadline("2026-10")).toBe("2026-11-30");
  });
});

describe("Legal queue priority (1 to 5 per factor)", () => {
  it("orders CloudDesk 13, SwiftHaul 12, TalentBridge 9, PrimeFacility 7", () => {
    expect(priority(76000, 2, 0.88, true).total).toBe(13);
    expect(priority(336000, 7, 0.9, false).total).toBe(12);
    expect(priority(192000, 10, 0.94, false).total).toBe(9);
    expect(priority(0, null, 0.93, true).total).toBe(7);
  });
});

describe("parser and evidence check", () => {
  it("finds money, percentage, notice period and auto-renewal", () => {
    const text = DOCS.find((d) => d.id === "CD-SUB")!.clauses.map((c) => c.text).join(" ");
    const types = ruleParse(text).map((x) => x.type);
    expect(types).toEqual(expect.arrayContaining(["Money", "Percentage", "Notice or term", "Auto-renewal"]));
  });
  it("evidence check is whitespace and case insensitive", () => {
    expect(grounded("The fee is INR 2,200 per  hour.", "fee is inr 2,200 per hour")).toBe(true);
    expect(grounded("The fee is INR 2,200 per hour.", "fee is INR 2,000")).toBe(false);
  });
});

import { AI_RUNS, MESSY_SAMPLE, MESSY_RUN } from "./aiRuns";
describe("recorded AI runs are grounded in their documents", () => {
  it("every quote appears word for word in its source document", () => {
    for (const [docId, fields] of Object.entries(AI_RUNS)) {
      const text = DOCS.find((d) => d.id === docId)!.clauses.map((c) => c.text).join("\n");
      for (const f of fields) expect(grounded(text, f.quote), `${docId}: ${f.quote}`).toBe(true);
    }
    for (const f of MESSY_RUN) expect(grounded(MESSY_SAMPLE, f.quote), f.quote).toBe(true);
  });
});

describe("version chaos: TalentBridge main contract files", () => {
  it("picks MSA_signed.pdf and lists the drafts that differ", () => {
    const r = pickOperative();
    expect(r.operative!.name).toBe("MSA_signed.pdf");
    expect(r.others).toHaveLength(3);
    expect(r.diffs.map((d) => d.name)).toEqual(["MSA_v1.docx", "MSA_v2_clean.docx", "MSA_final_FINAL.docx"]);
  });
});

describe("Excel tracker vs contract", () => {
  it("CloudDesk: tracker 30 days vs contract 60 days, would miss by 30 days (6 Jan vs 7 Dec)", () => {
    const r = trackerCheck({}, DEMO_TODAY);
    const cd = r.find((x) => x.row.sup === "CD")!;
    expect(cd.match).toBe(false);
    expect(cd.consequence).toContain("6 Jan 2027");
    expect(cd.consequence).toContain("7 Dec 2026");
    expect(cd.consequence).toContain("30 days");
  });
  it("TalentBridge rate: tracker 2,400 vs 2,200 in force once Legal checks Amendment 2; SwiftHaul and Meridian match", () => {
    const r = trackerCheck({ termState: { t4: "verified" } }, DEMO_TODAY);
    expect(r.find((x) => x.row.sup === "TB")!.contract).toBe(2200);
    expect(r.find((x) => x.row.sup === "TB")!.match).toBe(false);
    expect(r.filter((x) => x.match).map((x) => x.row.sup)).toEqual(["SH", "MR"]);
  });
});

describe("shadow contracts", () => {
  it("coverage: 9 paid, 6 with a contract; 3 shadow suppliers; Zenith becomes covered once its signed quote is added", () => {
    const before = coverage();
    expect([before.paid, before.covered, before.bySupplierPct]).toEqual([9, 6, 67]);
    expect(before.shadow.map((s) => s.name)).toEqual(["Northstar Advisory LLP", "QuickPrint Solutions", "Zenith Events Pvt Ltd"]);
    expect(before.bySpendPct).toBe(99.2);
    const after = coverage({ "ZE-Q": true });
    expect(after.covered).toBe(7);
  });
  it("Brightline side letter changes the fee in force only after it is added, and only for Oct to Dec", () => {
    expect(resolveTerm("BL", "fee", null, "2026-11-15").winner!.t.value).toBe(1750000);
    const docs = withFiled({ "BL-SL1": true });
    expect(resolveTerm("BL", "fee", null, "2026-11-15", undefined, docs).winner!.t.value).toBe(1575000);
    expect(resolveTerm("BL", "fee", null, "2027-01-15", undefined, docs).winner!.t.value).toBe(1750000);
  });
});

describe("search and escalation", () => {
  it("keyword search finds notice clauses", () => {
    const hits = searchClauses("notice received");
    expect(hits.some((h) => h.doc.id === "CD-SUB" && h.ref === "9.1")).toBe(true);
  });
  it("CloudDesk decision due 25 Nov: reminder on 23 Nov (today), escalate on 25 Nov", () => {
    expect(escalation("2026-11-25", DEMO_TODAY, false)).toEqual({ remindOn: "2026-11-23", escalateOn: "2026-11-25", status: "reminded" });
  });
});
