
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { relativeDay } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Cell, DataTable, Row, Select, Spinner, useToast } from '@/components/ui';

interface Complaint {
  id: string;
  subject: string;
  body: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  customer?: { name: string | null; phone: string | null; email: string | null } | null;
}

const STAT = { OPEN: 'مفتوحة', IN_PROGRESS: 'قيد المعالجة', RESOLVED: 'محلولة' } as const;

export default function ComplaintsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');

  const q = useQuery({
    queryKey: ['complaints', status],
    queryFn: () => api.get<{ rows: Complaint[]; total: number }>('/support/tickets', { status: status || undefined, pageSize: 50 }),
  });

  const update = useMutation({
    mutationFn: ({ id, status: s }: { id: string; status: Complaint['status'] }) => api.patch(`/support/tickets/${id}`, { status: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
    onError: (e) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error'),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="النمو"
        title="الشكاوى"
        subtitle="شكاوى العملاء عن الخدمة، مباشرة من حساباتهم."
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="تصفية حسب الحالة" className="!w-auto !py-1.5 !text-[13px]">
            <option value="">كل الحالات</option>
            {Object.entries(STAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        }
      />

      {q.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <DataTable head={<><Icon d={P.contact} /> شكاوى العملاء</>} meta={`${q.data?.total ?? 0} شكوى`} columns={['الموضوع', 'العميل', 'الحالة', 'العمر']}>
          {(q.data?.rows ?? []).map((t) => (
            <Row key={t.id}>
              <Cell><b>{t.subject}</b><div className="max-w-[46ch] truncate text-[11.5px] text-ink-faint">{t.body}</div></Cell>
              <Cell className="text-ink-soft">{t.customer?.name ?? t.customer?.phone ?? t.customer?.email ?? '—'}</Cell>
              <Cell>
                <Select value={t.status} onChange={(e) => update.mutate({ id: t.id, status: e.target.value as Complaint['status'] })} aria-label="حالة الشكوى" className="!w-32 !py-1 !text-[12px]">
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
