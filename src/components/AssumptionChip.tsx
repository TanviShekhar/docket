import { Link } from "react-router-dom";

// A small pill that points at a numbered assumption in the Case study.
export default function AssumptionChip({ code, className = "" }: { code: string; className?: string }) {
  return (
    <Link to={`/case-study?to=assumptions`} title={`Assumption ${code}. Tap to read it.`}
      className={`inline-flex items-center rounded-full border border-current px-2 text-xs ${className}`}>{code}</Link>
  );
}
