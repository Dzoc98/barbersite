import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import AdminLogin from "@/pages/auth/AdminLogin";
import UserDashboard from "@/pages/user/UserDashboard";
import UserProfile from "@/pages/user/UserProfile";
import UserAppointments from "@/pages/user/UserAppointments";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ClientManagement from "@/pages/admin/ClientManagement";
import BookingFlow from "@/pages/booking/BookingFlow";
import NotFound from "@/pages/not-found";

// Layout
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { user, isAdmin, loading } = useAuth();

  // Show nothing during initial load
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          {/* Public routes */}
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/admin-login" component={AdminLogin} />
          
          {/* Protected user routes */}
          {user && !isAdmin && (
            <Switch>
              <Route path="/" component={UserDashboard} />
              <Route path="/profile" component={UserProfile} />
              <Route path="/appointments" component={UserAppointments} />
              <Route path="/book" component={BookingFlow} />
            </Switch>
          )}
          
          {/* Protected admin routes */}
          {user && isAdmin && (
            <Switch>
              <Route path="/" component={AdminDashboard} />
              <Route path="/clients" component={ClientManagement} />
            </Switch>
          )}
          
          {/* Redirect to login if not authenticated */}
          {!user && <Route path="/" component={Login} />}
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
