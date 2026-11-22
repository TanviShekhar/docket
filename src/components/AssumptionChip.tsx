import { Link } from "react-router-dom";

// A small amber pill that points at a numbered assumption in the Case study.
export default function AssumptionChip({ code }: { code: string }) {
  return (
    <Link to="/case-study?to=assumptions" title={`Assumption ${code}: we assumed this to build the prototype. Tap to read it.`} className="chip-assume">
      {code}
    </Link>
  );
}
