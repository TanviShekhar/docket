import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { downloadCsv, type DataFile } from "../lib/csv";
import { filesFor } from "../lib/dataFiles";
import { useStore } from "../lib/store";
import { allCards, escalationText } from "../lib/todo";
import History from "./History";
import Progress from "./Progress";

// The one pattern for every item: progress, what happened, the proof, what to do, how it was worked out, history.
// On a laptop it is two columns (what to do on the left, the proof on the right) so there is little scrolling.
// Open steps show their reminder and escalation line automatically (on track, reminder sent, or escalated).
export default function ItemFrame(p: { crumb: string; title: string; progress?: { steps: string[]; doneCount: number }; what: ReactNode; proof: ReactNode; action: ReactNode; how?: ReactNode; caseId: string; status?: string; files?: DataFile[] }) {
  const { id } = useParams();
  const snap = useStore();
  const card = allCards(snap).find((c) => c.id === id);
  const status = p.status ?? (card ? escalationText(card) : null);
  const files = p.files ?? filesFor(id ?? "", snap);
  return (
    <main className="page py-6">
      <nav className="text-sm"><Link to="/" className="underline">To-do</Link> / {p.crumb}</nav>
      <h1 className="mt-3 text-xl md:text-[1.7rem] leading-tight max-w-5xl">{p.title}</h1>
      {status && <p className="mt-2 text-sm text-[var(--muted)]">{status}</p>}
      {p.progress && <div className="mt-4" data-tour="progress"><Progress steps={p.progress.steps} doneCount={p.progress.doneCount} /></div>}

      <div className="item-grid mt-6">
        <section className="ig-what" aria-labelledby="s1" data-tour="what"><h2 id="s1" className="text-xl">What happened</h2><div className="mt-2 space-y-2">{p.what}</div></section>
        <section className="ig-proof" aria-labelledby="s2" data-tour="proof"><h2 id="s2" className="text-xl">The proof</h2><div className="mt-3">{p.proof}</div></section>
        <section className="ig-action" aria-labelledby="s3" data-tour="action"><h2 id="s3" className="text-xl">What to do</h2><div className="mt-2">{p.action}</div></section>
        {p.how && (
          <details className="ig-how panel" data-tour="how">
            <summary className="cursor-pointer min-h-[44px] flex items-center justify-between gap-2 font-semibold">See how Docket worked this out<span aria-hidden className="text-[var(--muted)]">+</span></summary>
            <div className="mt-2 grid gap-3 md:grid-cols-2 text-sm [&>*]:rounded-lg [&>*]:border [&>*]:border-[var(--line)] [&>*]:p-3">{p.how}</div>
          </details>
        )}
        {files.length > 0 && (
          <section className="ig-files panel" aria-labelledby="s4" data-tour="files">
            <h2 id="s4" className="text-base font-semibold">Check it yourself in Excel</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">These files hold the same data as this page. They open in Excel.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f) => <button key={f.name} type="button" onClick={() => downloadCsv(f)} className="min-h-[44px] px-3 rounded-lg border border-[var(--line)] text-sm hover:underline">Download {f.name}.csv</button>)}
            </div>
          </section>
        )}
        <div className="ig-history" data-tour="history"><History caseId={p.caseId} /></div>
      </div>
    </main>
  );
}
