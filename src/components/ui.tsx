import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Role } from "../lib/data";
import { useStore } from "../lib/store";
import Label, { type LabelKind } from "./Label";

export const Primary = ({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) => (
  <button type="button" disabled={disabled} onClick={onClick} className="min-h-[44px] px-4 py-2 rounded-lg bg-navy text-white font-semibold text-left leading-snug disabled:opacity-50">{children}</button>
);
export const Secondary = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="min-h-[44px] px-2 underline">{children}</button>
);

export function ProofCard({ title, label, children }: { title: string; label?: { kind: LabelKind; source?: string }; children: ReactNode }) {
  return (
    <div className="border border-[var(--line)] rounded-lg p-4">
      <h3 className="text-base">{title} {label && <Label kind={label.kind} source={label.source} />}</h3>
      <div className="mt-2 space-y-2 text-sm">{children}</div>
    </div>
  );
}
export const Quote = ({ text, from }: { text: string; from: string }) => (
  <div><blockquote>"{text}"</blockquote><p className="text-xs text-[var(--muted)] mt-1">{from}</p></div>
);

const TITLE: Record<Role, string> = { finance: "Finance", legal: "Legal", procurement: "Procurement", owner: "the business owner", supplier: "the supplier" };
const SWITCH: Record<Role, string> = { finance: "Finance", legal: "Legal", procurement: "Procurement", owner: "Business owner", supplier: "Supplier" };

// The wrong-role rule: never grey out a button. Explain, and switch in one tap.
export function Gate({ owner, done, doneNode, children, needsA1 }: { owner: Role; done: boolean; doneNode: ReactNode; children: ReactNode; needsA1?: boolean }) {
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const rateChecked = useStore((s) => !!s.done.A1);
  if (done) return <>{doneNode}</>;
  // TalentBridge steps depend on Legal checking the new rate first.
  if (needsA1 && !rateChecked) {
    return (
      <div>
        <p>Locked: waiting for Legal to check the rate. Nothing can be disputed until then.</p>
        {role === "legal"
          ? <Link to="/item/A1" className="mt-3 inline-flex items-center min-h-[44px] px-4 rounded-lg bg-navy text-white font-semibold">Go to the rate check</Link>
          : <button type="button" onClick={() => setRole("legal")} className="mt-3 min-h-[44px] px-4 rounded-lg bg-navy text-white font-semibold">This step is for Legal. Switch to Legal</button>}
      </div>
    );
  }
  if (owner === "supplier" && role !== "supplier") {
    return <p>Waiting for the supplier. They respond from their own portal, which staff cannot switch into.</p>;
  }
  if (role !== owner) {
    return (
      <div>
        <p>Only {TITLE[owner]} can do this step.</p>
        <button type="button" onClick={() => setRole(owner)} className="mt-3 min-h-[44px] px-4 rounded-lg bg-navy text-white font-semibold">
          This step is for {TITLE[owner]}. Switch to {SWITCH[owner]}
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

// ---------- "See how Docket worked this out": short labelled rows, never run-on paragraphs ----------
export const HowCard = ({ title, label, children }: { title: string; label?: LabelKind; children: ReactNode }) => (
  <div>
    <h3 className="text-base flex flex-wrap items-center gap-2">{title} {label && <Label kind={label} />}</h3>
    <div className="mt-2 space-y-2.5">{children}</div>
  </div>
);
export const Row = ({ k, children }: { k: string; children: ReactNode }) => (
  <div><div className="text-xs font-semibold text-[var(--muted)]">{k}</div><div>{children}</div></div>
);
export function AiRead({ field, value, confidence, flag, evidenceOk, why, title = "What the AI read", children }: { field?: string; value: ReactNode; confidence: number; flag?: string; evidenceOk: boolean; why?: string; title?: string; children?: ReactNode }) {
  return (
    <HowCard title={title} label="ai">
      {field && <Row k="Field">{field}</Row>}
      <Row k="Value">{value}</Row>
      <Row k="Confidence">{Math.round(confidence * 100)}%</Row>
      {flag && <Row k="Flag">{flag}</Row>}
      <Row k="Evidence check">
        <span className={evidenceOk ? "text-ok" : "text-gap"} aria-hidden>{evidenceOk ? "✓" : "✗"}</span> {evidenceOk ? "Quote found in the document" : "Quote not found in the document"}
        <span className="block text-[var(--muted)]">This proves the quote exists, not that its meaning was read correctly</span>
      </Row>
      {why && <Row k="Why">{why}</Row>}
      {children}
    </HowCard>
  );
}
