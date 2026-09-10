import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-[9px] border border-line bg-surface px-[11px] py-[9px] text-[16px] font-medium text-ink ' +
  'focus:outline-2 focus:outline-accent focus:outline-offset-1';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={cn(control, className)} {...p} />,
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...p }, ref) => <select ref={ref} className={cn(control, className)} {...p} />,
);
Select.displayName = 'Select';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-ink-soft">
      <span>{label}</span>
      {children}
      {error ? (
        <span className="font-medium text-crit">{error}</span>
      ) : hint ? (
        <span className="font-medium text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}
