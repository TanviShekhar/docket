import { useState } from "react";
import { create } from "zustand";
import { useNavigate } from "react-router-dom";
import { INVOICES, PEOPLE, type Role } from "../lib/data";
import { checkInvoice, inr } from "../lib/engine";
import { contractRate, invoiceRate } from "../lib/todo";
import { useStore } from "../lib/store";
import { useTour } from "../lib/tour";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";

// While true, the app keeps showing this screen after sign-in so the visitor can choose how to start.
export const usePicking = create<{ picking: boolean }>(() => ({ picking: false }));

const ROLE_LABEL: Record<Role, string> = { finance: "Finance", legal: "Legal", procurement: "Procurement", owner: "Business owner", supplier: "Supplier" };
const ROLE_JOB: Record<Role, string> = {
  finance: "Checks invoices, confirms the difference, records credit notes.",
  legal: "Checks a contract term before anyone relies on it.",
  procurement: "Sends notices and claims, and fixes purchase orders.",
  owner: "Decides whether to renew, and how much to buy.",
  supplier: "Sees one simple page and agrees or explains.",
};

// A short list of lines, one idea per line.
const Lines = ({ lines }: { lines: string[] }) => <ul className="mt-3 mx-auto w-fit max-w-full list-disc pl-5 space-y-2 text-left text-[15px]">{lines.map((l) => <li key={l}>{l}</li>)}</ul>;

