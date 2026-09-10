import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { money } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Button, Card, CardBody, CardHeader, Cell, DataTable, Field, Input, Row, Select, Spinner, useToast } from '@/components/ui';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  isActive: boolean;
  expiresAt: string | null;
  maxRedemptions: number | null;
  redemptions: number;
  remaining: number | null;
  usable: boolean;
}

const discount = (c: Coupon) => (c.type === 'PERCENT' ? `${c.value}%` : money(c.value));
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export default function CouponsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const coupons = useQuery({ queryKey: ['coupons'], queryFn: () => api.get<Coupon[]>('/coupons') });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['coupons'] });
  const err = (e: unknown) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error');

  const [form, setForm] = useState({ code: '', type: 'PERCENT' as Coupon['type'], value: '', expiresAt: '', maxRedemptions: '' });
  const create = useMutation({
    mutationFn: () =>
      api.post('/coupons', {
        code: form.code,
        type: form.type,
        // percent is sent as-is; a fixed discount is entered in riyals and stored in halalas
        value: form.type === 'PERCENT' ? Number(form.value) : Math.round(Number(form.value) * 100),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
      }),
    onSuccess: () => {
      setForm({ code: '', type: 'PERCENT', value: '', expiresAt: '', maxRedemptions: '' });
      toast('أُضيف الكوبون');
      invalidate();
    },
    onError: err,
  });

  const toggle = useMutation({
    mutationFn: (c: Coupon) => api.patch(`/coupons/${c.id}`, { isActive: !c.isActive }),
    onSuccess: invalidate,
    onError: err,
  });
  const remove = useMutation({
    mutationFn: (c: Coupon) => api.del(`/coupons/${c.id}`),
    onSuccess: () => { toast('تم الحذف'); invalidate(); },
    onError: err,
  });

  const used = (coupons.data ?? []).reduce((a, c) => a + c.redemptions, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="النمو"
        title="الكوبونات"
        subtitle="أكواد خصم يطبّقها العميل عند الحجز. الخصم يُحتسب على المجموع قبل الدفع."
      />

      {coupons.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <DataTable
          head={<><Icon d={P.tag} /> الأكواد</>}
          meta={`${coupons.data?.length ?? 0} كوبون · ${used} استخدام`}
          columns={['الكود', 'الخصم', 'الاستخدام', 'ينتهي', 'الحالة', '']}
        >
          {(coupons.data ?? []).map((c) => (
            <Row key={c.id}>
              <Cell className="font-bold" dir="ltr">{c.code}</Cell>
              <Cell className="tabular-nums">{discount(c)}</Cell>
              <Cell className="tabular-nums">
                {c.redemptions}
                {c.maxRedemptions != null && <span className="text-ink-faint"> / {c.maxRedemptions}</span>}
              </Cell>
              <Cell className="tabular-nums">{day(c.expiresAt)}</Cell>
              <Cell>
                <Badge tone={c.usable ? 'good' : c.isActive ? 'warn' : 'muted'}>
                  {c.usable ? 'صالح' : !c.isActive ? 'متوقف' : c.remaining === 0 ? 'استُنفد' : 'منتهي'}
                </Badge>
              </Cell>
              <Cell>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => toggle.mutate(c)}>{c.isActive ? 'إيقاف' : 'تفعيل'}</Button>
                  {c.redemptions === 0 && (
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(c)}>حذف</Button>
                  )}
                </div>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}

      <Card>
        <CardHeader icon={<Icon d={P.plus} />} title="كوبون جديد" />
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-36">
              <Field label="الكود">
                <Input dir="ltr" placeholder="WELCOME10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </Field>
            </div>
            <div className="w-32">
              <Field label="النوع">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Coupon['type'] })}>
                  <option value="PERCENT">نسبة %</option>
                  <option value="FIXED">مبلغ ثابت</option>
                </Select>
              </Field>
            </div>
            <div className="w-24">
              <Field label={form.type === 'PERCENT' ? 'النسبة' : 'الريال'}>
                <Input dir="ltr" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </Field>
            </div>
            <div className="w-40">
              <Field label="ينتهي في (اختياري)">
                <Input type="date" dir="ltr" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </Field>
            </div>
            <div className="w-32">
              <Field label="حد الاستخدام">
                <Input dir="ltr" placeholder="بلا حد" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} />
              </Field>
            </div>
            <Button disabled={!form.code || !form.value || create.isPending} onClick={() => create.mutate()}>إضافة</Button>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">
            كوبون استُخدم مرة واحدة لا يُحذف — عطّله بدلًا من ذلك حتى تبقى الحجوزات السابقة مفهومة.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
