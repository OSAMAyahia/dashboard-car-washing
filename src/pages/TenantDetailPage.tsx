import { CustomerSiteLink } from '@/components/customer-site-link';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { money, shortDate } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Button, Card, CardBody, CardHeader, Kpi, Select, Spinner, useToast } from '@/components/ui';

type PlanKey = 'STARTER' | 'BUSINESS' | 'PRO' | 'WHITE_LABEL';

interface Detail {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  subscription: {
    planKey: PlanKey;
    status: string;
    currentPeriodEnd: string;
    plan: { name: string; priceMonthly: number };
  } | null;
  _count: { branches: number; staff: number; customers: number; bookings: number };
}

export default function TenantDetail() {
  const { id } = useParams();
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['tenant', id], queryFn: () => api.get<Detail>(`/platform/tenants/${id}`) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tenant', id] });
  const err = (e: unknown) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error');

  const changePlan = useMutation({
    mutationFn: (planKey: PlanKey) => api.patch(`/platform/tenants/${id}/subscription`, { planKey }),
    onSuccess: () => { toast('تم تغيير الباقة'); invalidate(); }, onError: err,
  });
  const cancel = useMutation({
    mutationFn: () => api.post(`/platform/tenants/${id}/subscription/cancel`),
    onSuccess: () => { toast('تم إلغاء الاشتراك'); invalidate(); }, onError: err,
  });

  if (isLoading || !data) return <Spinner className="h-6 w-6" />;
  const sub = data.subscription;

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="المغاسل"
        title={data.name}
        subtitle={`${data.slug} · مشترك منذ ${shortDate(data.createdAt)}`}
        actions={<Badge tone={data.status === 'ACTIVE' ? 'good' : data.status === 'TRIAL' ? 'warn' : 'crit'} dot>{data.status}</Badge>}
      />

      <CustomerSiteLink slug={data.slug} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="الفروع" value={data._count.branches} icon={<Icon d={P.building} size={15} />} />
        <Kpi label="الموظفون" value={data._count.staff} icon={<Icon d={P.users} size={15} />} />
        <Kpi label="العملاء" value={data._count.customers} icon={<Icon d={P.contact} size={15} />} />
        <Kpi label="الحجوزات" value={data._count.bookings} icon={<Icon d={P.calendar} size={15} />} />
      </div>

      <Card>
        <CardHeader icon={<Icon d={P.wallet} />} title="الاشتراك" meta={sub ? sub.status : 'لا يوجد'} />
        <CardBody>
          {sub ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 text-[13px]">
                <div className="flex justify-between"><span className="text-ink-faint">الباقة الحالية</span><b>{sub.plan.name}</b></div>
                <div className="flex justify-between"><span className="text-ink-faint">السعر الشهري</span><b>{sub.plan.priceMonthly ? money(sub.plan.priceMonthly) : 'مخصص'}</b></div>
                <div className="flex justify-between"><span className="text-ink-faint">نهاية الفترة</span><b>{shortDate(sub.currentPeriodEnd)}</b></div>
              </div>
              <div className="flex flex-wrap items-end gap-3 border-t border-line-soft pt-3">
                <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-ink-soft">
                  تغيير الباقة
                  <Select value={sub.planKey} onChange={(e) => changePlan.mutate(e.target.value as PlanKey)} className="!w-40">
                    <option value="STARTER">Starter</option><option value="BUSINESS">Business</option><option value="PRO">Pro</option><option value="WHITE_LABEL">White Label</option>
                  </Select>
                </label>
                {sub.status !== 'CANCELLED' && (
                  <Button variant="ghost" onClick={() => cancel.mutate()}>إلغاء الاشتراك</Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">لا يوجد اشتراك مرتبط.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
