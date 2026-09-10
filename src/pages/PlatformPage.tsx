
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Card, CardBody, CardHeader, Kpi, Spinner } from '@/components/ui';

interface Metrics {
  tenants: { active: number; trial: number; suspended: number; total: number };
  managedBranches: number;
  openTickets: number;
  trialingSubscriptions: number;
  mrr: number;
}

export default function PlatformPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => api.get<Metrics>('/platform/metrics'),
    refetchInterval: 60_000,
  });

  return (
    <div>
      <PageHead eyebrow="المنصة" title="مؤشرات المنصة" subtitle="نظرة تنفيذية على أداء الـSaaS ككل." />

      {isLoading || !data ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="مغاسل نشطة" value={data.tenants.active} icon={<Icon d={P.building} size={15} />} />
            <Kpi label="MRR إجمالي" value={money(data.mrr)} tone="good" icon={<Icon d={P.wallet} size={15} />} />
            <Kpi label="فروع مُدارة" value={data.managedBranches} icon={<Icon d={P.spray} size={15} />} />
            <Kpi label="حسابات تجريبية" value={data.trialingSubscriptions} tone="warn" icon={<Icon d={P.clock} size={15} />} />
          </div>

          <Card>
            <CardHeader icon={<Icon d={P.building} />} title="توزيع الحسابات" />
            <CardBody>
              {[
                { label: 'نشطة', v: data.tenants.active, tone: 'var(--good)' },
                { label: 'تجريبية', v: data.tenants.trial, tone: 'var(--warn)' },
                { label: 'موقوفة', v: data.tenants.suspended, tone: 'var(--crit)' },
              ].map((r) => (
                <div key={r.label} className="mb-3">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span>{r.label}</span>
                    <span className="font-bold tabular-nums">{r.v}</span>
                  </div>
                  <div className="mt-1.5 h-[6px] overflow-hidden rounded-md bg-surface-2">
                    <div className="h-full rounded-md" style={{ width: `${data.tenants.total ? (r.v / data.tenants.total) * 100 : 0}%`, background: r.tone }} />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card striped className="t-amber">
            <CardHeader icon={<Icon d={P.alert} />} title="يحتاج انتباه" />
            <CardBody>
              <div className="flex flex-col gap-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">تذاكر دعم مفتوحة</span>
                  <b>{data.openTickets}</b>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">اشتراكات تجريبية تنتهي قريبًا</span>
                  <b>{data.trialingSubscriptions}</b>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
