// Small files people can open in Excel. A static site can make a CSV in the browser; Excel opens it directly.
export type Cell = string | number;
export interface DataFile { name: string; rows: Cell[][] }

const esc = (c: Cell) => { const s = String(c); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function downloadCsv(f: DataFile) {
  const text = f.rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }); // the BOM keeps the rupee sign intact in Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = f.name.endsWith(".csv") ? f.name : f.name + ".csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
