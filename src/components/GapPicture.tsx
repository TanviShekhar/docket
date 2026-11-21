import { inr } from "../lib/engine";
import { contractRate, invoiceRate } from "../lib/todo";
import Label from "./Label";
import { useStore } from "../lib/store";

// The one picture: contract rate vs invoice rate. The gap fades to teal once the credit note is recorded.
export default function GapPicture() {
  const credited = useStore((s) => !!s.done.A9);
  const contract = contractRate(), invoice = invoiceRate(), over = invoice - contract;
  const pct = (n: number) => `${(n / invoice) * 100}%`;
  return (
    <figure className="mt-6 max-w-3xl" aria-label={`Contract says ${inr(contract)} per hour. Invoice says ${inr(invoice)} per hour.`}>
      <div className="space-y-3">
        <div>
          <div className="text-sm mb-1 num">Contract says {inr(contract)}/hr</div>
          <div className="h-8"><div className="h-8 rounded bg-bar" style={{ width: pct(contract) }} /></div>
        </div>
        <div>
          <div className="text-sm mb-1 num">Invoice says {inr(invoice)}/hr</div>
          <div className="flex h-8 rounded overflow-hidden">
            <div className="bg-bar" style={{ width: pct(contract) }} />
            <div className={`transition-colors duration-700 motion-reduce:transition-none ${credited ? "bg-ok" : "bg-gap"}`} style={{ width: pct(over) }} />
          </div>
          <div className="text-sm mt-1 num text-right">
            <span className={credited ? "text-ok" : "text-gap"}>{credited ? "Credit received" : `${inr(over)}/hr over`}</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-[var(--muted)]"><Label kind="calculated" /></figcaption>
    </figure>
  );
}
