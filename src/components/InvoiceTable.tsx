import { inr } from "../lib/engine";
import type { checkInvoice } from "../lib/engine";
import Label from "./Label";

type Result = ReturnType<typeof checkInvoice>;

function status(l: Result["lines"][number]): { text: string; cls: string } {
  switch (l.status) {
    case "match": return { text: "Matches", cls: "text-ok" };
    case "over": return { text: `Overcharged by ${inr(l.diff ?? 0)}`, cls: "text-gap font-semibold" };
    case "under": return { text: "Billed below the rate", cls: "text-warn" };
    case "blocked": return { text: `Locked: waiting for Legal to check the rate (${inr(l.diff ?? 0)} possible)`, cls: "text-locked" };
    case "confirm-map": return { text: `Docket needs your answer (${inr(l.diff ?? 0)} possible)`, cls: "text-warn" };
    case "review": return { text: l.l.kind === "expense" ? "Needs approval proof" : "Needs review", cls: "text-warn" };
    default: return { text: "No matching contract", cls: "text-warn" };
  }
}

export default function InvoiceTable({ id, res }: { id: string; res: Result }) {
  return (
    <div>
      <p className="text-sm mb-2">Invoice {id} <Label kind="simulated" source="ERP invoice inbox" /></p>
      <ul className="text-sm mb-3 grid gap-1 sm:grid-cols-2">
        {res.header.map((h) => (
          <li key={h.label}><span className={h.ok ? "text-ok" : "text-warn"} aria-hidden>{h.ok ? "✓" : "✗"}</span> <span className="font-semibold">{h.label}:</span> {h.note}</li>
        ))}
      </ul>
      <div className="overflow-x-auto border border-[var(--line)] rounded-lg">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--muted)]">
            <tr><th className="p-2">Line</th><th className="p-2">What</th><th className="p-2 text-right">Quantity × rate</th><th className="p-2 text-right">Amount</th><th className="p-2">Result</th></tr>
          </thead>
          <tbody>
            {res.lines.map((r, i) => {
              const st = status(r);
              return (
                <tr key={r.l.id} className="border-t border-[var(--line)] align-top">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{r.l.desc}{r.l.sow ? `, ${r.l.sow}` : ""}</td>
                  <td className="p-2 text-right num">{r.l.qty} × {inr(r.l.rate)}</td>
                  <td className="p-2 text-right num">{inr(r.amount)}</td>
                  <td className={`p-2 ${st.cls}`}>{st.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm num text-right">Before GST {inr(res.totals.sub)} · GST {inr(res.totals.gst)} · Total {inr(res.totals.total)}</p>
    </div>
  );
}
