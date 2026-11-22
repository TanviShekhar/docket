import { useState } from "react";
import { Link } from "react-router-dom";
import { DEMO_TODAY, SUPPLIERS } from "../lib/data";
import { dmy } from "../lib/copy";
import { monthTicks, pctOf, timeline, URGENCY_TEXT, type IconKind, type Marker, type Urgency } from "../lib/timeline";
import { useStore } from "../lib/store";
import Label from "./Label";

const FILL: Record<Urgency, string> = { now: "#b91c1c", soon: "#b45309", ok: "#15803d", done: "#64748b", past: "#64748b" };
const PILL: Record<Urgency, string> = { now: "urg-now", soon: "pill-wait", ok: "pill-ok", done: "urg-grey", past: "urg-grey" };

export function TlIcon({ kind, size = 16 }: { kind: IconKind; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (kind) {
    case "bell": return <svg {...p}><path d="M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    case "refresh": return <svg {...p}><path d="M20 11a8 8 0 0 0-14-4L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14 4l2-2" /><path d="M20 20v-5h-5" /></svg>;
    case "calendar": return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case "tick": return <svg {...p}><path d="M5 12.5l4.5 4.5L19 7" /></svg>;
    case "warning": return <svg {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  }
}

const LEGEND: [IconKind, string][] = [["bell", "Notice deadline"], ["refresh", "Auto-renewal"], ["calendar", "End date"], ["warning", "Decision needed"], ["clock", "Claim window"], ["tick", "Signed"]];

export default function Timeline() {
  const snap = useStore();
  const tl = timeline(snap);
  const [sel, setSel] = useState<string | null>(null);
  const picked = tl.markers.find((m) => m.id === sel) ?? null;
  const pickedBar = tl.bars.find((b) => b.id === sel) ?? null;
  const ticks = monthTicks(tl);
  const todayPct = pctOf(DEMO_TODAY, tl);
  const LANE = 30;

  const detail = picked ? (
    <div className="mt-4 rounded-xl border border-[var(--line)] p-4" role="status">
      <p className="flex flex-wrap items-center gap-2 font-semibold"><span style={{ color: FILL[picked.urgency] }}><TlIcon kind={picked.icon} size={20} /></span>{picked.title}
        <span className={`pill ${PILL[picked.urgency]}`}>{URGENCY_TEXT[picked.urgency]}</span></p>
      <p className="mt-1 text-sm"><span className="num font-semibold">{dmy(picked.date)}</span> {picked.days >= 0 ? `(in ${picked.days} days)` : `(${-picked.days} days ago)`}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{picked.detail}</p>
      {picked.link && <Link to={picked.link} className="mt-1 inline-flex items-center min-h-[44px] underline text-sm">Open the related item</Link>}
    </div>
  ) : pickedBar ? (
    <div className="mt-4 rounded-xl border border-[var(--line)] p-4" role="status">
      <p className="font-semibold">{pickedBar.title}</p>
      <p className="mt-1 text-sm"><span className="num">{dmy(pickedBar.from)}</span> to <span className="num">{pickedBar.to ? dmy(pickedBar.to) : "no end date"}</span></p>
      <p className="mt-1 text-sm text-[var(--muted)]">{pickedBar.signed ? "Signed by both parties." : "Not signed by both parties, so it does not count."} {pickedBar.source}</p>
    </div>
  ) : null;

  return (
    <div className="mt-6">
      <h2 className="text-2xl">Timeline <Label kind="calculated" /></h2>
      <p className="mt-1 text-sm text-[var(--muted)] max-w-3xl">Every contract on one time axis, with the dates that need someone to act. Today is {dmy(DEMO_TODAY)}. All dates are worked out from the contracts.</p>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legend">
        {LEGEND.map(([k, l]) => <li key={k} className="inline-flex items-center gap-1.5"><TlIcon kind={k} size={16} />{l}</li>)}
        <li className="inline-flex items-center gap-1.5"><span className="pill urg-now">Decide now</span><span className="pill pill-wait">Coming up</span><span className="pill pill-ok">Later</span></li>
      </ul>

      {/* Chart: laptops and wider. Phones use the lists below. */}
      <div className="mt-4 hidden lg:block overflow-x-auto rounded-xl border border-[var(--line)]">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[9rem_minmax(0,1fr)] border-b border-[var(--line)] bg-[var(--panel)]">
            <div className="p-2 text-xs font-semibold text-[var(--muted)]">Supplier</div>
            <div className="relative h-8">
              {ticks.map((t) => <span key={t.date} className="absolute top-2 text-xs text-[var(--muted)] -translate-x-1/2 whitespace-nowrap" style={{ left: `${pctOf(t.date, tl)}%` }}>{t.label}</span>)}
            </div>
          </div>
          {tl.rows.map((r) => {
            const h = (r.bars.length + 1) * LANE + 8;
            return (
              <div key={r.sup} className="grid grid-cols-[9rem_minmax(0,1fr)] border-b border-[var(--line)] last:border-b-0">
                <div className="p-2 text-sm font-semibold">{r.name}</div>
                <div className="relative" style={{ height: h }}>
                  {ticks.map((t) => <span key={t.date} className="absolute inset-y-0 w-px bg-[var(--line)]" style={{ left: `${pctOf(t.date, tl)}%` }} />)}
                  <span className="absolute inset-y-0 w-0.5 bg-[#d4145a]" style={{ left: `${todayPct}%` }} aria-hidden />
                  {r.bars.map((b, i) => {
                    const l = pctOf(b.from, tl), rgt = b.to ? pctOf(b.to, tl) : 100;
                    return (
                      <button key={b.id} type="button" onClick={() => setSel(sel === b.id ? null : b.id)} title={`${b.title}: ${dmy(b.from)} to ${b.to ? dmy(b.to) : "no end date"}`} aria-pressed={sel === b.id}
                        className={`absolute rounded text-xs text-left px-1.5 overflow-hidden whitespace-nowrap ${b.signed ? "bg-bar text-[var(--bg)]" : "border-2 border-dashed border-[var(--muted)] text-[var(--muted)] bg-transparent"} ${sel === b.id ? "ring-2 ring-[var(--tour)]" : ""}`}
                        style={{ left: `${l}%`, width: `${Math.max(rgt - l, 1.2)}%`, top: (i + 1) * LANE + 4, height: 22 }}>{b.title}</button>
                    );
                  })}
                  {r.markers.map((m) => (
                    <button key={m.id} type="button" onClick={() => setSel(sel === m.id ? null : m.id)} aria-label={`${m.title}, ${dmy(m.date)}`} aria-pressed={sel === m.id} title={`${m.title}: ${dmy(m.date)}`}
                      className={`absolute -translate-x-1/2 w-7 h-7 rounded-full text-white flex items-center justify-center border-2 border-[var(--bg)] ${sel === m.id ? "ring-2 ring-[var(--tour)]" : ""}`}
                      style={{ left: `${Math.min(98.5, Math.max(1.5, pctOf(m.date, tl)))}%`, top: 2, background: FILL[m.urgency] }}><TlIcon kind={m.icon} size={14} /></button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-1 hidden lg:block text-xs text-[var(--muted)]">The magenta line is today. Select an icon or a bar for details.</p>
      {detail}

      <h3 className="mt-8 text-xl">Coming up</h3>
      <ul className="mt-2 space-y-2">
        {tl.comingUp.map((m: Marker) => (
          <li key={m.id} className="rounded-xl border border-[var(--line)] p-3 flex flex-wrap items-start gap-3">
            <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full text-white flex items-center justify-center" style={{ background: FILL[m.urgency] }}><TlIcon kind={m.icon} size={16} /></span>
            <div className="grow min-w-[12rem]">
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-[var(--muted)]">{m.detail}</p>
            </div>
            <div className="text-right">
              <p className="num font-semibold">{dmy(m.date)}</p>
              <p className="text-sm"><span className={`pill ${PILL[m.urgency]}`}>{URGENCY_TEXT[m.urgency]}</span> <span className="num">{m.days} days</span></p>
              {m.link && <Link to={m.link} className="inline-flex items-center min-h-[44px] underline text-sm">Open</Link>}
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-xl">All contracts</h3>
      <div className="mt-2 overflow-x-auto border border-[var(--line)] rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-[var(--panel)]"><tr>{["Supplier", "Document", "Starts", "Ends", "Status"].map((h) => <th key={h} className="p-2.5 font-semibold border-r border-[var(--line)] last:border-r-0">{h}</th>)}</tr></thead>
          <tbody>
            {tl.bars.map((b) => (
              <tr key={b.id} className="border-t border-[var(--line)]">
                <td className="p-2.5 border-r border-[var(--line)]">{SUPPLIERS.find((s) => s.id === b.sup)!.short}</td>
                <td className="p-2.5 border-r border-[var(--line)]">{b.title}</td>
                <td className="p-2.5 border-r border-[var(--line)] num">{dmy(b.from)}</td>
                <td className="p-2.5 border-r border-[var(--line)] num">{b.to ? dmy(b.to) : "No end date"}</td>
                <td className="p-2.5"><span className={`pill ${b.signed ? "pill-ok" : "pill-wait"}`}>{b.signed ? "Signed by both" : "Not signed by both"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
