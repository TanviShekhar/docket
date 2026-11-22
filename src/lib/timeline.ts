// Contract timeline: every date comes from the contracts and the engine, never typed in.
import { CD_SEATS, DEMO_TODAY, DOCS, SH_DELIVERY, SUPPLIERS, TERMS } from "./data";
import { claimDeadline, D, daysBetween, iso, renewalDates } from "./engine";
import type { Snapshot } from "./store";

export type IconKind = "bell" | "refresh" | "calendar" | "tick" | "warning" | "clock";
export type Urgency = "now" | "soon" | "ok" | "done" | "past";

export interface Marker { id: string; sup: string; date: string; icon: IconKind; title: string; detail: string; link?: string; urgency: Urgency; days: number }
export interface Bar { id: string; sup: string; title: string; from: string; to: string | null; signed: boolean; source: string }

// Red inside 30 days, amber inside 90, green beyond. Finished steps and past dates are grey.
export function urgencyOf(date: string, done = false): Urgency {
  if (done) return "done";
  const d = daysBetween(DEMO_TODAY, date);
  return d < 0 ? "past" : d <= 30 ? "now" : d <= 90 ? "soon" : "ok";
}
export const URGENCY_TEXT: Record<Urgency, string> = { now: "Decide now", soon: "Coming up", ok: "Later", done: "Done", past: "Past" };

const firstOfMonth = (d: Date, delta: number) => new Date(d.getFullYear(), d.getMonth() + delta, 1);
export function windowOf() {
  const t = D(DEMO_TODAY);
  const start = firstOfMonth(t, -3);
  const end = new Date(t.getFullYear(), t.getMonth() + 26, 0); // last day of the month, 25 months ahead
  return { start: iso(start), end: iso(end) };
}

export function timeline(s: Snapshot) {
  const w = windowOf();
  const inWin = (date: string) => date >= w.start && date <= w.end;
  const supName = (id: string) => SUPPLIERS.find((x) => x.id === id)!.short;
  const docs = DOCS.filter((d) => d.filed !== false || s.addedDocs[d.id]);

  const bars: Bar[] = docs.map((d) => ({ id: d.id, sup: d.sup, title: d.title, from: d.effective, to: d.expiry, signed: d.exec === "signed", source: d.source }));

  const markers: Marker[] = [];
  const add = (m: Omit<Marker, "urgency" | "days">, done = false) => {
    if (!inWin(m.date)) return;
    markers.push({ ...m, urgency: urgencyOf(m.date, done), days: daysBetween(DEMO_TODAY, m.date) });
  };

  // CloudDesk: decide, send notice, auto-renewal
  const cd = renewalDates(CD_SEATS.renewal, CD_SEATS.noticeDays);
  add({ id: "cd-decide", sup: "CD", date: cd.internal, icon: "warning", title: "CloudDesk: owner decides on the renewal", detail: "The decision is due early enough to send the notice by courier in time.", link: "/item/B2" }, !!s.done.B2);
  add({ id: "cd-notice", sup: "CD", date: cd.notice, icon: "bell", title: "CloudDesk: notice must be received", detail: `Clause 9.1: written notice of non-renewal must be received ${CD_SEATS.noticeDays} days before the term ends. Email does not count.`, link: "/item/B3" }, !!s.done.B3);
  add({ id: "cd-renew", sup: "CD", date: CD_SEATS.renewal, icon: "refresh", title: "CloudDesk: renews automatically", detail: "The agreement renews for 12 months unless notice is received in time.", link: "/item/B1" });

  // SwiftHaul: service credit claim window
  const claimBy = claimDeadline(SH_DELIVERY.month);
  add({ id: "sh-claim", sup: "SH", date: claimBy, icon: "clock", title: "SwiftHaul: claim the October service credit by", detail: "Clause 7.4: credits must be claimed in writing within 30 days of the month end.", link: "/item/C3" }, !!s.done.C3);

  // Obligations written in the contracts (for example the yearly SOC 2 report)
  for (const t of TERMS.filter((x) => x.key === "obligation")) {
    const m = /(\d{1,2}) (\w+) each year/.exec(String(t.value));
    if (!m) continue;
    for (let y = D(DEMO_TODAY).getFullYear(); y <= D(DEMO_TODAY).getFullYear() + 2; y++) {
      const date = iso(new Date(`${m[2]} ${m[1]}, ${y}`));
      if (date >= DEMO_TODAY) { add({ id: `ob-${t.id}-${y}`, sup: t.sup, date, icon: "calendar", title: `${supName(t.sup)}: ${t.label}`, detail: `Written in clause ${t.ref}. It repeats every year.` }); break; }
    }
  }

  // Every document with an end date, and signature dates inside the window
  for (const d of docs) {
    if (d.expiry && d.id !== "CD-SUB") add({ id: `end-${d.id}`, sup: d.sup, date: d.expiry, icon: "calendar", title: `${supName(d.sup)}: ${d.title} ends`, detail: d.exec === "signed" ? "The document reaches its end date." : "This document was never signed by both parties.", link: d.sup === "TB" ? "/supplier/TB" : undefined });
    if (d.signed && d.exec === "signed") add({ id: `sig-${d.id}`, sup: d.sup, date: d.signed, icon: "tick", title: `${supName(d.sup)}: ${d.title} signed`, detail: `Signed by both parties. ${d.source}` });
  }

  const sups = [...new Set([...bars.map((b) => b.sup), ...markers.map((m) => m.sup)])];
  const rows = SUPPLIERS.filter((x) => sups.includes(x.id)).map((x) => ({ sup: x.id, name: x.short, bars: bars.filter((b) => b.sup === x.id), markers: markers.filter((m) => m.sup === x.id) }));
  const comingUp = markers.filter((m) => m.days >= 0 && m.icon !== "tick").sort((a, b) => (a.date < b.date ? -1 : 1));
  return { ...w, bars, markers, rows, comingUp };
}

export const pctOf = (date: string, w: { start: string; end: string }) => {
  const a = D(w.start).getTime(), b = D(w.end).getTime();
  return Math.max(0, Math.min(100, ((D(date).getTime() - a) / (b - a)) * 100));
};

export function monthTicks(w: { start: string; end: string }) {
  const out: { label: string; date: string }[] = [];
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let d = D(w.start);
  while (iso(d) <= w.end) { if (d.getMonth() % 3 === 0) out.push({ label: `${names[d.getMonth()]} ${d.getFullYear()}`, date: iso(d) }); d = firstOfMonth(d, 1); }
  return out;
}
