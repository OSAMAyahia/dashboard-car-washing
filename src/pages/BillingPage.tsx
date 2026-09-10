
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { money, shortDate } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Button, Cell, DataTable, Kpi, Row, Select, Spinner, useToast } from '@/components/ui';

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'DUE' | 'PAID' | 'OVERDUE' | 'VOID';
  issuedAt: string;
  tenant: { name: string; slug: string };
}

const STATUS = { DUE: { label: 'مستحقة', tone: 'warn' }, PAID: { label: 'مدفوعة', tone: 'good' }, OVERDUE: { label: 'متأخرة', tone: 'crit' }, VOID: { label: 'ملغاة', tone: 'muted' } } as const;

export default function BillingPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');

  const q = useQuery({
    queryKey: ['invoices', status],
    queryFn: () => api.get<{ rows: Invoice[]; total: number; collectedTotal: number }>('/platform/invoices', { status: status || undefined, pageSize: 50 }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['invoices'] });
  const err = (e: unknown) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error');

  const markPaid = useMutation({
    mutationFn: (id: string) => api.post(`/platform/invoices/${id}/mark-paid`),
    onSuccess: () => { toast('تم التحديد كمدفوعة'); invalidate(); }, onError: err,
  });
  const runBilling = useMutation({
    mutationFn: () => api.post<{ issued: number; rolled: number }>('/platform/billing/run'),
    onSuccess: (r) => { toast(`صدرت ${r.issued} فاتورة`); invalidate(); }, onError: err,
  });

  const due = (q.data?.rows ?? []).filter((i) => i.status === 'DUE' || i.status === 'OVERDUE');

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        eyebrow="الإدارة"
        title="الاشتراكات والفواتير"
        subtitle="دورة فوترة شهرية لكل مستأجر مع حالة الدفع."
        actions={
          <>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="تصفية حسب حالة الفاتورة" className="!w-auto !py-1.5 !text-[13px]">
              <option value="">كل الحالات</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
            <Button size="sm" disabled={runBilling.isPending} onClick={() => runBilling.mutate()}>تشغيل دورة الفوترة</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="إجمالي المحصّل" value={money(q.data?.collectedTotal ?? 0)} tone="good" icon={<Icon d={P.wallet} size={15} />} />
        <Kpi label="فواتير مستحقة" value={due.length} tone="warn" icon={<Icon d={P.clock} size={15} />} />
        <Kpi label="إجمالي الفواتير" value={q.data?.total ?? 0} icon={<Icon d={P.calendar} size={15} />} />
      </div>

      {q.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <DataTable head={<><Icon d={P.wallet} /> الفواتير</>} meta={`${q.data?.total ?? 0} فاتورة`} columns={['رقم الفاتورة', 'المغسلة', 'المبلغ', 'الحالة', 'التاريخ', '']}>
          {(q.data?.rows ?? []).map((inv) => (
            <Row key={inv.id}>
              <Cell className="font-mono">{inv.number}</Cell>
              <Cell className="font-semibold">{inv.tenant.name}</Cell>
              <Cell className="tabular-nums">{money(inv.amount)}</Cell>
              <Cell><Badge tone={STATUS[inv.status].tone}>{STATUS[inv.status].label}</Badge></Cell>
              <Cell className="text-ink-soft">{shortDate(inv.issuedAt)}</Cell>
              <Cell>
                {(inv.status === 'DUE' || inv.status === 'OVERDUE') && (
                  <Button size="sm" onClick={() => markPaid.mutate(inv.id)}>تحديد كمدفوعة</Button>
                )}
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}
