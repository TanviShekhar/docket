import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { allCards, escalationText } from "../lib/todo";
import History from "./History";
import Progress from "./Progress";

// The one pattern for every item: progress, what happened, the proof, what to do, how it was worked out, history.
// Open steps show their reminder and escalation line automatically (on track, reminder sent, or escalated).
export default function ItemFrame(p: { crumb: string; title: string; progress?: { steps: string[]; doneCount: number }; what: ReactNode; proof: ReactNode; action: ReactNode; how?: ReactNode; caseId: string; status?: string }) {
  const { id } = useParams();
  const snap = useStore();
  const card = allCards(snap).find((c) => c.id === id);
  const status = p.status ?? (card ? escalationText(card) : null);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <nav className="text-sm"><Link to="/" className="underline">To-do</Link> / {p.crumb}</nav>
      <h1 className="mt-3 text-3xl leading-tight">{p.title}</h1>
      {status && <p className="mt-2 text-sm text-[var(--muted)]">{status}</p>}
      {p.progress && <div className="mt-4"><Progress steps={p.progress.steps} doneCount={p.progress.doneCount} /></div>}
      <section className="mt-8" aria-labelledby="s1"><h2 id="s1" className="text-xl">What happened</h2><div className="mt-2 space-y-2">{p.what}</div></section>
      <section className="mt-8" aria-labelledby="s2"><h2 id="s2" className="text-xl">The proof</h2><div className="mt-3">{p.proof}</div></section>
      <section className="mt-8" aria-labelledby="s3"><h2 id="s3" className="text-xl">What to do</h2><div className="mt-2">{p.action}</div></section>
      {p.how && (
        <details className="mt-8 border border-[var(--line)] rounded-lg p-4">
          <summary className="cursor-pointer min-h-[44px] flex items-center font-semibold">See how Docket worked this out</summary>
          <div className="space-y-5 text-sm">{p.how}</div>
        </details>
      )}
      <History caseId={p.caseId} />
    </main>
  );
}
