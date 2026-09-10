import { cn } from '@/lib/cn';

type Tone = 'good' | 'warn' | 'crit';
type Dir = 'up' | 'down' | 'flat';

export function Sparkline({ data, tone }: { data: number[]; tone?: Tone }) {
  if (data.length < 2) return null;
  const w = 120;
  const h = 34;
  const pad = 3;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const rng = max - min || 1;
  const pts: Array<{ x: number; y: number }> = data.map((v, i) => ({
    x: pad + (i * (w - pad * 2)) / (data.length - 1),
    y: h - pad - ((v - min) / rng) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const col =
    tone === 'good'
      ? 'var(--good)'
      : tone === 'warn'
        ? 'var(--warn)'
        : tone === 'crit'
          ? 'var(--crit)'
          : 'var(--accent)';
  const last = pts[pts.length - 1] ?? { x: w, y: h / 2 };
  const first = pts[0] ?? { x: 0, y: h / 2 };
  const id = `spk-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity="0.3" />
          <stop offset="1" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${last.x.toFixed(1)} ${h} L${first.x.toFixed(1)} ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r="2.4" fill={col} />
    </svg>
  );
}

export function Kpi({
  label,
  value,
  delta,
  dir,
  tone,
  icon,
  spark,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  dir?: Dir;
  tone?: Tone;
  icon?: React.ReactNode;
  spark?: number[];
}) {
  return (
    <div className="flex flex-col rounded-[14px] border border-line bg-surface p-[18px] shadow-card transition hover:-translate-y-0.5 hover:border-[var(--line)] hover:shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-2.5">
        {icon && (
          <span
            className={cn(
              'grid h-[44px] w-[44px] flex-none place-items-center rounded-[12px]',
              tone === 'good' && 'bg-good-wash text-good',
              tone === 'warn' && 'bg-warn-wash text-warn',
              tone === 'crit' && 'bg-crit-wash text-crit',
              !tone && 'bg-[var(--accent-wash)] text-accent',
            )}
          >
            {icon}
          </span>
        )}
        {delta && (
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10.5px] font-extrabold',
              dir === 'up' && 'bg-good-wash text-good',
              dir === 'down' && 'bg-crit-wash text-crit',
              (!dir || dir === 'flat') && 'bg-surface-2 text-ink-faint',
            )}
          >
            {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '●'} {delta}
          </div>
        )}
      </div>
      <div className="mono mt-3.5 text-[27px] font-extrabold leading-none text-ink">{value}</div>
      <div className="mt-1.5 text-[13px] font-bold text-ink-faint">{label}</div>
      {spark && (
        <div className="mt-auto pt-3">
          <Sparkline data={spark} tone={tone} />
        </div>
      )}
    </div>
  );
}
