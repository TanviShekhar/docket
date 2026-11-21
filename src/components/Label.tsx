import { useState } from "react";

// Honesty labels (CLAUDE.md section 6). Exactly one per result. Tap to read what it means.
export type LabelKind = "ai" | "calculated" | "simulated" | "rules" | "template" | "input";

export const LABEL_KINDS: LabelKind[] = ["ai", "calculated", "simulated", "rules", "template", "input"];
export const NAME: Record<LabelKind, string> = {
  ai: "Recorded AI run", calculated: "Calculated", simulated: "Simulated data",
  rules: "Rule-based reader", template: "Template", input: "Your input",
};
export const TEXT: Record<LabelKind, string> = {
  ai: "Claude Opus 5.5 read this document on 22 Nov 2026 while Docket was being built. Output stored unedited.",
  calculated: "Worked out by Docket's tested calculation code, not by AI.",
  simulated: "Made-up data standing in for a real system.",
  rules: "Found by fixed rules, not by AI.",
  template: "A drafted letter or email. A person sends it.",
  input: "A value you set.",
};

export default function Label({ kind, source }: { kind: LabelKind; source?: string }) {
  const [open, setOpen] = useState(false);
  const text = kind === "simulated" && source ? `${TEXT[kind]} Assumed source: ${source}.` : TEXT[kind];
  return (
    <span className="inline-block align-middle">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} title={text}
        className="min-h-[24px] px-2 rounded-full border border-[var(--line)] text-xs text-[var(--muted)]">
        {NAME[kind]}
      </button>
      {open && <span className="ml-2 text-xs text-[var(--muted)]">{text}</span>}
    </span>
  );
}
