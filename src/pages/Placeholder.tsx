import { useParams } from "react-router-dom";

export default function Placeholder({ title }: { title: string }) {
  const { id } = useParams();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl">{title}{id ? `: ${id}` : ""}</h1>
      <p className="mt-2 text-[var(--muted)]">This screen is built in a later step.</p>
    </main>
  );
}
