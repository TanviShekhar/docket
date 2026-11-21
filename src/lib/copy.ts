import type { Role } from "./data";
import { D } from "./engine";

// Fixed three-letter months, so "Sep" never becomes "Sept" in some browsers.
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDate = (s: string) => { const d = D(s); return `${d.getDate()} ${MON[d.getMonth()]}`; };
export const dmy = (s: string) => `${shortDate(s)} ${D(s).getFullYear()}`;
export const ROLE_NAME: Record<Role, string> = { finance: "Finance", legal: "Legal", procurement: "Procurement", owner: "the business owner", supplier: "the supplier" };
