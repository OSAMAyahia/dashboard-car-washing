
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { initials, tintOf } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Button, Card, CardBody, CardHeader, Cell, DataTable, Field, Input, Row, Select, Spinner, useToast } from '@/components/ui';

const ROLES = { OWNER: 'مالك', MANAGER: 'مدير', RECEPTIONIST: 'استقبال', WASHER: 'فني' } as const;
type Role = keyof typeof ROLES;

interface Staff {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  branchLinks: { branch: { id: string; name: string } }[];
}

export default function StaffPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['staff'], queryFn: () => api.get<Staff[]>('/staff') });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['staff'] });
  const err = (e: unknown) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error');

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'WASHER' as Role });
  const create = useMutation({
    mutationFn: () => api.post('/staff', form),
    onSuccess: () => { setForm({ name: '', email: '', password: '', role: 'WASHER' }); toast('أُضيف الموظف'); invalidate(); },
    onError: err,
  });
  const toggle = useMutation({
    mutationFn: (s: Staff) => api.patch(`/staff/${s.id}`, { isActive: !s.isActive }),
    onSuccess: invalidate, onError: err,
  });
  const reset = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => api.post(`/staff/${id}/reset-password`, { password }),
    onSuccess: () => toast('تم تغيير كلمة المرور'), onError: err,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHead eyebrow="الإعداد" title="الموظفون" subtitle="حساب مستقل لكل موظف بصلاحيات محددة." />

      <Card>
        <CardHeader icon={<Icon d={P.plus} />} title="إضافة موظف" />
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1"><Field label="الاسم"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
            <div className="min-w-[160px] flex-1"><Field label="البريد"><Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field></div>
            <div className="min-w-[120px]"><Field label="كلمة المرور"><Input type="text" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field></div>
            <div className="w-32"><Field label="الدور"><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field></div>
            <Button disabled={!form.name || !form.email || form.password.length < 8 || create.isPending} onClick={() => create.mutate()}>إضافة</Button>
          </div>
        </CardBody>
      </Card>

      {q.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <DataTable head={<><Icon d={P.users} /> فريق العمل</>} meta={`${q.data?.length ?? 0} موظفين`} columns={['الموظف', 'الدور', 'الفروع', 'الحالة', '']}>
          {(q.data ?? []).map((s) => (
            <Row key={s.id}>
              <Cell>
                <div className="flex items-center gap-2.5">
                  <span className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-full text-[11.5px] font-extrabold ${tintOf(s.name)}`} style={{ background: 'color-mix(in srgb, var(--tint) 15%, transparent)', color: 'var(--tint)' }}>{initials(s.name)}</span>
                  <div><b>{s.name}</b><div className="text-[11px] text-ink-faint" dir="ltr">{s.email}</div></div>
                </div>
              </Cell>
              <Cell><Badge>{ROLES[s.role]}</Badge></Cell>
              <Cell className="text-ink-soft">{s.branchLinks.map((l) => l.branch.name).join('، ') || '—'}</Cell>
              <Cell><Badge tone={s.isActive ? 'good' : 'muted'}>{s.isActive ? 'نشط' : 'موقوف'}</Badge></Cell>
              <Cell>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => { const p = prompt('كلمة مرور جديدة (8 أحرف على الأقل):'); if (p && p.length >= 8) reset.mutate({ id: s.id, password: p }); }}>كلمة المرور</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle.mutate(s)}>{s.isActive ? 'إيقاف' : 'تفعيل'}</Button>
                </div>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}
