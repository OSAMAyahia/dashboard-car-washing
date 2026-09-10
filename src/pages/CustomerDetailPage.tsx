
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { money, relativeDay, shortDate } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Card, CardBody, CardHeader, Cell, DataTable, Kpi, Row, Spinner } from '@/components/ui';

interface Detail {
  id: string;
  name: string | null;
  phone: string;
  vehicles: { id: string; plate: string; label: string | null; size: { id: string; code: string; name: string } }[];
  stats: { visits: number; totalSpend: number; avgOrderValue: number; segment: string; lastVisitAt: string | null };
  recentBookings: { id: string; scheduledAt: string; status: string; total: number; service: { name: string }; branch: { name: string } }[];
}


export default function CustomerDetail() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['customer', id], queryFn: () => api.get<Detail>(`/customers/${id}`) });

  if (isLoading || !data) return <Spinner className="h-6 w-6" />;

  return (
    <div className="flex flex-col gap-4">
      <PageHead eyebrow="العملاء" title={data.name ?? 'عميل'} subtitle={data.phone} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="عدد الزيارات" value={data.stats.visits} icon={<Icon d={P.calendar} size={15} />} />
        <Kpi label="إجمالي الإنفاق" value={money(data.stats.totalSpend)} tone="good" icon={<Icon d={P.wallet} size={15} />} />
        <Kpi label="متوسط الطلب" value={money(data.stats.avgOrderValue)} icon={<Icon d={P.trend} size={15} />} />
        <Kpi label="آخر زيارة" value={data.stats.lastVisitAt ? relativeDay(data.stats.lastVisitAt) : '—'} icon={<Icon d={P.clock} size={15} />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader icon={<Icon d={P.car} />} title="السيارات" meta={`${data.vehicles.length}`} />
          <CardBody>
            <div className="flex flex-col gap-2">
              {data.vehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-[10px] border border-line p-2.5">
                  <div><b className="text-[13px]">{v.label || v.plate}</b><div className="text-[11px] text-ink-faint">{v.size.name}</div></div>
                  <span className="font-mono text-[12px]">{v.plate}</span>
                </div>
              ))}
              {data.vehicles.length === 0 && <p className="text-sm text-ink-faint">لا توجد سيارات مسجّلة.</p>}
            </div>
          </CardBody>
        </Card>

        <DataTable head={<><Icon d={P.calendar} /> آخر الحجوزات</>} columns={['التاريخ', 'الخدمة', 'الفرع', 'المبلغ', 'الحالة']} minWidth={480}>
          {data.recentBookings.map((b) => (
            <Row key={b.id}>
              <Cell className="tabular-nums">{shortDate(b.scheduledAt)}</Cell>
              <Cell>{b.service.name}</Cell>
              <Cell className="text-ink-soft">{b.branch.name}</Cell>
              <Cell className="tabular-nums">{money(b.total)}</Cell>
              <Cell><Badge tone={b.status === 'DONE' ? 'good' : b.status === 'CANCELLED' || b.status === 'NO_SHOW' ? 'crit' : 'accent'}>{b.status}</Badge></Cell>
            </Row>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
