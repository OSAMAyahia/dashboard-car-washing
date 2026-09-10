
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { money, shortDate } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Card, CardBody, CardHeader, Cell, DataTable, Kpi, Row, Spinner } from '@/components/ui';

interface Analytics {
  summary: { revenue: number; orders: number; avgTicket: number; activeCustomers: number; newCustomers: number; repeatRate: number };
  revenueSeries: { date: string; orders: number; revenue: number }[];
  peakHours: { hour: number; count: number }[];
  topServices: { name: string; orders: number; revenue: number; share: number }[];
  branchComparison: { branchId: string; name: string; orders: number; revenue: number; avgTicket: number }[];
  clv: { avgLifetimeSpend: number; avgVisits: number; customers: number };
}

interface StaffReport {
  summary: { staffCount: number; cars: number; unassignedCars: number; avgServiceMin: number | null; upsellRevenue: number };
  staff: {
    staffId: string;
    name: string;
    role: string;
    isActive: boolean;
    cars: number;
    avgServiceMin: number | null;
    activeNow: number;
    upsells: number;
    upsellRevenue: number;
  }[];
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'مالك',
  MANAGER: 'مدير',
  RECEPTIONIST: 'استقبال',
  WASHER: 'عامل غسيل',
};

const RANGES = { '7': 'آخر أسبوع', '30': 'آخر شهر', '90': 'آخر 3 أشهر' } as const;

export default function ReportsPage() {
  const [days, setDays] = useState<keyof typeof RANGES>('30');
  const from = new Date(Date.now() - Number(days) * 86_400_000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => api.get<Analytics>('/reports/analytics', { from, granularity: days === '90' ? 'month' : 'day' }),
  });

  const staff = useQuery({
    queryKey: ['staff-report', days],
    queryFn: () => api.get<StaffReport>('/reports/staff', { from }),
  });

  const maxRev = Math.max(...(data?.revenueSeries.map((d) => d.revenue) ?? [1]), 1);
  const maxHour = Math.max(...(data?.peakHours.map((h) => h.count) ?? [1]), 1);

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="التحليلات"
        title="التقارير"
        subtitle="مؤشرات النمو والاحتفاظ والتشغيل."
        actions={
          <div className="inline-flex gap-1 rounded-[10px] border border-line bg-surface-2 p-1">
            {Object.entries(RANGES).map(([k, v]) => (
              <button key={k} onClick={() => setDays(k as keyof typeof RANGES)} className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold ${days === k ? 'bg-surface text-ink shadow-card' : 'text-ink-soft'}`}>{v}</button>
            ))}
          </div>
        }
      />

      {isLoading || !data ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="الإيراد" value={money(data.summary.revenue)} tone="good" icon={<Icon d={P.wallet} size={15} />} spark={data.revenueSeries.map((d) => d.revenue)} />
            <Kpi label="عدد الطلبات" value={data.summary.orders} icon={<Icon d={P.car} size={15} />} spark={data.revenueSeries.map((d) => d.orders)} />
            <Kpi label="متوسط قيمة الطلب" value={money(data.summary.avgTicket)} icon={<Icon d={P.trend} size={15} />} />
            <Kpi label="نسبة العودة" value={`${Math.round(data.summary.repeatRate * 100)}%`} tone="good" icon={<Icon d={P.contact} size={15} />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader icon={<Icon d={P.clock} />} title="ساعات الذروة" meta="حجوزات / ساعة" />
              <CardBody>
                <div className="flex h-40 items-end gap-1">
                  {data.peakHours.filter((h) => h.hour >= 7).map((h) => (
                    <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-gradient-to-b from-accent to-accent-deep" style={{ height: `${Math.max(4, (h.count / maxHour) * 100)}%` }} />
                      <span className="text-[9px] text-ink-faint">{h.hour}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader icon={<Icon d={P.tag} />} title="أعلى الخدمات طلبًا" meta="حصة %" />
              <CardBody>
                {data.topServices.slice(0, 6).map((s) => (
                  <div key={s.name} className="mb-3">
                    <div className="flex justify-between text-[12.5px]"><span>{s.name}</span><span className="font-bold tabular-nums">{s.share}%</span></div>
                    <div className="mt-1.5 h-[6px] overflow-hidden rounded-md bg-surface-2"><div className="h-full rounded-md bg-gradient-to-l from-accent to-accent-deep" style={{ width: `${s.share}%` }} /></div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <DataTable head={<><Icon d={P.building} /> مقارنة أداء الفروع</>} columns={['الفرع', 'الطلبات', 'الإيراد', 'متوسط الفاتورة']} minWidth={480}>
            {data.branchComparison.map((b) => (
              <Row key={b.branchId}>
                <Cell className="font-semibold">{b.name}</Cell>
                <Cell className="tabular-nums">{b.orders}</Cell>
                <Cell className="tabular-nums">{money(b.revenue)}</Cell>
                <Cell className="tabular-nums">{money(b.avgTicket)}</Cell>
              </Row>
            ))}
          </DataTable>

          <DataTable
            head={<><Icon d={P.users} /> أداء الموظفين</>}
            meta={
              staff.data?.summary.avgServiceMin != null
                ? `متوسط وقت الخدمة ${staff.data.summary.avgServiceMin} د`
                : undefined
            }
            columns={['الموظف', 'الدور', 'السيارات', 'متوسط الخدمة', 'قيد العمل', 'مبيعات إضافية']}
            minWidth={620}
          >
            {(staff.data?.staff ?? []).map((m) => (
              <Row key={m.staffId} className={m.isActive ? undefined : 'opacity-60'}>
                <Cell className="font-semibold">{m.name}</Cell>
                <Cell className="text-ink-soft">{ROLE_LABEL[m.role] ?? m.role}</Cell>
                <Cell className="tabular-nums">{m.cars}</Cell>
                <Cell className="tabular-nums">{m.avgServiceMin != null ? `${m.avgServiceMin} د` : '—'}</Cell>
                <Cell className="tabular-nums">{m.activeNow || '—'}</Cell>
                <Cell className="tabular-nums">
                  {m.upsells ? `${m.upsells} · ${money(m.upsellRevenue)}` : '—'}
                </Cell>
              </Row>
            ))}
          </DataTable>
          {!!staff.data?.summary.unassignedCars && (
            <p className="-mt-2 text-[11px] text-ink-faint">
              {staff.data.summary.unassignedCars} سيارة سُلّمت دون إسناد موظف — لا تُحتسب لأحد.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="قيمة العميل (CLV)" value={money(data.clv.avgLifetimeSpend)} icon={<Icon d={P.wallet} size={15} />} />
            <Kpi label="متوسط الزيارات" value={data.clv.avgVisits} icon={<Icon d={P.calendar} size={15} />} />
            <Kpi label="عملاء جدد بالفترة" value={data.summary.newCustomers} tone="good" icon={<Icon d={P.contact} size={15} />} />
          </div>

          <p className="text-[11px] text-ink-faint">{data.revenueSeries.length ? `من ${shortDate(data.revenueSeries[0]!.date)}` : ''} · الإيراد الأعلى في السلسلة {money(maxRev)}</p>
        </>
      )}
    </div>
  );
}
