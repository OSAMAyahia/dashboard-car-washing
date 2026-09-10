
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useBranches } from '@/lib/hooks';
import { useQueueSocket } from '@/lib/queue-socket';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Field, Input, Select, Spinner, useToast } from '@/components/ui';

type Stage = 'RECEIVED' | 'WASHING' | 'FINISHING' | 'READY' | 'DELIVERED';
const STAGES: { key: Stage; label: string; dot: string }[] = [
  { key: 'RECEIVED', label: 'بانتظار الاستلام', dot: 'var(--warn)' },
  { key: 'WASHING', label: 'قيد الغسيل', dot: 'var(--accent)' },
  { key: 'FINISHING', label: 'تجفيف / تشطيب', dot: 'var(--accent-deep)' },
  { key: 'READY', label: 'جاهزة للاستلام', dot: 'var(--good)' },
];

interface WorkOrder {
  id: string;
  stage: Stage;
  etaMinutes: number;
  booking: {
    source: 'ONLINE' | 'WALK_IN';
    service: { name: string };
    customer: { name: string | null };
    vehicle: { plate: string; label: string | null };
  };
}

export default function QueuePage() {
  const toast = useToast();
  const qc = useQueryClient();
  const branches = useBranches();
  const [branchId, setBranchId] = useState<string>();

  useEffect(() => {
    if (!branchId && branches.data?.length) setBranchId(branches.data[0]!.id);
  }, [branches.data, branchId]);

  const queue = useQuery({
    queryKey: ['queue', branchId],
    queryFn: () => api.get<WorkOrder[]>('/staff/work-orders', { branchId: branchId! }),
    enabled: !!branchId,
    refetchInterval: 20_000,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['queue', branchId] });
  }, [qc, branchId]);
  useQueueSocket(branchId, refresh);

  const advance = useMutation({
    mutationFn: (id: string) => api.post(`/staff/work-orders/${id}/advance`),
    onSuccess: refresh,
    onError: (e) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error'),
  });
  const back = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: Stage }) => api.post(`/staff/work-orders/${id}/stage`, { stage }),
    onSuccess: refresh,
  });

  const [wp, setWp] = useState('');
  const [wc, setWc] = useState('');
  const [ws, setWs] = useState('');
  const [wz, setWz] = useState('');
  const services = useQuery({ queryKey: ['services'], queryFn: () => api.get<{ id: string; name: string }[]>('/services') });
  const sizes = useQuery({
    queryKey: ['vehicle-sizes'],
    queryFn: () => api.get<{ id: string; name: string; isActive: boolean }[]>('/vehicle-sizes'),
  });
  const activeSizes = (sizes.data ?? []).filter((z) => z.isActive);
  useEffect(() => { if (!ws && services.data?.length) setWs(services.data[0]!.id); }, [services.data, ws]);
  useEffect(() => { if (!wz && activeSizes.length) setWz(activeSizes[0]!.id); }, [activeSizes, wz]);

  const walkIn = useMutation({
    mutationFn: () =>
      api.post('/staff/work-orders/walk-in', {
        branchId,
        phone: wp,
        vehicle: { plate: wc || 'سيارة', sizeId: wz },
        serviceId: ws,
      }),
    onSuccess: () => {
      setWp(''); setWc('');
      toast('تمت إضافة السيارة إلى الطابور');
      refresh();
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'تعذّرت الإضافة', 'error'),
  });

  return (
    <div>
      <PageHead
        eyebrow="نظرة عامة"
        title="الطابور والاستلام"
        subtitle="طابور موحّد للحجوزات والعملاء المباشرين. حرّك السيارة بين المراحل."
        actions={
          <Select value={branchId ?? ''} onChange={(e) => setBranchId(e.target.value)} aria-label="اختيار الفرع" className="!w-auto !py-1.5 !text-[13px]">
            {branches.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        }
      />

      <Card className="mb-4">
        <CardHeader icon={<Icon d={P.plus} />} title="تسجيل عميل مباشر (Walk-in)" meta="يستغرق ثوانٍ" />
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[150px] flex-1"><Field label="رقم الجوال"><Input value={wp} onChange={(e) => setWp(e.target.value)} dir="ltr" placeholder="05XXXXXXXX" /></Field></div>
            <div className="min-w-[140px] flex-1"><Field label="نوع السيارة"><Input value={wc} onChange={(e) => setWc(e.target.value)} placeholder="كامري" /></Field></div>
            <div className="min-w-[130px] flex-1"><Field label="الحجم"><Select value={wz} onChange={(e) => setWz(e.target.value)}>{activeSizes.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</Select></Field></div>
            <div className="min-w-[160px] flex-1"><Field label="الخدمة"><Select value={ws} onChange={(e) => setWs(e.target.value)}>{services.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field></div>
            <Button onClick={() => walkIn.mutate()} disabled={walkIn.isPending || !wp || !wz}>{<Icon d={P.plus} size={15} />} إضافة للطابور</Button>
          </div>
        </CardBody>
      </Card>

      {!branchId || queue.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((st, si) => {
            const inLane = (queue.data ?? []).filter((w) => w.stage === st.key);
            return (
              <div key={st.key} className="flex flex-col overflow-hidden rounded-card border border-line bg-surface-2">
                <div className="flex items-center gap-2.5 border-b border-line bg-surface px-3 py-2.5">
                  <span className="h-2 w-2 flex-none rounded-full" style={{ background: st.dot }} />
                  <span className="flex-1 text-[12.5px] font-extrabold">{st.label}</span>
                  <span className="grid h-5 min-w-[22px] place-items-center rounded-full border border-line bg-surface-2 px-1.5 text-[11px] font-extrabold text-ink-soft">{inLane.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-2.5">
                  {inLane.length === 0 && <EmptyState icon={<Icon d={P.check} size={22} />}>لا توجد سيارات</EmptyState>}
                  {inLane.map((w) => (
                    <div key={w.id} className="rounded-xl border border-line bg-surface p-3 shadow-card">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[13px] font-semibold">{w.booking.vehicle.plate}</span>
                        <Badge tone={w.booking.source === 'ONLINE' ? 'accent' : 'muted'}>{w.booking.source === 'ONLINE' ? 'حجز' : 'Walk-in'}</Badge>
                      </div>
                      <div className="mt-1 text-[11.5px] font-semibold text-ink-soft">{w.booking.vehicle.label || w.booking.service.name} — {w.booking.customer.name ?? 'عميل'}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px] font-bold text-ink-soft">
                        <span className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5">{w.booking.service.name}</span>
                        {st.key !== 'READY' && <span className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5">{w.etaMinutes} د</span>}
                      </div>
                      <div className="mt-2.5 flex gap-1.5">
                        <Button size="sm" className="flex-1 justify-center" disabled={advance.isPending} onClick={() => advance.mutate(w.id)}>
                          {si === 0 ? 'بدء الخدمة' : 'التالي'} <Icon d={P.chevronL} size={13} />
                        </Button>
                        {si > 0 && (
                          <Button size="sm" variant="ghost" title="رجوع" onClick={() => back.mutate({ id: w.id, stage: STAGES[si - 1]!.key })}>
                            <Icon d={P.chevronR} size={13} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
