import { useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { setAuthTokenGetter, useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Link } from 'wouter';
import { LoaderCircle, LockKeyhole } from 'lucide-react';
import LandingPage from '@/pages/landing';
import AuthPage from '@/pages/auth';
import DashboardPage from '@/pages/dashboard';
import NewDebugPage from '@/pages/debug-new';
import DebugDetailPage from '@/pages/debug-detail';
import NotFound from '@/pages/not-found';
import { queryClient } from '@/lib/query-client';

function AuthGate({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem('tracefixer-token');
  const current = useGetCurrentUser({
    query: { enabled: Boolean(token), queryKey: getGetCurrentUserQueryKey(), retry: false },
  });
  useEffect(() => {
    if (!token) setLocation('/login');
    else if (current.isError) {
      localStorage.removeItem('tracefixer-token');
      setLocation('/login');
    }
  }, [token, current.isError, setLocation]);
  if (!token || current.isLoading || current.isError) return (
    <div className="min-h-[100dvh] grid place-items-center bg-background px-5">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm" data-testid="state-auth-loading">
        {current.isError ? <LockKeyhole className="mx-auto mb-3 text-muted-foreground" /> : <LoaderCircle className="mx-auto mb-3 animate-spin text-primary" />}
        <p className="font-semibold">{current.isError ? 'Your session needs a fresh start.' : 'Checking your workspace…'}</p>
        {current.isError && <Link href="/login" className="mt-4 inline-block text-sm underline">Return to sign in</Link>}
      </div>
    </div>
  );
  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login">{() => <AuthPage mode="login" />}</Route>
      <Route path="/register">{() => <AuthPage mode="register" />}</Route>
      <Route path="/dashboard">{() => <AuthGate><DashboardPage /></AuthGate>}</Route>
      <Route path="/debug/new">{() => <AuthGate><NewDebugPage /></AuthGate>}</Route>
      <Route path="/debug/:id">{(params) => <AuthGate><DebugDetailPage id={params.id} /></AuthGate>}</Route>
      <Route component={NotFound} />
    </Switch>
  </ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>;
}
setAuthTokenGetter(() => localStorage.getItem('tracefixer-token'));
export default App;
