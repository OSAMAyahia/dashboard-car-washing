import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-bold transition ' +
  'disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white dark:text-[#0b1120] shadow-[0_2px_10px_rgba(12,48,100,0.22)] hover:-translate-y-px hover:brightness-110',
  secondary: 'bg-secondary text-white shadow-[0_2px_10px_rgba(245,158,11,0.28)] hover:-translate-y-px hover:brightness-105',
  outline: 'border border-line bg-surface text-ink hover:border-accent',
  ghost: 'bg-surface-2 border border-line text-ink-soft hover:text-ink hover:border-[var(--line)]',
  danger: 'bg-crit-wash text-crit border border-[rgba(226,61,78,0.2)] hover:bg-crit hover:text-white',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-[18px] text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  ),
);
Button.displayName = 'Button';
