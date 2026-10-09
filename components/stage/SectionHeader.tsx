/** Flutter `_SectionHeader`: bold titleMedium + muted description. */
export function SectionHeader({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="mb-2">
      <h2 className="text-base font-bold text-stage-text mb-2">{label}</h2>
      {children && <div className="text-[13px] leading-snug text-stage-muted whitespace-pre-line">{children}</div>}
    </div>
  );
}
