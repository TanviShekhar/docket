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
    <div role="status" aria-live="polite" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-navy text-white border border-white/30 rounded-lg px-4 py-3">
      {text}
    </div>
  );
}
