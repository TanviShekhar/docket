import { useState } from "react";
import { MESSY_RUN, MESSY_SAMPLE } from "../lib/aiRuns";
import { grounded, ruleParse } from "../lib/engine";
import Label from "./Label";

// "Read a contract": paste text and see what each reader finds. There is no live AI on this site.
export default function ReadContract() {
  const [text, setText] = useState(MESSY_SAMPLE);
  const unchanged = text === MESSY_SAMPLE;
  const found = ruleParse(text);
  return (
    <section className="mt-10" aria-labelledby="read">
      <h2 id="read" className="text-2xl">Read a contract</h2>
      <p className="mt-1 text-sm text-[var(--muted)] max-w-3xl">A deliberately messy sample, fictional. Change the text to see the rule-based reader work on anything you type.</p>
      <label htmlFor="rc" className="sr-only">Contract text</label>
      <textarea id="rc" value={text} onChange={(e) => setText(e.target.value)} rows={9}
        className="mt-3 w-full border border-[var(--line)] rounded-lg p-3 text-sm bg-transparent" />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="border border-[var(--line)] rounded-lg p-4 text-sm">
          <h3 className="text-base">AI reading {unchanged && <Label kind="ai" />}</h3>
          {unchanged ? (
            <ul className="mt-2 space-y-3">
              {MESSY_RUN.map((f, i) => (
                <li key={i}>
                  <p className="font-semibold">{f.field}: {f.value}</p>
                  <p className="text-[var(--muted)]">"{f.quote}" Confidence {Math.round(f.confidence * 100)}%{f.flag ? ` · Flag: ${f.flag}` : ""}</p>
                  <p><span aria-hidden className={grounded(text, f.quote) ? "text-ok" : "text-gap"}>{grounded(text, f.quote) ? "✓" : "✗"}</span> {grounded(text, f.quote) ? "Quote found in the text. This proves the quote exists, not that its meaning was read correctly." : "Quote not found in the text."}</p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2">Live AI is not connected on this site. The rule-based reader below still works on any text.</p>}
        </div>
        <div className="border border-[var(--line)] rounded-lg p-4 text-sm">
          <h3 className="text-base">Rule-based reader <Label kind="rules" /></h3>
          {found.length === 0 ? <p className="mt-2">Nothing found in this text.</p> : (
            <ul className="mt-2 space-y-3">
              {found.map((f, i) => (
                <li key={i}>
                  <p className="font-semibold">{f.type}: {f.value}</p>
                  <p className="text-[var(--muted)]">"{f.quote}"</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
