
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { money } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Button, Card, CardBody, CardHeader, Spinner, useToast } from '@/components/ui';

interface Plan {
  key: 'STARTER' | 'BUSINESS' | 'PRO' | 'WHITE_LABEL';
  name: string;
  priceMonthly: number;
  maxBranches: number | null;
}

export default function PlansPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['plans'], queryFn: () => api.get<Plan[]>('/platform/plans') });

  const setPrice = useMutation({
    mutationFn: ({ key, priceMonthly }: { key: string; priceMonthly: number }) => api.patch(`/platform/plans/${key}`, { priceMonthly }),
    onSuccess: () => { toast('تم تحديث السعر'); qc.invalidateQueries({ queryKey: ['plans'] }); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error'),
  });

  const tints = ['t-teal', 't-indigo', 't-violet', 't-amber'];

  return (
    <div className="flex flex-col gap-4">
      <PageHead eyebrow="المنصة" title="الباقات والأسعار" subtitle="نموذج إيرادات SaaS — اشتراك شهري متكرر." />

      {isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(data ?? []).map((p, i) => (
            <Card key={p.key} striped className={tints[i % 4]}>
              <CardHeader icon={<Icon d={p.key === 'WHITE_LABEL' ? P.contact : P.tag} />} title={p.name} />
              <CardBody>
                <div className="font-sans text-[24px] font-extrabold leading-none">
                  {p.priceMonthly ? money(p.priceMonthly) : 'مخصص'}
                  {p.priceMonthly ? <span className="text-[12px] font-semibold text-ink-faint"> / شهر</span> : null}
                </div>
                <div className="mt-2 text-[12px] text-ink-soft">
                  {p.maxBranches ? `حتى ${p.maxBranches} فروع` : 'فروع غير محدودة'}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => {
                    const v = prompt(`سعر باقة ${p.name} الشهري (ريال):`, String(p.priceMonthly / 100));
                    if (v && !isNaN(Number(v))) setPrice.mutate({ key: p.key, priceMonthly: Math.round(Number(v) * 100) });
                  }}
                >
                  تعديل السعر
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-dashed">
        <CardBody className="flex items-start gap-2.5">
          <Icon d={P.wallet} size={17} />
          <div>
            <b className="text-[12.5px]">رسوم التهيئة (Setup Fee)</b>
            <p className="mt-1 text-[12px] text-ink-soft">رسوم أولية استرشادية 2,000–5,000 ريال حسب حجم العميل ومستوى التخصيص.</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
