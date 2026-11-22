import { Link, useParams } from "react-router-dom";
import { ROLE_NAME } from "../lib/copy";
import { useStore } from "../lib/store";
import { allCards } from "../lib/todo";
import CaseA from "./CaseA";
import CaseBC from "./CaseBC";
import CaseDE from "./CaseDE";
import CaseFI from "./CaseFI";

export default function Item() {
  const { id = "" } = useParams();
  const snap = useStore();
  if (/^A\d+r?$/.test(id)) return <CaseA id={id} />;
  if (/^[BC]\d$/.test(id)) return <CaseBC id={id} />;
  if (id === "D" || id === "E") return <CaseDE id={id} />;
  if (/^(F|G|H|I[12])$/.test(id)) return <CaseFI id={id} />;
  const card = allCards(snap).find((c) => c.id === id);
  return (
    <main className="page py-8">
      <Link to="/" className="text-sm underline">To-do</Link>
      <h1 className="mt-3 text-3xl">{card ? card.headline : "This item is not open"}</h1>
      <p className="mt-4 text-[var(--muted)]">{card ? `This step is for ${ROLE_NAME[card.owner]}. Its page is built in a later step.` : "Nothing is waiting here right now."}</p>
    </main>
  );
}
