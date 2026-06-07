import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import Reports from "@/pages/Reports";
import NotificationCenter from "@/pages/NotificationCenter";
import Locations from "@/pages/Locations";
import Routers from "@/pages/Routers";
import Packages from "@/pages/Packages";
import Vouchers from "@/pages/Vouchers";
import Payments from "@/pages/Payments";
import Sessions from "@/pages/Sessions";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Portal from "@/pages/Portal";
import VoucherPrint from "@/pages/VoucherPrint";
import PaystackCallback from "@/pages/PaystackCallback";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/portal/:tenantSlug" component={Portal} />
      <Route path="/vouchers/print" component={VoucherPrint} />
      <Route path="/payment/callback" component={PaystackCallback} />

      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      <Route>
        <ProtectedRoute>
          <Layout>
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/reports" component={Reports} />
              <Route path="/notifications" component={NotificationCenter} />
              <Route path="/locations" component={Locations} />
              <Route path="/routers" component={Routers} />
              <Route path="/packages" component={Packages} />
              <Route path="/vouchers" component={Vouchers} />
              <Route path="/payments" component={Payments} />
              <Route path="/sessions" component={Sessions} />
              <Route path="/users" component={Users} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </ProtectedRoute>
      </Route>
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
