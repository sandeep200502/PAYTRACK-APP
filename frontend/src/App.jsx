import { RouterProvider, useRouter } from './hooks/useRouter';
import { ToastProvider } from './hooks/useToast';
import { DataProvider, useData } from './hooks/useData';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ConfirmProvider } from './hooks/useConfirm';
import { ModalProvider } from './hooks/useModals';
import AppLayout from './layouts/AppLayout';
import ToastViewport from './components/Toast';
import { DashboardSkeleton } from './components/Skeleton';
import EmptyState from './components/EmptyState';
import Button from './components/Button';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceDetails from './pages/InvoiceDetails';
import InvoiceEditor from './pages/InvoiceEditor';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Payments from './pages/Payments';
import Overdue from './pages/Overdue';
import Reports from './pages/Reports';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import SmartTools from './pages/SmartTools';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import { CircleAlert } from 'lucide-react';

/** Maps the hash route to a page component. */
function Routes() {
  const { segments } = useRouter();
  const [section, id, sub] = segments;
  const { user } = useAuth();

  // The administrator has a separate, smaller app: only the Admin page.
  if (user?.role === 'ADMIN') return <Admin />;
  // Normal users never get the Admin page.
  if (section === 'admin') return <Dashboard />;

  switch (section) {
    case 'invoices':
      if (id === 'new') return <InvoiceEditor />;
      if (id && sub === 'edit') return <InvoiceEditor id={id} />;
      if (id) return <InvoiceDetails id={id} />;
      return <Invoices />;
    case 'customers':
      return id ? <CustomerDetails id={id} /> : <Customers />;
    case 'payments':
      return <Payments />;
    case 'overdue':
      return <Overdue />;
    case 'reports':
      return <Reports />;
    case 'reminders':
      return <Reminders />;
    case 'admin':
      return <Admin />;
    case 'tools':
      return <SmartTools />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
  }
}

function Shell() {
  const data = useData();
  if (data.loading) {
    return (
      <div className="min-h-screen lg:pl-64">
        <div className="fixed inset-y-0 left-0 hidden w-64 bg-[#0c1a33] lg:block" />
        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          {data.error ? (
            <div className="card">
              <EmptyState icon={CircleAlert} title="Couldn't load your data" message={data.error} action={<Button onClick={data.retry}>Try again</Button>} />
            </div>
          ) : (
            <DashboardSkeleton />
          )}
        </main>
      </div>
    );
  }
  return (
    <ModalProvider>
      <AppLayout>
        <Routes />
      </AppLayout>
    </ModalProvider>
  );
}

/**
 * The login gate. Without the API there is no login and the app opens directly.
 * With the API: no user -> Login / Register pages; user -> the app. Keying the app on
 * the user id throws away the previous user's data when someone else logs in.
 */
function AuthGate({ children }) {
  const { user, checking, authRequired } = useAuth();
  const { segments } = useRouter();
  if (!authRequired) return children;
  if (checking) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading...</div>;
  if (!user) return segments[0] === 'register' ? <Register /> : <Login />;
  return <div key={user.id}>{children}</div>;
}

export default function App() {
  return (
    <RouterProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthGate>
            <DataProvider>
              <ConfirmProvider>
                <Shell />
              </ConfirmProvider>
            </DataProvider>
          </AuthGate>
          <ToastViewport />
        </AuthProvider>
      </ToastProvider>
    </RouterProvider>
  );
}
