
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useBranches } from '@/lib/hooks';
import { money, time } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Button, Cell, DataTable, Row, Select, Spinner, useToast } from '@/components/ui';

type Status = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'NO_SHOW' | 'CANCELLED';
const LABEL: Record<Status, string> = {
  PENDING: 'بانتظار الدفع', CONFIRMED: 'مؤكد', IN_PROGRESS: 'قيد التنفيذ',
  DONE: 'مكتمل', NO_SHOW: 'لم يحضر', CANCELLED: 'ملغى',
};
const TONE: Record<Status, 'accent' | 'good' | 'warn' | 'crit' | 'muted'> = {
  PENDING: 'warn', CONFIRMED: 'good', IN_PROGRESS: 'accent', DONE: 'muted', NO_SHOW: 'crit', CANCELLED: 'crit',
};

interface Booking {
  id: string;
  scheduledAt: string;
  status: Status;
  total: number;
  source: 'ONLINE' | 'WALK_IN';
  customer: { name: string | null; phone: string };
  vehicle: { plate: string };
  service: { name: string };
  branch: { name: string };
  workOrder: { id: string } | null;
}

export default function BookingsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const branches = useBranches();
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const q = useQuery({
    queryKey: ['bookings', branchId, status, date],
    queryFn: () =>
      api.get<{ rows: Booking[]; total: number }>('/staff/bookings', {
        branchId: branchId || undefined,
        status: status || undefined,
        date: date || undefined,
        pageSize: 50,
      }),
  });

  const receive = useMutation({
    mutationFn: (bookingId: string) => api.post('/staff/work-orders', { bookingId }),
    onSuccess: () => { toast('تم استلام السيارة'); qc.invalidateQueries({ queryKey: ['bookings'] }); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error'),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => api.post(`/staff/bookings/${id}/cancel`),
    onSuccess: () => { toast('تم الإلغاء'); qc.invalidateQueries({ queryKey: ['bookings'] }); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error'),
  });

  return (
    <div>
      <PageHead
        eyebrow="نظرة عامة"
        title="الحجوزات"
        subtitle="كل الحجوزات عبر الفروع مع الحالة."
        actions={
          <>
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} aria-label="تصفية حسب الفرع" className="!w-auto !py-1.5 !text-[13px]">
              <option value="">كل الفروع</option>
              {branches.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="تصفية حسب حالة الحجز" className="!w-auto !py-1.5 !text-[13px]">
              <option value="">كل الحالات</option>
              {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="تصفية حسب التاريخ" className="rounded-[9px] border border-line bg-surface px-2.5 py-1.5 text-[13px]" />
          </>
        }
      />

      {q.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <DataTable
          head={<><Icon d={P.calendar} /> جدول اليوم</>}
          meta={`${q.data?.total ?? 0} حجز`}
          columns={['الموعد', 'العميل', 'السيارة', 'الخدمة', 'الفرع', 'المبلغ', 'الحالة', '']}
        >
          {(q.data?.rows ?? []).map((b) => (
            <Row key={b.id}>
              <Cell className="tabular-nums">{time(b.scheduledAt)}</Cell>
              <Cell className="font-semibold">{b.customer.name ?? b.customer.phone}</Cell>
              <Cell className="font-mono">{b.vehicle.plate}</Cell>
              <Cell>{b.service.name}</Cell>
              <Cell className="text-ink-soft">{b.branch.name}</Cell>
              <Cell className="tabular-nums">{money(b.total)}</Cell>
              <Cell><Badge tone={TONE[b.status]}>{LABEL[b.status]}</Badge></Cell>
              <Cell>
                <div className="flex gap-1.5">
                  {!b.workOrder && ['PENDING', 'CONFIRMED'].includes(b.status) && (
                    <Button size="sm" onClick={() => receive.mutate(b.id)}>استلام</Button>
                  )}
                  {!['DONE', 'CANCELLED'].includes(b.status) && (
                    <Button size="sm" variant="ghost" onClick={() => cancel.mutate(b.id)}>إلغاء</Button>
                  )}
                </div>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}
