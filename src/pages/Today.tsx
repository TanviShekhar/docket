import { Link } from "react-router-dom";
import { PEOPLE } from "../lib/data";
import { inr } from "../lib/engine";
import { useStore } from "../lib/store";
import { valueTotals } from "../lib/ledger";
import { allCards, contractRate, invoiceRate, sortCards } from "../lib/todo";
import Label from "../components/Label";
import GapPicture from "../components/GapPicture";
import TodoCard from "../components/TodoCard";

export default function Today() {
  const snap = useStore();
  const { role, notices, dismissNotice } = snap;
  const cards = allCards(snap);
  // The supplier only ever sees TalentBridge items.
  const visible = role === "supplier" ? cards.filter((c) => c.caseId === "A") : cards;
  const mine = sortCards(visible.filter((c) => c.owner === role), role);
  const others = sortCards(visible.filter((c) => c.owner !== role), role);
  const t = valueTotals(snap);
  const myNotices = notices.filter((n) => n.to === role);
  const both = (one: number, yr: number) => `${inr(one)} one-off, ${inr(yr)} a year`;
  const wide = typeof matchMedia !== "undefined" && matchMedia("(min-width: 1024px)").matches;

  return (
    <main className="page py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center">
        <div>
          <h1 className="text-3xl md:text-4xl leading-tight">
            Contract says <span className="num">{inr(contractRate())}</span>. Invoice says <span className="num">{inr(invoiceRate())}</span>. Docket finds the gap, proves it and helps you recover it.
          </h1>
          <p className="mt-3 max-w-3xl text-[var(--muted)]">
            Most contract repositories tell you what a contract says. Docket tells you which terms apply, whether suppliers follow them, and what to do when they don't.
          </p>
        </div>
        <div data-tour="gap" className="rounded-xl border border-[var(--line)] p-4"><GapPicture /></div>
      </div>

      <p data-tour="strip" className="mt-5 text-sm border-y border-[var(--line)] py-3">
        <span className="font-semibold">Confirmed so far:</span> <span className="num">{both(t.confirmedOneOff, t.confirmedAnnual)}</span>
        <span className="mx-2" aria-hidden>·</span>
        <span className="font-semibold">In progress:</span> <span className="num">{both(t.progressOneOff, t.progressAnnual)}</span>
        <span className="mx-2" aria-hidden>·</span>
        <Link to="/value" className="underline">See the Value screen</Link> <Label kind="calculated" />
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
        <div>
          {myNotices.length > 0 && (
            <section className="mb-8" aria-label="New for you" data-tour="notices">
              <ul className="space-y-3">
                {myNotices.map((n) => (
                  <li key={n.id} className="border border-[var(--line)] rounded-lg p-4 flex flex-wrap items-center justify-between gap-2">
                    <span><span className="font-semibold">New from {n.from}:</span> {n.text}</span>
                    <span className="flex items-center">
                      {n.link && <Link to={n.link} className="inline-flex items-center min-h-[44px] px-3 underline">Open</Link>}
                      <button type="button" onClick={() => dismissNotice(n.id)} className="min-h-[44px] px-3 underline">Got it</button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="todo-h" data-tour="todo">
            <h2 id="todo-h" className="text-2xl">Your to-do</h2>
            <p className="text-sm text-[var(--muted)] mt-1">{PEOPLE[role].name}, {PEOPLE[role].title}</p>
            {role === "legal" && <p className="mt-2 text-sm">Legal checks a term the first time money or a deadline depends on it.</p>}
            {mine.length === 0
              ? <p className="mt-4">Nothing waiting on you. Switch role to see what others are doing.</p>
              : <ul className="mt-4 space-y-3">{mine.map((c) => <TodoCard key={c.id} c={c} viewer={role} />)}</ul>}
            {role === "legal" && <p className="mt-3 text-sm text-[var(--muted)]">Not on your list: Amendment 1 is unsigned, so it doesn't count.</p>}
          </section>
        </div>

        <details className="panel" open={wide}>
          <summary className="cursor-pointer min-h-[44px] flex items-center text-lg font-semibold">Waiting on others ({others.length})</summary>
          {others.length === 0
            ? <p className="mt-2">Nobody else has open work.</p>
            : <ul className="mt-3 space-y-3">{others.map((c) => <TodoCard key={c.id} c={c} viewer={role} />)}</ul>}
        </details>
      </div>
    </main>
  );
}
