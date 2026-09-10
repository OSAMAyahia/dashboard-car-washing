const RIYADH = 'Asia/Riyadh';

/** halalas -> "٧٥ ر.س" */
export function money(halalas: number, opts: { decimals?: boolean } = {}): string {
  const sar = halalas / 100;
  const n = opts.decimals
    ? sar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(sar).toLocaleString('en-US');
  return `${n} ر.س`;
}

export const toHalalas = (sar: number) => Math.round(sar * 100);

export function shortDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('ar-SA', {
    timeZone: RIYADH,
    day: 'numeric',
    month: 'short',
  }).format(d);
}

export function time(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('ar-SA', {
    timeZone: RIYADH,
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function relativeDay(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 30) return `قبل ${days} يوم`;
  return `قبل ${Math.round(days / 30)} شهر`;
}

export const initials = (name?: string | null) =>
  (name ?? '').replace(/^(مغسلة|مغاسل|شركة|معرض)\s+/, '').trim().slice(0, 2) || '—';

const TINTS = ['t-teal', 't-violet', 't-amber', 't-green', 't-indigo', 't-rose'] as const;
export function tintOf(seed: string): (typeof TINTS)[number] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length]!;
}
