import { cn } from '@/lib/cn';

export function DataTable({
  head,
  meta,
  columns,
  children,
  minWidth = 600,
}: {
  head?: React.ReactNode;
  meta?: React.ReactNode;
  columns: string[];
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {head != null && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-[18px] py-[14px]">
          <h4 className="flex items-center gap-2 text-[13.5px] font-extrabold">{head}</h4>
          {meta != null && <span className="whitespace-nowrap text-[11.5px] font-bold text-ink-faint">{meta}</span>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[13px]" style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className="sticky top-0 z-[2] whitespace-nowrap border-b border-line bg-surface-2 px-[18px] py-3 text-start text-[10.5px] font-bold uppercase tracking-wider text-ink-faint"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Row({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-[var(--accent-wash)]', className)} {...p} />;
}

export function Cell({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-line-soft px-[18px] py-[14px] align-middle text-ink', className)} {...p} />;
}
