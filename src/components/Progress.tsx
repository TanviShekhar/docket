// Plain-words progress bar, specific to the item.
export default function Progress({ steps, doneCount }: { steps: string[]; doneCount: number }) {
  return (
    <ol className="flex flex-wrap gap-x-2 gap-y-2 text-sm" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < doneCount, current = i === doneCount;
        return (
          <li key={s} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
            <span className={`inline-flex items-center rounded-full px-3 min-h-[32px] border ${done ? "bg-[#15803d] text-white border-[#15803d]" : current ? "border-navy font-semibold" : "border-[var(--line)] text-[var(--muted)]"}`}>
              {done ? "Done: " : ""}{s}
            </span>
            {i < steps.length - 1 && <span aria-hidden className="text-[var(--muted)]">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
