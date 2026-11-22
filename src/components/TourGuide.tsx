import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHAPTERS, useTour } from "../lib/tour";
import { useStore, useToast } from "../lib/store";

type Box = { x: number; y: number; w: number; h: number } | null;

// A ring and a numbered pin on the area being explained. It follows the area as the page scrolls.
function Ring({ target, n }: { target?: string; n: number }) {
  const [box, setBox] = useState<Box>(null);
  useEffect(() => {
    if (!target) { setBox(null); return; }
    let raf = 0, timer = 0, tries = 0, scrolled = false;
        const tick = () => {
      const el = document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (!scrolled) {
          scrolled = true;
          // Bring the area just below the top bar. Opening the guide can make the bar wrap, so the bar is measured
          // at the moment of scrolling, and a second pass corrects anything that shifted while the page settled.
          const align = (behavior: ScrollBehavior) => {
            const node = document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null;
            if (!node) return;
            const bar = matchMedia("(min-width: 768px)").matches ? (document.querySelector("header")?.getBoundingClientRect().height ?? 0) : 0;
            const top = node.getBoundingClientRect().top + window.scrollY - bar - 16;
            if (behavior === "auto" && node.getBoundingClientRect().top >= bar) return; // already clear of the bar
            window.scrollTo({ top: Math.max(0, top), behavior });
          };
          timer = window.setTimeout(() => { align("auto"); timer = window.setTimeout(() => align("auto"), 500); }, 250); // instant, so a long smooth scroll never ends up in the wrong place
        }
        setBox((b) => (b && b.x === r.left && b.y === r.top && b.w === r.width && b.h === r.height ? b : { x: r.left, y: r.top, w: r.width, h: r.height }));
      } else if (++tries > 40) setBox(null);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [target, n]);
  if (!box) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed z-30" style={{ left: box.x - 8, top: box.y - 8, width: box.w + 16, height: box.h + 16 }}>
      <div className="absolute inset-0 rounded-xl" style={{ border: "3px solid var(--tour)" }} />
      <div className="absolute -left-3 -top-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: "var(--tour)", color: "var(--tourtext)", border: "2px solid var(--bg)" }}>{n}</div>
    </div>
  );
}

export default function TourGuide() {
  const { open, chapter, step, leaving, pick, go, end } = useTour();
  const nav = useNavigate();
  const show = useToast((t) => t.show);
  const lastKey = useRef("");
  const ch = chapter === null ? null : CHAPTERS[chapter];
  const s = ch && step < ch.steps.length ? ch.steps[step] : null;

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
  const primary = `${btn} bg-navy text-white border-navy font-semibold`;

  // The chapter picker is the one centred moment, with the page softly dimmed behind it.
  if (!ch) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35" role="dialog" aria-modal="true" aria-label="Choose a tour chapter">
        <div className="w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl">Take the tour</h2>
          <p className="mt-1 text-[var(--muted)]">Pick a chapter. Each one walks through a real case, step by step, and points at what to look at.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CHAPTERS.map((c, i) => (
              <button key={c.name} type="button" onClick={() => pick(i)} className="text-left rounded-xl border border-[var(--line)] p-4 hover:border-[var(--tour)] min-h-[44px]">
                <span className="font-semibold">{i + 1}. {c.name}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{c.blurb}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 text-right"><button type="button" onClick={end} className={`${btn} underline border-transparent`}>Not now</button></div>
        </div>
      </div>
    );
  }

  const doIt = () => {
    if (!s?.run) return;
    if (s.isDone?.(useStore.getState())) show("Already done.");
    else show(s.run());
    if (s.then) nav(s.then);
  };
  const total = ch.steps.length;

  return (
    <>
      {s && <Ring target={s.target} n={step + 1} key={`${chapter}:${step}`} />}
      <aside role="region" aria-label="Guided tour"
        className="fixed z-50 tour-panel border-[var(--line)] inset-x-0 bottom-0 max-h-[55vh] border-t overflow-y-auto lg:inset-x-auto lg:right-0 lg:top-0 lg:bottom-0 lg:w-[22rem] lg:max-h-none lg:border-t-0 lg:border-l">
        <div className="p-4 flex flex-col gap-3 min-h-full">
          <div>
            <p className="text-xs text-[var(--muted)]">Guided tour: {ch.name}</p>
            <div className="mt-2 flex gap-1" aria-label={`Step ${Math.min(step + 1, total)} of ${total}`}>
              {ch.steps.map((_, i) => <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? "var(--tour)" : "var(--line)" }} />)}
            </div>
          </div>

          {leaving ? (
            <div>
              <h3 className="text-lg">Leave the tour?</h3>
              <p className="mt-1 text-sm">You can restart it any time from "Take the tour".</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={primary} onClick={() => { const to = leaving; end(); nav(to); }}>Leave the tour</button>
                <button type="button" className={btn} onClick={() => useTour.setState({ leaving: null })}>Stay</button>
              </div>
            </div>
          ) : s ? (
            <>
              <div>
                <p className="text-xs text-[var(--muted)]">Step {step + 1} of {total}{s.target ? ", pointing at the ringed area" : ""}</p>
                <h3 className="mt-1 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm">{s.text}</p>
              </div>
              {s.points && (
                <dl className="space-y-2 text-sm">
                  {s.points.map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-[var(--line)] p-2"><dt className="font-semibold">{k}</dt><dd className="text-[var(--muted)]">{Array.isArray(v) ? v.map((l) => <p key={l} className="mt-1">{l}</p>) : v}</dd></div>
                  ))}
                </dl>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <button type="button" className={btn} onClick={() => (step === 0 ? useTour.setState({ chapter: null, step: 0 }) : go(step - 1))}>Back</button>
                <button type="button" className={primary} onClick={() => go(step + 1)}>Next</button>
                {s.run && <button type="button" className={btn} onClick={doIt}>Do it for me</button>}
                <button type="button" className={`${btn} underline border-transparent`} onClick={end}>End tour</button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-lg">{ch.name} finished</h3>
                <p className="mt-2 text-sm font-semibold">{ch.end}</p>
              </div>
              <div className="mt-auto flex flex-col gap-2">
                {CHAPTERS.map((c, i) => i !== chapter && <button key={c.name} type="button" className={btn} onClick={() => { lastKey.current = ""; pick(i); }}>Chapter {i + 1}: {c.name}</button>)}
                <button type="button" className={btn} onClick={() => go(total - 1)}>Back</button>
                <button type="button" className={primary} onClick={end}>End tour</button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
