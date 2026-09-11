import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { QueryProvider } from '@/lib/query';
import { ThemeProvider } from '@/lib/theme';
import { Shell } from '@/components/layout/shell';
import { Toaster, Spinner } from '@/components/ui';
import { LoginPage } from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import QueuePage from '@/pages/QueuePage';
import BookingsPage from '@/pages/BookingsPage';
import CatalogPage from '@/pages/CatalogPage';
import CouponsPage from '@/pages/CouponsPage';
import BranchesPage from '@/pages/BranchesPage';
import StaffPage from '@/pages/StaffPage';
import CustomersPage from '@/pages/CustomersPage';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import ReportsPage from '@/pages/ReportsPage';
import PlatformPage from '@/pages/PlatformPage';
import TenantsPage from '@/pages/TenantsPage';
import TenantDetailPage from '@/pages/TenantDetailPage';
import PlansPage from '@/pages/PlansPage';
import BillingPage from '@/pages/BillingPage';
import SupportPage from '@/pages/SupportPage';
import ComplaintsPage from '@/pages/ComplaintsPage';

function Gate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ground">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isPlatform = user.type === 'platform';

  return (
    <Shell>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        {isPlatform ? (
          <>
            <Route path="/" element={<Navigate to="/platform" replace />} />
            <Route path="/platform" element={<PlatformPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/tenants/:id" element={<TenantDetailPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/support" element={<SupportPage />} />
          </>
        ) : (
          <>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <Toaster>
            <Gate />
          </Toaster>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
