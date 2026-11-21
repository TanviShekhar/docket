import { PEOPLE, type Role } from "../lib/data";
import { useStore } from "../lib/store";

const LANES: Role[] = ["legal", "finance", "procurement", "owner", "supplier"];
const LANE_NAME: Record<Role, string> = { legal: "Legal", finance: "Finance", procurement: "Procurement", owner: "Business owner", supplier: "Supplier" };

// Swimlane of who did what, built from the event log.
export default function History({ caseId }: { caseId: string }) {
  const events = useStore((s) => s.events).filter((e) => e.caseId === caseId);
  return (
    <details className="mt-6 border border-[var(--line)] rounded-lg p-4">
      <summary className="cursor-pointer min-h-[44px] flex items-center font-semibold">History ({events.length})</summary>
      <p className="text-sm text-[var(--muted)]">Saved in this browser only. A real rollout keeps this log on a secure server.</p>
      <div className="mt-3 space-y-3">
        {LANES.map((r) => {
          const mine = events.filter((e) => e.role === r);
          return (
            <div key={r} className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-1 sm:gap-3 border-t border-[var(--line)] pt-2">
              <div className="text-sm font-semibold">{LANE_NAME[r]}<span className="block font-normal text-xs text-[var(--muted)]">{PEOPLE[r].name}</span></div>
              {mine.length === 0 ? <p className="text-sm text-[var(--muted)]">Nothing yet</p> : (
                <ul className="space-y-1 text-sm">
                  {mine.map((e, i) => <li key={i}><span className="num text-[var(--muted)]">{e.at}</span> {e.action}. <span className="text-[var(--muted)]">Evidence: {e.evidence}.</span></li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}
