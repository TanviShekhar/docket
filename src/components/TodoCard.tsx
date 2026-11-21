import { Link } from "react-router-dom";
import { inr } from "../lib/engine";
import { ROLE_NAME } from "../lib/copy";
import { escalationText, type Card } from "../lib/todo";
import type { Role } from "../lib/data";

export default function TodoCard({ c, viewer }: { c: Card; viewer: Role }) {
  const mine = c.owner === viewer;
  const esc = escalationText(c);
  return (
    <li className="border border-[var(--line)] rounded-lg p-4">
      <p className="font-semibold">{c.headline}</p>
      <p className="mt-1 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
        {c.amount ? <span className="num text-gap font-semibold">{inr(c.amount)} at stake</span> : null}
        {c.amount ? <span aria-hidden>·</span> : null}
        <span>{c.dueText}</span>
        <span aria-hidden>·</span>
        {mine
          ? <Link to={`/item/${c.id}`} className="inline-flex items-center min-h-[44px] px-3 rounded-lg bg-navy text-white font-semibold">Review</Link>
          : <Link to={`/item/${c.id}`} className="inline-flex items-center min-h-[44px] underline">Waiting on {ROLE_NAME[c.owner]}. View</Link>}
      </p>
      {c.prio && <p className="mt-1 text-xs text-[var(--muted)] num">Priority {c.prio.total}: money {c.prio.impact}, urgency {c.prio.time}, uncertainty {c.prio.unc} (each out of 5)</p>}
      {esc && <p className="mt-1 text-sm text-[var(--muted)]">{esc}</p>}
    </li>
  );
}
