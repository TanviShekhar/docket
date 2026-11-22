// White is the default on every device. The sun/moon button switches to dark and remembers the choice in this browser.
import { create } from "zustand";

export type Theme = "light" | "dark";
const KEY = "docket-theme";

const read = (): Theme => { try { return localStorage.getItem(KEY) === "dark" ? "dark" : "light"; } catch { return "light"; } };
const apply = (t: Theme) => { document.documentElement.dataset.theme = t; };

apply(read());

export const useTheme = create<{ theme: Theme; toggle: () => void }>((set, get) => ({
  theme: read(),
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, next); } catch { /* private window: the choice just lasts for this visit */ }
    apply(next); set({ theme: next });
  },
}));
