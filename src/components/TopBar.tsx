import { useState } from "react";
import { NavLink } from "react-router-dom";
import { DEMO_TODAY, PEOPLE, type Role } from "../lib/data";
import { D } from "../lib/engine";
import { useStore } from "../lib/store";
import { useTour } from "../lib/tour";
import AssumptionChip from "./AssumptionChip";
import Logo from "./Logo";

const TABS = [
  { to: "/", label: "To-do" },
  { to: "/contracts", label: "Contracts" },
  { to: "/value", label: "Value" },
  { to: "/case-study", label: "Case study" },
];
const ROLES = Object.keys(PEOPLE) as Role[];
const ROLE_LABEL: Record<Role, string> = { finance: "Finance", legal: "Legal", procurement: "Procurement", owner: "Business owner", supplier: "Supplier" };
const todayLabel = D(DEMO_TODAY).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(",", "");

export default function TopBar() {
  const { role, setRole, reset, signOut } = useStore();
  const [confirming, setConfirming] = useState(false);
  const btn = "min-h-[44px] px-3 rounded-lg text-sm hover:bg-white/10";
  // Leaving a running tour by clicking a tab asks first.
  const guard = (to: string) => (e: React.MouseEvent) => {
    if (useTour.getState().chapter !== null) { e.preventDefault(); useTour.setState({ leaving: to }); }
  };
  return (
    <header className="bg-navy text-white">
      <div className="page py-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        <Logo />
        <nav className="flex flex-wrap" aria-label="Main">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === "/"} onClick={guard(t.to)}
              className={({ isActive }) => `${btn} inline-flex items-center ${isActive ? "bg-white/15 font-semibold" : ""}`}>
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <label className="flex items-center gap-2" title="Simulated sign-in. In production people sign in and see only their own work.">
            <span className="text-white/80">Viewing as</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="min-h-[44px] w-56 rounded-lg bg-white text-[#101828] px-2">
              {ROLES.map((r) => <option key={r} value={r}>{PEOPLE[r].name} ({ROLE_LABEL[r]})</option>)}
            </select>
          </label>
          <span className="num whitespace-nowrap">Today: {todayLabel} <AssumptionChip code="A7" /></span>
          <button className={`${btn} border border-white/40`} type="button" onClick={() => useTour.getState().start()}>Take the tour</button>
          <button className={btn} type="button" onClick={() => setConfirming(true)}>Reset demo</button>
          <button className={btn} type="button" onClick={() => { useTour.getState().end(); signOut(); }}>Sign out</button>
        </div>
      </div>
      {confirming && (
        <div className="bg-white text-[#101828] border-b border-[#e4e7ee]">
          <div className="page py-3 flex flex-wrap items-center gap-3 text-sm">
            <span>Reset the demo to its starting state? Everything you changed is cleared.</span>
            <button className="min-h-[44px] px-3 rounded-lg bg-navy text-white" type="button" onClick={() => { reset(); useTour.getState().end(); setConfirming(false); }}>Yes, reset</button>
            <button className="min-h-[44px] px-3 rounded-lg underline" type="button" onClick={() => setConfirming(false)}>Keep my changes</button>
          </div>
        </div>
      )}
    </header>
  );
}
