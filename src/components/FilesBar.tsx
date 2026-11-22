import { downloadCsv, type DataFile } from "../lib/csv";

// "Check it yourself": the same data as the page, as files that open in Excel.
export default function FilesBar({ files }: { files: DataFile[] }) {
  return (
    <section className="panel mt-8" aria-label="Files you can open in Excel">
      <h2 className="text-base font-semibold">Check it yourself in Excel</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">These files hold the same data as this page. They open in Excel.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {files.map((f) => <button key={f.name} type="button" onClick={() => downloadCsv(f)} className="min-h-[44px] px-3 rounded-lg border border-[var(--line)] text-sm hover:underline">Download {f.name}.csv</button>)}
      </div>
    </section>
  );
}
