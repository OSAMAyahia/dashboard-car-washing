import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/lib/auth';
import { P } from '@/lib/icons';
import { ThemeToggle } from './theme-toggle';

/** Staff roles allowed to see a nav item — matches the backend's @Roles guards
 *  on that page's endpoints (catalog/branches/staff/coupons/reports are
 *  OWNER+MANAGER only). Omitted `roles` = every role can see it. */
type StaffRole = 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'WASHER';
const MANAGEMENT: StaffRole[] = ['OWNER', 'MANAGER'];

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: StaffRole[];
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const STAFF_NAV: NavGroup[] = [
  {
    title: 'نظرة عامة',
    items: [
      { to: '/', label: 'لوحة اليوم', icon: P.dashboard },
      { to: '/queue', label: 'الطابور', icon: P.activity },
      { to: '/bookings', label: 'الحجوزات', icon: P.calendar },
    ],
  },
  {
    title: 'الإعداد',
    items: [
      { to: '/catalog', label: 'الخدمات والأسعار', icon: P.tag, roles: MANAGEMENT },
      { to: '/branches', label: 'الفروع', icon: P.building, roles: MANAGEMENT },
      { to: '/staff', label: 'الموظفون', icon: P.users, roles: MANAGEMENT },
    ],
  },
  {
    title: 'النمو',
    items: [
      { to: '/customers', label: 'العملاء (CRM)', icon: P.contact },
      { to: '/coupons', label: 'الكوبونات', icon: P.tag, roles: MANAGEMENT },
    ],
  },
  { title: 'التحليلات', items: [{ to: '/reports', label: 'التقارير', icon: P.trend, roles: MANAGEMENT }] },
];

const PLATFORM_NAV: NavGroup[] = [
  {
    title: 'المنصة',
    items: [
      { to: '/platform', label: 'مؤشرات المنصة', icon: P.dashboard },
      { to: '/tenants', label: 'المغاسل المشتركة', icon: P.building },
      { to: '/plans', label: 'الباقات والأسعار', icon: P.tag },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { to: '/billing', label: 'الاشتراكات والفواتير', icon: P.wallet },
      { to: '/support', label: 'تذاكر الدعم', icon: P.contact },
    ],
  },
];

const SIDEBAR_W = 248;

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isPlatform = user?.type === 'platform';
  const role = user?.role as StaffRole | null;
  const staffNav = STAFF_NAV
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.roles || (role && it.roles.includes(role))) }))
    .filter((g) => g.items.length > 0);
  const nav = isPlatform ? PLATFORM_NAV : staffNav;
  const subtitle = isPlatform ? 'لوحة تحكم المنصة' : 'لوحة تشغيل المغسلة';
  const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/'));

  return (
    <div className="min-h-dvh bg-ground">
      {open && <button aria-label="إغلاق" onClick={() => setOpen(false)} className="fixed inset-0 z-[45] bg-[rgba(15,23,42,.42)] backdrop-blur-sm lg:hidden" />}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex flex-col border-l border-line bg-surface shadow-[var(--shadow)] transition-transform',
          'w-[min(82vw,280px)] translate-x-full lg:translate-x-0',
          open && '!translate-x-0',
        )}
        style={{ width: SIDEBAR_W }}
      >
        <div className="px-[18px] pb-4 pt-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-[130px] items-center justify-center rounded-xl border border-line bg-[var(--accent-wash)]">
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-gradient-to-br from-accent to-accent-deep text-white dark:text-[#0b1120]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.2s6 6.4 6 10.2a6 6 0 0 1-12 0c0-3.8 6-10.2 6-10.2Z" /></svg>
            </span>
          </div>
          <div className="text-[15px] font-extrabold text-ink">Car Wash OS</div>
          <div className="mt-1 text-[11px] font-semibold text-ink-faint">{subtitle}</div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
          {nav.map((g) => (
            <div key={g.title}>
              <div className="px-3 pb-1.5 pt-3 text-[10px] font-extrabold uppercase tracking-[0.11em] text-ink-faint">{g.title}</div>
              {g.items.map((it) => {
                const active = isActive(it.to);
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={cn(
                      'relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13.5px] font-medium transition-colors',
                      active ? 'bg-[var(--accent-wash)] font-bold text-accent' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    {active && <span className="sb-rail" />}
                    <span className="flex flex-none"><NavIcon d={it.icon} /></span>
                    <span className="flex-1">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-2.5 px-3 pb-[18px] pt-3.5">
          <button
            onClick={logout}
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-[10px] border border-line bg-transparent text-[13px] font-bold text-ink-faint transition hover:border-[rgba(226,61,78,.25)] hover:bg-crit-wash hover:text-crit"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M16 17l5-5-5-5M21 12H9" /></svg>
            تسجيل الخروج
          </button>
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 p-2.5">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-[var(--accent-wash)] text-[13px] font-extrabold text-accent">
              {(user?.name || 'U').trim().charAt(0)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-extrabold text-ink">{user?.name ?? 'مستخدم'}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-ink-faint">{isPlatform ? 'فريق المنصة' : 'مغسلة'}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pr-[248px]">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-4 py-3 backdrop-blur md:px-6">
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl border border-line bg-surface text-ink-soft lg:hidden"
            aria-label="القائمة"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>

          <div className="search-pill hidden max-w-[380px] flex-1 sm:flex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input placeholder="ابحث هنا…" aria-label="بحث" />
          </div>
          <div className="flex-1 sm:hidden" />

          <div className="hidden items-center gap-2 rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[13px] font-bold text-ink-soft lg:flex">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
            {today}
          </div>
          <ThemeToggle />
        </header>

        <main key={pathname} className="page-enter min-w-0 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHead({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        {eyebrow && <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-secondary-ink">{eyebrow}</span>}
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-[66ch] text-[13px] font-medium text-ink-faint">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
