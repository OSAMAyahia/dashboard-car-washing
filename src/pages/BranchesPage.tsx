
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useBranches } from '@/lib/hooks';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, Spinner, useToast } from '@/components/ui';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function BranchesPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const branches = useBranches();
  const [form, setForm] = useState({ name: '', laneCount: '2' });

  const create = useMutation({
    mutationFn: () => api.post('/branches', { name: form.name, laneCount: Number(form.laneCount) }),
    onSuccess: () => { setForm({ name: '', laneCount: '2' }); toast('أُضيف الفرع'); qc.invalidateQueries({ queryKey: ['branches'] }); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error'),
  });
  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/branches/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="الإعداد"
        title="الفروع"
        subtitle="لكل فرع ساعات عمل ومسارات وخدمات مستقلة."
      />

      <Card>
        <CardHeader icon={<Icon d={P.plus} />} title="فرع جديد" meta="يُبذر بساعات عمل افتراضية وكل الخدمات" />
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1"><Field label="اسم الفرع"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
            <div className="w-28"><Field label="عدد المسارات"><Input value={form.laneCount} onChange={(e) => setForm({ ...form, laneCount: e.target.value })} dir="ltr" /></Field></div>
            <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>إضافة فرع</Button>
          </div>
        </CardBody>
      </Card>

      {branches.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {(branches.data ?? []).map((b, i) => (
            <Card key={b.id} striped className={['t-teal', 't-violet', 't-amber', 't-green', 't-indigo', 't-rose'][i % 6]}>
              <CardHeader
                icon={<Icon d={P.building} />}
                title={b.name}
                meta={<Badge tone={b.isActive ? 'good' : 'muted'} dot>{b.isActive ? 'يعمل' : 'متوقف'}</Badge>}
              />
              <CardBody>
                <div className="flex flex-col gap-2 text-[13px]">
                  <div className="flex justify-between"><span className="text-ink-faint">مسارات الغسيل</span><b className="tabular-nums">{b.laneCount}</b></div>
                  <div className="flex justify-between"><span className="text-ink-faint">خدمات مفعّلة</span><b className="tabular-nums">{b._count?.branchServices ?? '—'}</b></div>
                  <div className="flex justify-between"><span className="text-ink-faint">موظفون</span><b className="tabular-nums">{b._count?.staffLinks ?? '—'}</b></div>
                </div>
                <div className="mt-3 border-t border-line-soft pt-3 text-[11.5px] text-ink-soft">
                  {b.workingHours.filter((h) => !h.isClosed).map((h) => `${DAYS[h.weekday]} ${h.opensAt}–${h.closesAt}`).slice(0, 2).join(' · ') || 'مغلق طوال الأسبوع'}
                </div>
                <Button size="sm" variant="ghost" className="mt-3" onClick={() => toggle.mutate({ id: b.id, isActive: !b.isActive })}>
                  {b.isActive ? 'إيقاف الفرع' : 'تفعيل الفرع'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
