import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import Deposits from '@/pages/deposits';
import Centres from '@/pages/centres';
import Pickups from '@/pages/pickups';
import Routes from '@/pages/routes';
import Hotspots from '@/pages/hotspots';
import { AppShell } from '@/components/app-shell';
import Login from '@/pages/login';
import { AuthProvider, useAuth } from '@/context/auth-context';
import Admin from '@/pages/admin';
import Rewards from '@/pages/rewards';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <AppShell>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/deposits" component={Deposits} />
          <Route path="/centres" component={Centres} />
          <Route path="/pickups" component={Pickups} />
          <Route path="/routes" component={Routes} />
          <Route path="/hotspots" component={Hotspots} />
          <Route path="/admin" component={Admin} />
          <Route path="/rewards" component={Rewards} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
