// A small mark (a document with a tick) and a wordmark with a coloured final letter.
export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 mr-2" aria-label="Docket">
      <svg aria-hidden width={size} height={size} viewBox="0 0 24 24">
        <rect x="3" y="2" width="18" height="20" rx="4" fill="#ffffff" />
        <path d="M7.5 8.5h9M7.5 12h5" stroke="#0b1f4b" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 16.2l2.4 2.4 5.2-5.4" fill="none" stroke="#0f9d8a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">Docke<span style={{ color: "#5eead4" }}>t</span></span>
    </span>
  );
}
