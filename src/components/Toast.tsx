import { useEffect } from "react";
import { useToast } from "../lib/store";

export default function Toast() {
  const { text, hide } = useToast();
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(hide, 4500);
    return () => clearTimeout(t);
  }, [text, hide]);
  if (!text) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#15803d] text-white border border-white/40 rounded-xl px-5 py-3 text-base font-semibold flex items-center gap-2">
      <svg aria-hidden width="18" height="18" viewBox="0 0 18 18"><path d="M3 9.5l4 4 8-9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{text}
    </div>
  );
}
