import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Import interceptor before anything else that might fetch
import "@/lib/fetch-interceptor";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import FarmSetup from "@/pages/farm";
import Crops from "@/pages/crops";
import Readings from "@/pages/readings";
import Alerts from "@/pages/alerts";
import Analytics from "@/pages/analytics";
import Devices from "@/pages/devices";
import Settings from "@/pages/settings";
import Prices from "@/pages/prices";

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return null; // Logic in AuthProvider redirects to /login

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        {() => {
          // simple redirect logic
          if (localStorage.getItem('stf_token')) {
            window.location.replace(import.meta.env.BASE_URL + 'dashboard');
          } else {
            window.location.replace(import.meta.env.BASE_URL + 'login');
          }
          return null;
        }}
      </Route>

      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/farm" component={() => <ProtectedRoute component={FarmSetup} />} />
      <Route path="/crops" component={() => <ProtectedRoute component={Crops} />} />
      <Route path="/readings" component={() => <ProtectedRoute component={Readings} />} />
      <Route path="/alerts" component={() => <ProtectedRoute component={Alerts} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/devices" component={() => <ProtectedRoute component={Devices} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/prices" component={() => <ProtectedRoute component={Prices} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
