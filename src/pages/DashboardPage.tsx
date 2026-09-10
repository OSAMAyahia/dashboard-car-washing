
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Card, CardBody, CardHeader, Kpi, Spinner } from '@/components/ui';

interface Dashboard {
  date: string;
  bookings: { total: number; completed: number; cancelled: number; noShow: number; walkIn: number };
  revenue: { collectedToday: number; avgTicket: number };
  liveOps: { carsInBranch: number; waiting: number; ready: number; lanesTotal: number };
  revenue7d: { date: string; orders: number; revenue: number }[];
  branchesToday: { branchId: string; name: string; orders: number; revenue: number }[];
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<Dashboard>('/reports/dashboard'),
    refetchInterval: 30_000,
  });

  return (
    <div>
      <PageHead eyebrow="نظرة عامة" title="لوحة اليوم" subtitle="ملخص تشغيلي لحظي عبر كل الفروع." />

      {isLoading || !data ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="حجوزات اليوم" value={data.bookings.total} icon={<Icon d={P.calendar} size={15} />} spark={data.revenue7d.map((d) => d.orders)} />
            <Kpi label="إيراد اليوم" value={money(data.revenue.collectedToday)} tone="good" icon={<Icon d={P.wallet} size={15} />} spark={data.revenue7d.map((d) => d.revenue)} />
            <Kpi label="متوسط الفاتورة" value={money(data.revenue.avgTicket)} icon={<Icon d={P.trend} size={15} />} />
            <Kpi label="No-Show / إلغاء" value={`${data.bookings.noShow} / ${data.bookings.cancelled}`} tone="warn" icon={<Icon d={P.alert} size={15} />} />
          </div>

          <Card>
            <CardHeader icon={<Icon d={P.activity} />} title="التشغيل اللحظي" meta="يتحدّث تلقائيًا" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="بانتظار الاستلام" value={data.liveOps.waiting} tone="warn" icon={<Icon d={P.clock} size={15} />} />
                <Kpi label="سيارات داخل الفرع" value={data.liveOps.carsInBranch} icon={<Icon d={P.car} size={15} />} />
                <Kpi label="جاهزة للتسليم" value={data.liveOps.ready} tone="good" icon={<Icon d={P.check} size={15} />} />
                <Kpi label="إجمالي المسارات" value={data.liveOps.lanesTotal} icon={<Icon d={P.spray} size={15} />} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<Icon d={P.building} />} title="أداء الفروع اليوم" meta="عدد السيارات" />
            <CardBody>
              {data.branchesToday.length === 0 ? (
                <p className="text-sm text-ink-faint">لا توجد طلبات مكتملة اليوم بعد.</p>
              ) : (
                data.branchesToday.map((b) => {
                  const max = Math.max(...data.branchesToday.map((x) => x.orders), 1);
                  return (
                    <div key={b.branchId} className="mb-3">
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span>{b.name}</span>
                        <span className="font-bold tabular-nums">{b.orders} · {money(b.revenue)}</span>
                      </div>
                      <div className="mt-1.5 h-[6px] overflow-hidden rounded-md bg-surface-2">
                        <div className="h-full rounded-md bg-gradient-to-l from-accent to-accent-deep" style={{ width: `${(b.orders / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
