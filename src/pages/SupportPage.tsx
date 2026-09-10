
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { relativeDay } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Cell, DataTable, Row, Select, Spinner, useToast } from '@/components/ui';

interface Ticket {
  id: string;
  subject: string;
  body: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  tenant?: { name: string; slug: string };
}

const PRIO = { LOW: { label: 'منخفض', tone: 'muted' }, NORMAL: { label: 'عادي', tone: 'muted' }, HIGH: { label: 'مرتفع', tone: 'warn' }, CRITICAL: { label: 'حرج', tone: 'crit' } } as const;
const STAT = { OPEN: 'مفتوح', IN_PROGRESS: 'قيد المعالجة', RESOLVED: 'محلول' } as const;

export default function SupportPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState('OPEN');

  const q = useQuery({
    queryKey: ['tickets', status],
    queryFn: () => api.get<{ rows: Ticket[]; total: number }>('/platform/support', { status: status || undefined, pageSize: 50 }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<Ticket, 'status' | 'priority'>> }) => api.patch(`/platform/support/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
    onError: (e) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error'),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="الإدارة"
        title="تذاكر الدعم"
        subtitle="طلبات المغاسل المشتركة مصنّفة حسب الأولوية."
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="تصفية حسب حالة التذكرة" className="!w-auto !py-1.5 !text-[13px]">
            <option value="">الكل</option>
            {Object.entries(STAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        }
      />

      {q.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <DataTable head={<><Icon d={P.contact} /> التذاكر</>} meta={`${q.data?.total ?? 0} تذكرة`} columns={['الموضوع', 'المغسلة', 'الأولوية', 'الحالة', 'العمر']}>
          {(q.data?.rows ?? []).map((t) => (
            <Row key={t.id}>
              <Cell><b>{t.subject}</b><div className="max-w-[40ch] truncate text-[11.5px] text-ink-faint">{t.body}</div></Cell>
              <Cell className="text-ink-soft">{t.tenant?.name ?? '—'}</Cell>
              <Cell>
                <Select value={t.priority} onChange={(e) => update.mutate({ id: t.id, patch: { priority: e.target.value as Ticket['priority'] } })} aria-label="أولوية التذكرة" className="!w-28 !py-1 !text-[12px]">
                  {Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
              </Cell>
              <Cell>
                <Select value={t.status} onChange={(e) => update.mutate({ id: t.id, patch: { status: e.target.value as Ticket['status'] } })} aria-label="حالة التذكرة" className="!w-32 !py-1 !text-[12px]">
                  {Object.entries(STAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Cell>
              <Cell className="text-ink-soft">{relativeDay(t.createdAt)}</Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}
