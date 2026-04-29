export function Spinner({ label }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-ink-800/70">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-900/20 border-t-ink-900" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
