import { useState } from "react";
import { CONFLICTS } from "../lib/studyData";

type Pos = { x: number; y: number };
const NODES: Record<string, Pos> = {
  Legal: { x: 350, y: 45 }, Finance: { x: 110, y: 150 }, Procurement: { x: 590, y: 150 },
  "Business owner": { x: 190, y: 350 }, Supplier: { x: 510, y: 350 },
  CFO: { x: 350, y: 430 }, "IT and Security": { x: 75, y: 300 }, "Internal Audit": { x: 625, y: 300 },
  Docket: { x: 350, y: 215 },
};
// Each line belongs to one conflict (CLAUDE.md section 10).
const LINES: { a: string; b: string; c: number }[] = [
  { a: "Business owner", b: "Procurement", c: 1 },
  { a: "Finance", b: "Business owner", c: 2 }, { a: "Finance", b: "Supplier", c: 2 },
  { a: "Finance", b: "Legal", c: 3 }, { a: "Procurement", b: "Legal", c: 3 },
  { a: "Legal", b: "Docket", c: 4 },
  { a: "Procurement", b: "Supplier", c: 5 },
  { a: "IT and Security", b: "Docket", c: 6 },
];

export default function StakeholderMap() {
  const [sel, setSel] = useState<number | null>(null);
  const picked = CONFLICTS.find((c) => c.id === sel);
  return (
    <div>
      <p className="text-sm text-[var(--muted)]">Lines are conflicts. Click or tap a line, or one of the buttons below the map, to see the conflict and how Docket handles it.</p>
      <div className="mt-3 overflow-x-auto border border-[var(--line)] rounded-lg">
        <svg viewBox="0 0 700 470" className="min-w-[620px] w-full" role="group" aria-label="Stakeholder map. The same content is in the tables below.">
          {LINES.map((l, i) => {
            const A = NODES[l.a], B = NODES[l.b], on = sel === l.c;
            return (
              <g key={i} role="button" tabIndex={0} aria-label={`Conflict: ${CONFLICTS[l.c - 1].title}`} aria-pressed={on} className="cursor-pointer"
                onClick={() => setSel(on ? null : l.c)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSel(on ? null : l.c))}>
                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="transparent" strokeWidth={18} />
                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={on ? "currentColor" : "#8a94ad"} strokeWidth={on ? 4 : 1.5} strokeDasharray={on ? undefined : "5 4"} />
              </g>
            );
          })}
          {Object.entries(NODES).map(([name, p]) => {
            const hub = name === "Docket";
            return (
              <g key={name} pointerEvents="none">
                <rect x={p.x - (hub ? 44 : 62)} y={p.y - 18} width={hub ? 88 : 124} height={36} rx={8} fill={hub ? "#0b1f4b" : "var(--bg)"} stroke={hub ? "#0b1f4b" : "var(--line)"} strokeWidth={1} />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={14} fontWeight={hub ? 700 : 500} fill={hub ? "#ffffff" : "currentColor"}>{name}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {CONFLICTS.map((c) => (
          <button key={c.id} type="button" aria-pressed={sel === c.id} onClick={() => setSel(sel === c.id ? null : c.id)}
            className={`min-h-[44px] px-3 rounded-lg border text-sm text-left ${sel === c.id ? "bg-navy text-white border-navy" : "border-[var(--line)]"}`}>{c.title}</button>
        ))}
      </div>
      {picked && (
        <div className="mt-3 border border-[var(--line)] rounded-lg p-4" role="status">
          <p className="font-semibold">{picked.title}</p>
          <p className="mt-1">{picked.text}</p>
        </div>
      )}
    </div>
  );
}
