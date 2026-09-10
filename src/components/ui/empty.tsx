export function EmptyState({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[11px] border border-dashed border-line px-3 py-7 text-center text-[12px] text-ink-faint">
      {icon && <span className="opacity-50">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
