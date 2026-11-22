import { useState } from "react";
import { create } from "zustand";
import { useNavigate } from "react-router-dom";
import { PEOPLE, type Role } from "../lib/data";
import { checkInvoice, inr } from "../lib/engine";
import { INVOICES } from "../lib/data";
import { contractRate, invoiceRate } from "../lib/todo";
import { useStore } from "../lib/store";
import { useTour } from "../lib/tour";
import Logo from "../components/Logo";

// While true, the app keeps showing this screen after sign-in so the visitor can choose how to start.
export const usePicking = create<{ picking: boolean }>(() => ({ picking: false }));

const ROLE_LABEL: Record<Role, string> = { finance: "Finance", legal: "Legal", procurement: "Procurement", owner: "Business owner", supplier: "Supplier" };

// Step 1 of 3: what this is. Step 2: simulated sign-in. Step 3: how to start.
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
  const field = "min-h-[44px] w-full border border-[var(--line)] rounded-lg px-3 bg-transparent";
  const btn = "min-h-[44px] px-5 rounded-lg font-semibold";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.trim() !== "test" || pass !== "test") { setErr("Use test for both the username and the password."); return; }
    usePicking.setState({ picking: true }); signIn(role); setDone(true);
  };
  const go = (tour: boolean) => { usePicking.setState({ picking: false }); nav("/"); if (tour) setTimeout(() => useTour.getState().start(), 150); };

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-white"><div className="page py-3"><Logo size={28} /></div></header>
      <main className="page py-8 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
        {step === "welcome" && (
          <>
            <section>
              <h1 className="text-3xl md:text-4xl leading-tight">Docket checks that suppliers charge and deliver what the contract promised, and helps people recover the money when they don't.</h1>
              <p className="mt-3 text-[var(--muted)] max-w-3xl">Here is the idea in one example, before you look around.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[var(--line)] p-4"><h2 className="text-base">What happened</h2><p className="mt-1 text-sm">A staffing supplier billed <span className="num font-semibold">{inr(invoiceRate())}</span> an hour. The signed contract says <span className="num font-semibold">{inr(contractRate())}</span> an hour since 1 October. Nobody noticed, because the purchase order still had the old rate.</p></div>
                <div className="rounded-xl border border-[var(--line)] p-4"><h2 className="text-base">What should have happened</h2><p className="mt-1 text-sm">Finance pays the contract rate. The <span className="num font-semibold">{gap}</span> overcharge on one line is caught before it is paid, and recovered with a credit note.</p></div>
                <div className="rounded-xl border border-[var(--line)] p-4"><h2 className="text-base">How Docket points it out</h2><p className="mt-1 text-sm">It works out which signed terms apply, checks the invoice against them, shows the proof, and sends the gap to the person who can act.</p></div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3"><button type="button" className={`${btn} bg-navy text-white`} onClick={() => setStep("signin")}>Continue</button></div>
            </section>
            <aside className="rounded-xl border border-[var(--line)] p-5 space-y-3 text-sm">
              <h2 className="text-lg">Before you start</h2>
              <p><span className="font-semibold">This is a prototype for a case study.</span> All companies, people and data are fictional. Nothing is sent and no money moves.</p>
              <p><span className="font-semibold">The Case study page is part of the submission</span>, not part of the product. It holds the reasoning: why this stage, who it is for, the problem and how success is measured.</p>
              <p>Small amber tags like <span className="chip-assume">A7</span> mark an <span className="font-semibold">assumption</span> we made to build the prototype, for example the fixed demo date. All ten are listed on the Case study page.</p>
              <p>Labels such as <span className="inline-block rounded-full border border-[var(--line)] px-2 text-xs">Calculated</span> or <span className="inline-block rounded-full border border-[var(--line)] px-2 text-xs">Simulated data</span> say where each result came from.</p>
            </aside>
          </>
        )}

        {step === "signin" && !done && (
          <>
            <section>
              <h1 className="text-3xl md:text-4xl leading-tight">Sign in</h1>
              <p className="mt-3 text-[var(--muted)] max-w-xl">This is a simulated sign-in so you can see where it would sit. In a real rollout, people sign in with their company account and see only their own work. Here, the username and password are both <span className="font-mono">test</span>.</p>
              <form onSubmit={submit} className="mt-5 max-w-md space-y-4" noValidate>
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
            <aside className="rounded-xl border border-[var(--line)] p-5 text-sm space-y-2">
              <h2 className="text-lg">Why five people?</h2>
              <p>One contract issue touches Finance, Legal, Procurement, the business owner and the supplier. You can switch between them at any time from the top bar to see each person's to-do list.</p>
            </aside>
          </>
        )}

        {done && (
          <section className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl leading-tight">How do you want to start?</h1>
            <div className="mt-5 grid gap-4 md:grid-cols-3 max-w-5xl">
              <button type="button" onClick={() => go(true)} className="text-left rounded-xl border-2 border-[var(--tour)] p-5 hover:bg-[var(--panel)]"><span className="text-lg font-semibold">Walk me through it</span><span className="mt-1 block text-sm text-[var(--muted)]">A guided tour that points at what to look at and explains it. Recommended.</span></button>
              <button type="button" onClick={() => go(false)} className="text-left rounded-xl border border-[var(--line)] p-5 hover:bg-[var(--panel)]"><span className="text-lg font-semibold">Explore on my own</span><span className="mt-1 block text-sm text-[var(--muted)]">Go straight to the to-do page. You can start the tour any time from the top bar.</span></button>
              <button type="button" onClick={() => { usePicking.setState({ picking: false }); nav("/case-study"); }} className="text-left rounded-xl border border-[var(--line)] p-5 hover:bg-[var(--panel)]"><span className="text-lg font-semibold">Read the case study first</span><span className="mt-1 block text-sm text-[var(--muted)]">Why this stage, who it is for, the problem and how success is measured.</span></button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
