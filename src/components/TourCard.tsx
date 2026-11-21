import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CHAPTERS, useTour } from "../lib/tour";
import { useStore, useToast } from "../lib/store";

// Sits at the bottom of the screen. It never covers the page: the app leaves room beneath it.
export default function TourCard() {
  const { open, chapter, step, pick, go, end } = useTour();
  const nav = useNavigate();
  const show = useToast((t) => t.show);
  const lastKey = useRef("");

  const ch = chapter === null ? null : CHAPTERS[chapter];
  const s = ch && step < ch.steps.length ? ch.steps[step] : null;

  // Moving to a step opens its page as the right person.
  useEffect(() => {
    if (!open || chapter === null) lastKey.current = "";
    if (!s) return;
    const key = `${chapter}:${step}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    if (s.role) useStore.getState().setRole(s.role);
    nav(s.route);
  }, [s, open, chapter, step, nav]);

  if (!open) return null;
  const btn = "min-h-[44px] px-4 rounded-lg border border-[var(--line)] text-sm";

  const doIt = () => {
    if (!s?.run) return;
    if (s.isDone?.(useStore.getState())) show("Already done.");
    else show(s.run());
    if (s.then) nav(s.then);
  };
  // The History step opens the section so the swimlane is visible.
  const openHistory = () => [...document.querySelectorAll("summary")].find((x) => x.textContent?.startsWith("History"))?.parentElement?.setAttribute("open", "");

  return (
    <section role="region" aria-label="Guided tour" className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--line)] bg-[var(--bg)] shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-4xl px-4 py-3">
        {!ch ? (
          <>
            <p className="font-semibold">Take the tour. Pick a chapter.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CHAPTERS.map((c, i) => <button key={c.name} type="button" onClick={() => pick(i)} className={`${btn} text-left`}><span className="font-semibold">{i + 1}. {c.name}</span><span className="block text-xs text-[var(--muted)]">{c.blurb}</span></button>)}
              <button type="button" onClick={end} className={`${btn} underline border-transparent`}>End tour</button>
            </div>
          </>
        ) : s ? (
          <>
            <p className="text-xs text-[var(--muted)]">{ch.name}, step {step + 1} of {ch.steps.length}</p>
            <p className="mt-1">{s.text}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={() => (step === 0 ? useTour.setState({ chapter: null, step: 0 }) : go(step - 1))}>Back</button>
              <button type="button" className={`${btn} bg-navy text-white border-navy`} onClick={() => go(step + 1)}>Next</button>
              {s.run && <button type="button" className={btn} onClick={doIt}>Do it for me</button>}
              {s.text.startsWith("Open History") && <button type="button" className={btn} onClick={openHistory}>Open History</button>}
              <button type="button" className={`${btn} underline border-transparent`} onClick={end}>End tour</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-[var(--muted)]">{ch.name}, finished</p>
            <p className="mt-1 font-semibold">{ch.end}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={() => go(ch.steps.length - 1)}>Back</button>
              {CHAPTERS.map((c, i) => i !== chapter && <button key={c.name} type="button" className={btn} onClick={() => { lastKey.current = ""; pick(i); }}>Chapter {i + 1}: {c.name}</button>)}
              <button type="button" className={`${btn} underline border-transparent`} onClick={end}>End tour</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
