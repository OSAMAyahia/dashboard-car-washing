import { cn } from '@/lib/cn';

type Tone = 'accent' | 'good' | 'warn' | 'crit' | 'muted';
const tones: Record<Tone, string> = {
  accent: 'bg-accent-wash text-accent-deep',
  good: 'bg-good-wash text-good',
  warn: 'bg-warn-wash text-warn',
  crit: 'bg-crit-wash text-crit',
  muted: 'bg-surface-2 text-ink-soft border border-line',
};

export function Badge({ tone = 'muted', className, dot, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11.5px] font-bold', tones[tone], className)} {...p}>
      {dot && <span className="h-[7px] w-[7px] rounded-full bg-current" />}
      {p.children}
    </span>
  );
}
