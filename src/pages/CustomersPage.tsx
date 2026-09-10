
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '@/lib/api';
import { initials, money, relativeDay, tintOf } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Cell, DataTable, Input, Kpi, Row, Spinner } from '@/components/ui';

const SEG = {
  NEW: { label: 'جديد', tone: 'good' },
  REPEAT: { label: 'متكرر', tone: 'muted' },
  INACTIVE: { label: 'غير نشط', tone: 'crit' },
  HIGH_SPENDER: { label: 'مرتفع الإنفاق', tone: 'accent' },
} as const;
type Seg = keyof typeof SEG;

interface CustomerRow {
  id: string;
  name: string | null;
  phone: string;
  visits: number;
  lastVisitAt: string | null;
  totalSpend: number;
  vehicleCount: number;
  segment: Seg;
}

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const [seg, setSeg] = useState('');

  const list = useQuery({
    queryKey: ['customers', q, seg],
    queryFn: () => api.get<{ rows: CustomerRow[]; total: number }>('/customers', { q: q || undefined, segment: seg || undefined, pageSize: 50 }),
  });
  const summary = useQuery({
    queryKey: ['customer-summary'],
    queryFn: () => api.get<{ total: number; NEW: number; REPEAT: number; INACTIVE: number; HIGH_SPENDER: number }>('/customers/segments/summary'),
  });

  return (
    <div>
      <PageHead
        eyebrow="النمو"
        title="العملاء (CRM)"
        subtitle="الزيارات والإنفاق والتقسيم المحسوب لكل عميل."
        actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الجوال" aria-label="بحث في العملاء" className="!w-56 !py-1.5 !text-[13px]" />}
      />

      {summary.data && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="إجمالي العملاء" value={summary.data.total} icon={<Icon d={P.contact} size={15} />} />
          <Kpi label="متكررون" value={summary.data.REPEAT} tone="good" icon={<Icon d={P.trend} size={15} />} />
          <Kpi label="مرتفعو الإنفاق" value={summary.data.HIGH_SPENDER} icon={<Icon d={P.wallet} size={15} />} />
          <Kpi label="غير نشطين" value={summary.data.INACTIVE} tone="crit" icon={<Icon d={P.alert} size={15} />} />
        </div>
      )}

      <div className="mb-3 inline-flex gap-1 rounded-[10px] border border-line bg-surface-2 p-1">
        {['', ...Object.keys(SEG)].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setSeg(s)}
            className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold ${seg === s ? 'bg-surface text-ink shadow-card' : 'text-ink-soft'}`}
          >
            {s ? SEG[s as Seg].label : 'الكل'}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <DataTable head={<><Icon d={P.contact} /> قاعدة العملاء</>} meta={`${list.data?.total ?? 0} عميل`} columns={['العميل', 'الزيارات', 'آخر زيارة', 'الإنفاق', 'السيارات', 'التصنيف']}>
          {(list.data?.rows ?? []).map((c) => (
            <Row key={c.id} className="cursor-pointer">
              <Cell>
                <Link to={`/customers/${c.id}`} className="flex items-center gap-2.5">
                  <span className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-full text-[11.5px] font-extrabold ${tintOf(c.name ?? c.phone)}`} style={{ background: 'color-mix(in srgb, var(--tint) 15%, transparent)', color: 'var(--tint)' }}>{initials(c.name ?? c.phone)}</span>
                  <div><b>{c.name ?? 'بدون اسم'}</b><div className="text-[11px] text-ink-faint" dir="ltr">{c.phone}</div></div>
                </Link>
              </Cell>
              <Cell className="tabular-nums">{c.visits}</Cell>
              <Cell className="text-ink-soft">{c.lastVisitAt ? relativeDay(c.lastVisitAt) : '—'}</Cell>
              <Cell className="tabular-nums">{money(c.totalSpend)}</Cell>
              <Cell className="tabular-nums">{c.vehicleCount}</Cell>
              <Cell><Badge tone={SEG[c.segment].tone}>{SEG[c.segment].label}</Badge></Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}
