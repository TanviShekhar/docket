import { useState } from "react";
import { NavLink } from "react-router-dom";
import { DEMO_TODAY, PEOPLE, type Role } from "../lib/data";
import { D } from "../lib/engine";
import { useStore } from "../lib/store";
import AssumptionChip from "./AssumptionChip";
import { useTour } from "../lib/tour";

const TABS = [
  { to: "/", label: "To-do" },
  { to: "/contracts", label: "Contracts" },
  { to: "/value", label: "Value" },
  { to: "/case-study", label: "Case study" },
];
const ROLES = Object.keys(PEOPLE) as Role[];
const todayLabel = D(DEMO_TODAY).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(",", "");

export default function TopBar() {
  const { role, setRole, reset } = useStore();
  const [confirming, setConfirming] = useState(false);
  const btn = "min-h-[44px] px-3 rounded-lg text-sm";
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-2 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-display text-xl font-bold">Docket</span>
        <nav className="flex flex-wrap gap-1" aria-label="Main">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === "/"}
              className={({ isActive }) => `${btn} inline-flex items-center ${isActive ? "bg-white/15 font-semibold" : "hover:bg-white/10"}`}>
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <label className="flex flex-col">
            <span className="text-xs text-white/70">Viewing as</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}
              className="min-h-[44px] rounded-lg bg-white text-[#101828] px-2">
              {ROLES.map((r) => <option key={r} value={r}>{PEOPLE[r].name} ({r === "owner" ? "Business owner" : r[0].toUpperCase() + r.slice(1)})</option>)}
            </select>
          </label>
          <span className="num">Today: {todayLabel} <AssumptionChip code="A7" /></span>
          <button className={`${btn} hover:bg-white/10`} type="button" onClick={() => useTour.getState().start()}>Take the tour</button>
          <button className={`${btn} hover:bg-white/10`} type="button" onClick={() => setConfirming(true)}>Reset demo</button>
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-2 text-xs text-white/70">
        Simulated sign-in. In production people sign in and see only their own work.
      </p>
      {confirming && (
        <div className="bg-white text-[#101828] border-b border-[#e4e7ee]">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
            <span>Reset the demo to its starting state? Everything you changed is cleared.</span>
            <button className={`${btn} bg-navy text-white`} type="button" onClick={() => { reset(); useTour.getState().end(); setConfirming(false); }}>Yes, reset</button>
            <button className={`${btn} underline`} type="button" onClick={() => setConfirming(false)}>Keep my changes</button>
          </div>
        </div>
      )}
    </header>
  );
}