// Step 1: what this is. Step 2: simulated sign-in. Step 3: how to start.
export default function Welcome() {
  const signIn = useStore((s) => s.signIn);
  const signedIn = useStore((s) => s.signedIn);
  const nav = useNavigate();
  const [step, setStep] = useState<"welcome" | "signin">(signedIn ? "signin" : "welcome");
  const [done, setDone] = useState(false);
  const [role, setRole] = useState<Role>("finance");
  const [user, setUser] = useState("test"), [pass, setPass] = useState("test");
  const [err, setErr] = useState("");
  const gap = inr(checkInvoice(INVOICES[0], { termState: { t4: "verified" } }).totals.disputable);
  const field = "h-10 w-full border border-[var(--line)] rounded-lg px-3 bg-transparent";
  const btn = "min-h-[44px] px-6 rounded-lg font-semibold";
  const card = "rounded-2xl border border-[var(--line)] p-6 flex flex-col";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.trim() !== "test" || pass !== "test") { setErr("Use test for both the username and the password."); return; }
    if (role === "supplier") { signIn(role); nav("/"); return; } // suppliers go straight to their portal
    usePicking.setState({ picking: true }); signIn(role); setDone(true);
  };
  const go = (tour: boolean) => { usePicking.setState({ picking: false }); nav("/"); if (tour) setTimeout(() => useTour.getState().start(), 150); };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-navy text-white"><div className="page py-3 flex items-center justify-between"><Logo size={28} /><ThemeToggle /></div></header>
      <main className="flex-1 flex items-center">
        <div className="page w-full py-8">

          {step === "welcome" && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] items-stretch">
              <section className="flex flex-col justify-center">
                <h1 className="text-2xl lg:text-[1.65rem] leading-snug text-center">
                  Suppliers don't always charge what the contract says.<br />
                  <span className="text-[var(--tour)]">Docket catches it, proves it and helps you recover the money.</span>
                </h1>
                <p className="mt-4 text-center text-lg text-[var(--muted)]">See the idea in one example.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className={card}><h2 className="text-lg text-center">What happened</h2>
                    <Lines lines={[`A supplier billed ${inr(invoiceRate())}/hr.`, `The signed contract says ${inr(contractRate())}/hr since 1 October.`, "Nobody noticed: the purchase order still had the old rate."]} /></div>
                  <div className={card}><h2 className="text-lg text-center">What should have happened</h2>
                    <Lines lines={[`Finance pays ${inr(contractRate())}/hr.`, `The ${gap} overcharge on one line is caught before payment.`, "It is recovered with a credit note."]} /></div>
                  <div className={card}><h2 className="text-lg text-center">How Docket points it out</h2>
                    <Lines lines={["Works out which signed terms apply.", "Checks the invoice against them.", "Shows the proof.", "Sends the gap to the person who can act."]} /></div>
                </div>
                <div className="mt-8 text-center"><button type="button" className={`${btn} bg-navy text-white`} onClick={() => setStep("signin")}>Continue</button></div>
              </section>
              <aside className="rounded-2xl border border-[var(--line)] p-5 space-y-4 text-sm self-stretch flex flex-col justify-center">
                <h2 className="text-lg">Before you explore</h2>
                <p><span className="font-semibold">A prototype for a case.</span> Companies, people and data are fictional. Nothing is sent and no money moves.</p>
                <p><span className="font-semibold">The Case analysis page is part of the submission</span>, not part of the product. It holds the reasoning behind it.</p>
                <p>Amber tags like <span className="chip-assume">A7</span> mark an <span className="font-semibold">assumption</span> we made to build this. All eleven are on the Case analysis page.</p>
                <p>Labels like <span className="lbl lbl-calculated">Calculated</span> or <span className="lbl lbl-simulated">Simulated data</span> say where a result came from.</p>
              </aside>
            </div>
          )}

          {step === "signin" && !done && (
            <div className="grid gap-8 lg:grid-cols-2 items-center max-w-5xl mx-auto">
              <section>
                <h1 className="text-3xl md:text-4xl leading-tight">Sign in</h1>
                <p className="mt-3 text-[var(--muted)]">A simulated sign-in, to show where it would sit. In a real rollout people sign in with their company account and see only their own work. Here, the username and password are both <span className="font-mono">test</span>.</p>
                <form onSubmit={submit} className="mt-5 max-w-xs space-y-3" noValidate>
                  <label className="block text-sm">Username<input value={user} onChange={(e) => { setUser(e.target.value); setErr(""); }} autoComplete="username" className={field} /></label>
                  <label className="block text-sm">Password<input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(""); }} autoComplete="current-password" className={field} /></label>
                  <label className="block text-sm">Start as
                    <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={field}>
                      {(Object.keys(PEOPLE) as Role[]).map((r) => <option key={r} value={r}>{PEOPLE[r].name} ({ROLE_LABEL[r]})</option>)}
                    </select>
                  </label>
                  {err && <p role="alert" className="text-sm text-gap">{err}</p>}
                  <button type="submit" className={`${btn} bg-navy text-white`}>Sign in</button>
                </form>
              </section>
              <aside className="story-box p-6">
                <h2 className="text-xl">The idea: one issue, five people</h2>
                <p className="mt-2 text-sm">A single contract problem touches five people. Four of them work at Larkspur and can switch between each other from the top bar. The supplier signs in to a separate portal and sees only their own account.</p>
                <dl className="mt-4 space-y-3 text-sm">
                  {(Object.keys(PEOPLE) as Role[]).map((r) => (
                    <div key={r}><dt className="font-semibold">{PEOPLE[r].name}, {ROLE_LABEL[r]}</dt><dd>{ROLE_JOB[r]}</dd></div>
                  ))}
                </dl>
              </aside>
            </div>
          )}

          {done && (
            <section className="max-w-5xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl leading-tight">How do you want to start?</h1>
              <div className="mt-8 grid gap-5 md:grid-cols-3 text-left">
                <button type="button" onClick={() => go(true)} className="relative text-left rounded-2xl border-2 border-[var(--tour)] p-6 hover:bg-[var(--panel)]">
                  <span className="absolute -top-3 right-4 rounded-full bg-navy text-white text-xs font-semibold px-3 py-1 border border-white/30">Recommended</span>
                  <span className="text-lg font-semibold">Walk me through it</span>
                  <span className="mt-2 block text-sm text-[var(--muted)]">A guided tour that points at what to look at and explains it.</span>
                </button>
                <button type="button" onClick={() => go(false)} className="text-left rounded-2xl border border-[var(--line)] p-6 hover:bg-[var(--panel)]">
                  <span className="text-lg font-semibold">Explore on my own</span>
                  <span className="mt-2 block text-sm text-[var(--muted)]">Go straight to the to-do page. Start the tour any time from the top bar.</span>
                </button>
                <button type="button" onClick={() => { usePicking.setState({ picking: false }); nav("/case-study"); }} className="text-left rounded-2xl border border-[var(--line)] p-6 hover:bg-[var(--panel)]">
                  <span className="text-lg font-semibold">Read the case analysis first</span>
                  <span className="mt-2 block text-sm text-[var(--muted)]">Why this stage, who it is for, the problem and how success is measured.</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
