import { cn } from '@/lib/cn';

export function Card({ className, striped, tint, ...p }: React.HTMLAttributes<HTMLDivElement> & { striped?: boolean; tint?: string }) {
  return (
    <div
      className={cn(
        'relative rounded-[14px] border border-line bg-surface shadow-card transition-[border-color,box-shadow] hover:border-[var(--line)] hover:shadow-[var(--shadow)]',
        striped && 'overflow-hidden',
        tint,
        className,
      )}
      {...p}
    >
      {striped && (
        <span
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, var(--tint, var(--accent)), color-mix(in srgb, var(--tint, var(--accent)) 35%, transparent))' }}
        />
      )}
      {p.children}
    </div>
  );
}

export function CardHeader({ icon, title, meta }: { icon?: React.ReactNode; title: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-[18px] py-[14px]">
      <h4 className="flex min-w-0 items-center gap-2 text-[13.5px] font-extrabold">
        {icon && <span className="text-accent-deep">{icon}</span>}
        <span className="truncate">{title}</span>
      </h4>
      {meta != null && <span className="whitespace-nowrap text-[11.5px] font-bold text-ink-faint">{meta}</span>}
    </div>
  );
}

export function CardBody({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-[18px]', className)} {...p} />;
}
