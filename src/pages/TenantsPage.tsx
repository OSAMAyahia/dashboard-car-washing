
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { initials, money, tintOf } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Button, Card, CardBody, CardHeader, Cell, DataTable, Field, Input, Row, Select, Spinner, useToast } from '@/components/ui';

type PlanKey = 'STARTER' | 'BUSINESS' | 'PRO' | 'WHITE_LABEL';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  subscription: { planKey: PlanKey } | null;
  _count: { branches: number; staff: number; customers: number };
}

const STATUS = { TRIAL: { label: 'تجريبي', tone: 'warn' }, ACTIVE: { label: 'نشط', tone: 'good' }, SUSPENDED: { label: 'موقوف', tone: 'crit' } } as const;

export default function TenantsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);

  const list = useQuery({
    queryKey: ['tenants', q, status],
    queryFn: () => api.get<{ rows: TenantRow[]; total: number }>('/platform/tenants', { q: q || undefined, status: status || undefined, pageSize: 50 }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tenants'] });

  const [form, setForm] = useState({ name: '', slug: '', planKey: 'STARTER' as PlanKey, ownerName: '', ownerEmail: '', ownerPassword: '' });
  const create = useMutation({
    mutationFn: () =>
      api.post('/platform/tenants', {
        name: form.name,
        slug: form.slug,
        planKey: form.planKey,
        owner: { name: form.ownerName, email: form.ownerEmail, password: form.ownerPassword },
      }),
    onSuccess: () => { setShowForm(false); setForm({ name: '', slug: '', planKey: 'STARTER', ownerName: '', ownerEmail: '', ownerPassword: '' }); toast('أُنشئت المغسلة'); invalidate(); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error'),
  });
  const toggle = useMutation({
    mutationFn: (t: TenantRow) => api.patch(`/platform/tenants/${t.id}/status`, { status: t.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }),
    onSuccess: () => { toast('تم تحديث الحالة'); invalidate(); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error'),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="المنصة"
        title="المغاسل المشتركة"
        subtitle="كل مغسلة حساب مستقل (Multi-Tenant)."
        actions={
          <>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث" aria-label="بحث عن مغسلة" className="!w-40 !py-1.5 !text-[13px]" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="تصفية حسب حالة المغسلة" className="!w-auto !py-1.5 !text-[13px]">
              <option value="">كل الحالات</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
            <Button size="sm" onClick={() => setShowForm((s) => !s)}>+ حساب جديد</Button>
          </>
        }
      />

      {showForm && (
        <Card>
          <CardHeader icon={<Icon d={P.plus} />} title="مغسلة جديدة" meta="تُنشأ باشتراك تجريبي 14 يوم" />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="اسم المغسلة"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="المعرّف (slug)"><Input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="demo" /></Field>
              <Field label="الباقة"><Select value={form.planKey} onChange={(e) => setForm({ ...form, planKey: e.target.value as PlanKey })}><option value="STARTER">Starter</option><option value="BUSINESS">Business</option><option value="PRO">Pro</option><option value="WHITE_LABEL">White Label</option></Select></Field>
              <Field label="اسم المالك"><Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></Field>
              <Field label="بريد المالك"><Input type="email" dir="ltr" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /></Field>
              <Field label="كلمة مرور مبدئية"><Input type="text" dir="ltr" value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} /></Field>
            </div>
            <Button className="mt-3" disabled={create.isPending || !form.name || !form.slug || form.ownerPassword.length < 8} onClick={() => create.mutate()}>إنشاء</Button>
          </CardBody>
        </Card>
      )}

      {list.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <DataTable head={<><Icon d={P.building} /> حسابات المغاسل</>} meta={`${list.data?.total ?? 0} حساب`} columns={['المغسلة', 'الباقة', 'الفروع', 'المستخدمون', 'الحالة', '']}>
          {(list.data?.rows ?? []).map((t) => (
            <Row key={t.id}>
              <Cell>
                <Link to={`/tenants/${t.id}`} className="flex items-center gap-2.5">
                  <span className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-full text-[11.5px] font-extrabold ${tintOf(t.name)}`} style={{ background: 'color-mix(in srgb, var(--tint) 15%, transparent)', color: 'var(--tint)' }}>{initials(t.name)}</span>
                  <div><b>{t.name}</b><div className="text-[11px] text-ink-faint" dir="ltr">{t.slug}</div></div>
                </Link>
              </Cell>
              <Cell><Badge>{t.subscription?.planKey ?? '—'}</Badge></Cell>
              <Cell className="tabular-nums">{t._count.branches}</Cell>
              <Cell className="tabular-nums">{t._count.staff}</Cell>
              <Cell><Badge tone={STATUS[t.status].tone} dot>{STATUS[t.status].label}</Badge></Cell>
              <Cell><Button size="sm" variant="ghost" onClick={() => toggle.mutate(t)}>{t.status === 'SUSPENDED' ? 'تفعيل' : 'إيقاف'}</Button></Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}
