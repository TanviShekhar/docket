import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { DEMO_TODAY, PEOPLE, type Role } from "../lib/data";
import { D } from "../lib/engine";
import { useStore } from "../lib/store";
import { useTour } from "../lib/tour";
import AssumptionChip from "./AssumptionChip";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const TABS = [
  { to: "/", label: "To-do" },
  { to: "/contracts", label: "Contracts" },
  { to: "/value", label: "Value" },
  { to: "/case-study", label: "Case analysis" },
];
const ROLES = (Object.keys(PEOPLE) as Role[]).filter((r) => r !== "supplier"); // suppliers sign in to their own portal
const ROLE_LABEL: Record<Role, string> = { finance: "Finance", legal: "Legal", procurement: "Procurement", owner: "Business owner", supplier: "Supplier" };
const todayLabel = D(DEMO_TODAY).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(",", "");

export default function TopBar() {
  const { role, setRole, reset, signOut } = useStore();
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLElement>(null);
  // The bar stays visible while scrolling on tablets and laptops. Its height is shared so sticky side panels sit below it.
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const set = () => document.documentElement.style.setProperty("--hdr", matchMedia("(min-width: 768px)").matches ? `${el.getBoundingClientRect().height}px` : "0px");
    set();
    const ro = new ResizeObserver(set); ro.observe(el);
    window.addEventListener("resize", set);
    return () => { ro.disconnect(); window.removeEventListener("resize", set); document.documentElement.style.setProperty("--hdr", "0px"); };
  }, []);
  const btn = "min-h-[44px] lg:min-h-[36px] px-2.5 rounded-lg text-sm hover:bg-white/10";
  // Leaving a running tour by clicking a tab asks first.
  const guard = (to: string) => (e: React.MouseEvent) => {
    if (useTour.getState().chapter !== null) { e.preventDefault(); useTour.setState({ leaving: to }); }
  };
  return (
    <header ref={ref} className="bg-navy text-white md:sticky md:top-0 z-40">
      <div className="page py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link to="/" onClick={guard("/")} aria-label="Docket: go to the to-do page" className="rounded-lg"><Logo /></Link>
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
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="min-h-[44px] lg:min-h-[36px] w-44 lg:w-52 rounded-lg bg-white text-[#101828] px-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{PEOPLE[r].name} ({ROLE_LABEL[r]})</option>)}
            </select>
          </label>
          <span className="num whitespace-nowrap">Today: {todayLabel} <AssumptionChip code="A7" /></span>
          <button className={`${btn} border border-white/40 px-3`} type="button" onClick={() => useTour.getState().start()}>Take the tour</button>
          <button className={btn} type="button" onClick={() => setConfirming(true)}>Reset demo</button>
          <button className={btn} type="button" onClick={() => { useTour.getState().end(); signOut(); }}>Sign out</button>
          <ThemeToggle />
        </div>
      </div>
      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Reset the demo">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] p-6">
            <h2 className="text-xl">Reset the demo?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Everything you changed goes back to the start: steps done, notices, and choices. You stay signed in.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="min-h-[44px] px-4 rounded-lg bg-navy text-white font-semibold" type="button" onClick={() => { reset(); useTour.getState().end(); setConfirming(false); }}>Yes, reset</button>
              <button className="min-h-[44px] px-4 rounded-lg border border-[var(--line)]" type="button" onClick={() => setConfirming(false)}>Keep my changes</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
