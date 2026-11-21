import { useEffect, useRef } from "react";
import { AI_RUNS } from "../lib/aiRuns";
import { DOCS, type Term } from "../lib/data";
import { grounded, inr, nice, type Candidate } from "../lib/engine";
import Label from "./Label";

export const STATE_TEXT: Record<Term["state"], string> = {
  verified: "Checked by Legal", unverified: "Not checked yet", ambiguous: "Needs a Legal reading",
  "not-measurable": "No way to measure this", rejected: "Rejected by Legal",
};

export function fmtTerm(t: Term): string {
  if (typeof t.value !== "number") return String(t.value);
  if (t.unit === "%") return `${t.value}%`;
  if (t.unit.startsWith("INR")) return `${inr(t.value)}${t.unit.slice(3)}`;
  return `${t.value} ${t.unit}`;
}

// Opens from a row in "Terms in force today". Shows exactly where the term came from and why it wins.
export default function EvidenceDrawer({ term, cands, onClose }: { term: Term; cands: Candidate[]; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const doc = DOCS.find((d) => d.id === term.doc)!;
  const clause = doc.clauses.find((c) => c.ref === term.ref) ?? doc.clauses[0];
  const fields = AI_RUNS[doc.id] ?? [];
  const ai = fields.find((f) => f.clause === clause.ref && f.field.toLowerCase() === term.label.toLowerCase()) ?? fields.find((f) => f.clause === clause.ref);
  const text = doc.clauses.map((c) => c.text).join("\n");

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label={`Evidence for ${term.label}`} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-full overflow-y-auto bg-[var(--bg)] border-l border-[var(--line)] p-5 text-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl">{term.label}</h2>
          <button ref={closeRef} type="button" onClick={onClose} className="min-h-[44px] px-3 rounded-lg border border-[var(--line)]">Close</button>
        </div>
        <section>
          <h3 className="text-base">What the document says</h3>
          <blockquote className="mt-1">"{clause.text}"</blockquote>
          <p className="mt-1 text-[var(--muted)]">{doc.title}, page {clause.page}, clause {clause.ref}</p>
          <p className="text-[var(--muted)]">{doc.source}</p>
        </section>
        <section>
          <h3 className="text-base">What the AI read <Label kind="ai" /></h3>
          {ai ? (<>
            <p>{ai.field}: {ai.value}. Confidence {Math.round(ai.confidence * 100)}%.{ai.flag ? ` Flag: ${ai.flag}` : ""}</p>
            <p className="mt-1">Evidence check: {grounded(text, ai.quote) ? "Quote found in the document." : "Quote NOT found in the document."} This proves the quote exists, not that its meaning was read correctly.</p>
          </>) : <p>No recorded AI run for this term.</p>}
        </section>
        <section>
          <h3 className="text-base">Who checked it</h3>
          <p>{STATE_TEXT[term.state]}{term.by ? ` by ${term.by}, ${nice(term.at!)}` : ""}.{term.why ? ` ${term.why}` : ""}</p>
        </section>
        <section>
          <h3 className="text-base">Why this term wins <Label kind="calculated" /></h3>
          <ul className="mt-1 space-y-1">
            {cands.map((c) => (
              <li key={c.t.id}><span className="num">{fmtTerm(c.t)}</span>, {c.doc.title}: {c.reason ?? "this one counts"}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
