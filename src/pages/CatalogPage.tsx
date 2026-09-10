import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { money } from '@/lib/format';
import { P, Icon } from '@/lib/icons';
import { PageHead } from '@/components/layout/shell';
import { Badge, Button, Card, CardBody, CardHeader, Cell, DataTable, Field, Input, Row, Spinner, useToast } from '@/components/ui';

export interface VehicleSize {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}
interface Service {
  id: string;
  name: string;
  durationMin: number;
  isActive: boolean;
  prices: { sizeId: string; price: number }[];
}
interface Addon { id: string; name: string; price: number; isActive: boolean }

const priceFor = (s: Service, sizeId: string) => s.prices.find((p) => p.sizeId === sizeId)?.price ?? 0;
const riyals = (halalas: number) => String(halalas / 100);

export default function CatalogPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const sizes = useQuery({ queryKey: ['vehicle-sizes'], queryFn: () => api.get<VehicleSize[]>('/vehicle-sizes') });
  const services = useQuery({ queryKey: ['services'], queryFn: () => api.get<Service[]>('/services') });
  const addons = useQuery({ queryKey: ['addons'], queryFn: () => api.get<Addon[]>('/addons') });

  const activeSizes = (sizes.data ?? []).filter((s) => s.isActive);

  const invalidate = () => {
    for (const k of ['services', 'addons', 'vehicle-sizes']) qc.invalidateQueries({ queryKey: [k] });
  };
  const err = (e: unknown) => toast(e instanceof ApiError ? e.message : 'خطأ', 'error');

  const toggleService = useMutation({
    mutationFn: (s: Service) => api.patch(`/services/${s.id}`, { isActive: !s.isActive }),
    onSuccess: invalidate, onError: err,
  });
  const setPrices = useMutation({
    mutationFn: ({ id, prices }: { id: string; prices: { sizeId: string; price: number }[] }) =>
      api.put(`/services/${id}/prices`, { prices }),
    onSuccess: () => { setEditing(null); toast('تم تحديث الأسعار'); invalidate(); }, onError: err,
  });
  const toggleAddon = useMutation({
    mutationFn: (a: Addon) => api.patch(`/addons/${a.id}`, { isActive: !a.isActive }),
    onSuccess: invalidate, onError: err,
  });

  // inline price editor: one draft row keyed by sizeId, held in riyals
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const startEdit = (s: Service) => {
    setEditing(s.id);
    setDraft(Object.fromEntries(activeSizes.map((z) => [z.id, riyals(priceFor(s, z.id))])));
  };
  const saveEdit = (s: Service) =>
    setPrices.mutate({
      id: s.id,
      prices: activeSizes.map((z) => ({ sizeId: z.id, price: Math.round(Number(draft[z.id] || 0) * 100) })),
    });

  const [newSvc, setNewSvc] = useState<{ name: string; durationMin: string; prices: Record<string, string> }>({
    name: '', durationMin: '45', prices: {},
  });
  const createService = useMutation({
    mutationFn: () =>
      api.post('/services', {
        name: newSvc.name,
        durationMin: Number(newSvc.durationMin),
        prices: activeSizes.map((z) => ({ sizeId: z.id, price: Math.round(Number(newSvc.prices[z.id] || 0) * 100) })),
      }),
    onSuccess: () => { setNewSvc({ name: '', durationMin: '45', prices: {} }); toast('أُضيفت الخدمة'); invalidate(); },
    onError: err,
  });

  const [newAddon, setNewAddon] = useState({ name: '', price: '' });
  const createAddon = useMutation({
    mutationFn: () => api.post('/addons', { name: newAddon.name, price: Math.round(Number(newAddon.price) * 100) }),
    onSuccess: () => { setNewAddon({ name: '', price: '' }); toast('أُضيفت الإضافة'); invalidate(); },
    onError: err,
  });

  const [newSize, setNewSize] = useState({ code: '', name: '' });
  const createSize = useMutation({
    mutationFn: () => api.post('/vehicle-sizes', { code: newSize.code, name: newSize.name, sortOrder: sizes.data?.length ?? 0 }),
    onSuccess: () => { setNewSize({ code: '', name: '' }); toast('أُضيف الحجم'); invalidate(); },
    onError: err,
  });
  const toggleSize = useMutation({
    mutationFn: (z: VehicleSize) => api.patch(`/vehicle-sizes/${z.id}`, { isActive: !z.isActive }),
    onSuccess: invalidate, onError: err,
  });
  const renameSize = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patch(`/vehicle-sizes/${id}`, { name }),
    onSuccess: () => { toast('تم التعديل'); invalidate(); }, onError: err,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHead eyebrow="الإعداد" title="الخدمات والأسعار" subtitle="تحكّم كامل في الخدمات والمدة والأسعار حسب حجم السيارة — الأسعار بالريال." />

      {services.isLoading || sizes.isLoading ? (
        <Spinner className="h-6 w-6" />
      ) : (
        <DataTable
          head={<><Icon d={P.tag} /> قائمة الخدمات</>}
          meta={`${services.data?.length ?? 0} خدمات`}
          columns={['الخدمة', 'المدة', ...activeSizes.map((z) => z.name), 'الحالة', '']}
          minWidth={520 + activeSizes.length * 90}
        >
          {(services.data ?? []).map((s) => (
            <Row key={s.id}>
              <Cell className="font-semibold">{s.name}</Cell>
              <Cell className="tabular-nums">{s.durationMin} د</Cell>
              {activeSizes.map((z) => (
                <Cell key={z.id} className="tabular-nums">
                  {editing === s.id ? (
                    <Input
                      className="w-20 px-2 py-1 text-[13px]"
                      dir="ltr"
                      value={draft[z.id] ?? ''}
                      onChange={(e) => setDraft({ ...draft, [z.id]: e.target.value })}
                    />
                  ) : (
                    money(priceFor(s, z.id))
                  )}
                </Cell>
              ))}
              <Cell><Badge tone={s.isActive ? 'good' : 'muted'}>{s.isActive ? 'مفعّلة' : 'متوقفة'}</Badge></Cell>
              <Cell>
                <div className="flex gap-1.5">
                  {editing === s.id ? (
                    <>
                      <Button size="sm" disabled={setPrices.isPending} onClick={() => saveEdit(s)}>حفظ</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>إلغاء</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={() => startEdit(s)}>تعديل الأسعار</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleService.mutate(s)}>{s.isActive ? 'إيقاف' : 'تفعيل'}</Button>
                    </>
                  )}
                </div>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}

      <Card>
        <CardHeader icon={<Icon d={P.plus} />} title="خدمة جديدة" />
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[150px] flex-1"><Field label="الاسم"><Input value={newSvc.name} onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })} /></Field></div>
            <div className="w-24"><Field label="المدة (د)"><Input value={newSvc.durationMin} onChange={(e) => setNewSvc({ ...newSvc, durationMin: e.target.value })} dir="ltr" /></Field></div>
            {activeSizes.map((z) => (
              <div className="w-20" key={z.id}>
                <Field label={z.name}>
                  <Input
                    dir="ltr"
                    value={newSvc.prices[z.id] ?? ''}
                    onChange={(e) => setNewSvc({ ...newSvc, prices: { ...newSvc.prices, [z.id]: e.target.value } })}
                  />
                </Field>
              </div>
            ))}
            <Button disabled={!newSvc.name || !activeSizes.length || createService.isPending} onClick={() => createService.mutate()}>إضافة</Button>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">الأسعار بالريال (تُحوّل تلقائيًا).</p>
        </CardBody>
      </Card>

      <Card striped className="t-sky" data-testid="size-bands">
        <CardHeader icon={<Icon d={P.car} />} title="أحجام السيارات" meta="أنت من يحدد الفئات" />
        <CardBody>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {(sizes.data ?? []).map((z) => (
              <div key={z.id} data-testid={`size-${z.code}`} className="flex items-center justify-between rounded-[11px] border border-line p-3">
                <div>
                  <b className="text-[13px]">{z.name}</b>
                  <div className="text-[11.5px] text-ink-faint" dir="ltr">{z.code}</div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const name = prompt(`الاسم المعروض لـ "${z.code}":`, z.name);
                      if (name && name !== z.name) renameSize.mutate({ id: z.id, name });
                    }}
                  >
                    تسمية
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleSize.mutate(z)}>{z.isActive ? 'إيقاف' : 'تفعيل'}</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line-soft pt-3">
            <div className="w-28"><Field label="الرمز"><Input value={newSize.code} onChange={(e) => setNewSize({ ...newSize, code: e.target.value.toUpperCase() })} dir="ltr" placeholder="XL" /></Field></div>
            <div className="min-w-[150px] flex-1"><Field label="الاسم المعروض"><Input value={newSize.name} onChange={(e) => setNewSize({ ...newSize, name: e.target.value })} placeholder="دفع رباعي" /></Field></div>
            <Button disabled={!newSize.code || !newSize.name || createSize.isPending} onClick={() => createSize.mutate()}>إضافة</Button>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">بعد إضافة حجم جديد، حدّث أسعار كل خدمة ليظهر للعملاء.</p>
        </CardBody>
      </Card>

      <Card striped className="t-amber">
        <CardHeader icon={<Icon d={P.plus} />} title="الخدمات الإضافية (Add-ons)" meta="تُباع فوق أي باقة" />
        <CardBody>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {(addons.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-[11px] border border-line p-3">
                <div><b className="text-[13px]">{a.name}</b><div className="text-[11.5px] text-ink-faint">{money(a.price)}</div></div>
                <Button size="sm" variant="ghost" onClick={() => toggleAddon.mutate(a)}>{a.isActive ? 'إيقاف' : 'تفعيل'}</Button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line-soft pt-3">
            <div className="min-w-[150px] flex-1"><Field label="إضافة جديدة"><Input value={newAddon.name} onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })} /></Field></div>
            <div className="w-24"><Field label="السعر (ريال)"><Input value={newAddon.price} onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })} dir="ltr" /></Field></div>
            <Button disabled={!newAddon.name || createAddon.isPending} onClick={() => createAddon.mutate()}>إضافة</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
