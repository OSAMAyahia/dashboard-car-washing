import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '@/lib/auth';
import { Field, Input } from '@/components/ui';

export function LoginPage() {
  const { loginSmart } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const user = await loginSmart(email.trim(), password);
      navigate(user.type === 'platform' ? '/platform' : '/', { replace: true });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'تعذّر تسجيل الدخول');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-grid">
        <aside className="login-aside">
          <span className="kicker">Car Wash OS</span>
          <h1>لوحة التحكم الموحّدة</h1>
          <p>
            إدارة المغسلة والمنصة من مكان واحد — الطابور والحجوزات والفروع والموظفين
            والتقارير، بالإضافة إلى إدارة المغاسل المشتركة والباقات والفوترة والدعم.
          </p>
          <div className="facts">
            <div className="fact"><b>الطابور</b><span>لحظي عبر الفروع</span></div>
            <div className="fact"><b>الحجوزات</b><span>إدارة كاملة</span></div>
            <div className="fact"><b>المنصة</b><span>مغاسل وفوترة</span></div>
          </div>
        </aside>

        <form onSubmit={submit} className="login-card">
          <div className="brand">
            <span className="mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.2s6 6.4 6 10.2a6 6 0 0 1-12 0c0-3.8 6-10.2 6-10.2Z" /></svg>
            </span>
            <b>Car Wash OS</b>
          </div>
          <h2>تسجيل الدخول</h2>
          <div className="sub">أدخل بريدك وكلمة المرور — سيتعرّف النظام على نوع حسابك تلقائيًا.</div>
          <div className="flex flex-col gap-4">
            <Field label="البريد الإلكتروني" error={err ? ' ' : null}>
              <Input type="email" autoComplete="username" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="كلمة المرور" error={err}>
              <Input type="password" autoComplete="current-password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <button type="submit" disabled={busy} className="login-submit">
              {busy ? 'لحظة…' : 'دخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
