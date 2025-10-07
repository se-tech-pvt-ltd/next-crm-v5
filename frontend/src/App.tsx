import { Switch, Route, useLocation } from "wouter";
import React from 'react';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import Students from "@/pages/students";
import Applications from "@/pages/applications";
import AddApplication from "@/pages/add-application";
import ApplicationDetails from "@/pages/application-details";
import Admissions from "@/pages/admissions";
import EventsPage from "@/pages/events";
import StudentDetails from "@/pages/student-details";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Forbidden from "@/pages/forbidden";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import UniversityPage from "@/pages/university";
import ResetPassword from "@/pages/reset-password";
import CalendarPage from "@/pages/calendar";
import FollowUpsPage from '@/pages/follow-ups';
import UserProfileWizard from '@/components/settings/UserProfileWizard';

function Router() {
  const { isAuthenticated, isLoading, login, isAccessLoading, accessByRole } = useAuth() as any;
  const [location, setLocation] = useLocation();

  const normalize = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const singularize = (s: string) => s.replace(/s$/i, '');
  const isModuleVisible = (label: string) => {
    const mod = singularize(normalize(label));
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalize(a.moduleName ?? a.module_name)) === mod);
    if (entries.length === 0) return true; // no specific rule -> visible
    const allNone = entries.every((e: any) => normalize(e.viewLevel ?? e.view_level) === 'none');
    return !allNone;
  };

  const SettingsGuard = () => {
    if (isLoading || (isAuthenticated && isAccessLoading)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
    if (!isModuleVisible('Settings')) {
      return <Forbidden />;
    }
    return <Settings />;
  };

  // Redirects should not run during render. Use effects to perform navigation.
  React.useEffect(() => {
    // Allow unauthenticated users to access /login, /forgot-password, and /reset-password without redirecting
    const allowUnauthed = (loc: string) => loc === '/login' || loc === '/forgot-password' || loc.startsWith('/reset-password');
    if (!isLoading && !isAuthenticated && !allowUnauthed(location)) {
      try { setLocation('/login'); } catch {}
    }
  }, [isLoading, isAuthenticated, location, setLocation]);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated && location === '/login') {
      try { setLocation('/'); } catch {}
    }
  }, [isLoading, isAuthenticated, location, setLocation]);

  console.log('Router: isLoading =', isLoading, ', isAuthenticated =', isAuthenticated);

  if (isLoading || (isAuthenticated && isAccessLoading)) {
    console.log('Router: Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Router: User not authenticated');
    if (location === '/forgot-password') {
      console.log('Router: showing ForgotPassword page');
      return <ForgotPassword />;
    }
    if (location.startsWith('/reset-password')) {
      console.log('Router: showing ResetPassword page');
      return <ResetPassword />;
    }
    console.log('Router: showing Login component');
    return <Login onLogin={login} />;
  }

  console.log('Router: User authenticated, showing main app');

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/leads" component={Leads} />
      <Route path="/leads/new" component={Leads} />
      <Route path="/leads/:id/edit" component={Leads} />
      <Route path="/leads/:id" component={Leads} />
      <Route path="/leads/:id/student" component={Leads} />
      <Route path="/leads/:id/convert" component={Leads} />
      <Route path="/students" component={Students} />
      <Route path="/students/new" component={Students} />
      <Route path="/students/:id/edit" component={Students} />
      <Route path="/students/:id" component={Students} />
      <Route path="/students/:id/application" component={Students} />
      <Route path="/applications/add" component={AddApplication} />
      <Route path="/applications/new" component={Applications} />
      <Route path="/applications/:id/edit" component={Applications} />
      <Route path="/applications/:id/admission" component={Applications} />
      <Route path="/applications/:id" component={Applications} />
      <Route path="/applications" component={Applications} />
      <Route path="/admissions/:id/edit" component={Admissions} />
      <Route path="/admissions/:id" component={Admissions} />
      <Route path="/admissions" component={Admissions} />
      <Route path="/events/new" component={EventsPage} />
      <Route path="/events/:id/edit" component={EventsPage} />
      <Route path="/events/:id/registrations" component={EventsPage} />
      <Route path="/events/:id/registrations/:regId" component={EventsPage} />
      <Route path="/events/:id/registrations/:regId/lead" component={EventsPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/calendar" component={FollowUpsPage} />
      <Route path="/university" component={UniversityPage} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={SettingsGuard} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/login" component={Login} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('App component rendering');

  try {
    return (
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <Router />
          <UserProfileWizard />
        </QueryClientProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'red',
        color: 'white',
        fontSize: '2rem',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div>
          <h1>⚠️ APP ERROR ⚠️</h1>
          <p>Something went wrong loading the application.</p>
          <pre style={{ fontSize: '1rem', backgroundColor: 'black', padding: '1rem', marginTop: '1rem' }}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      </div>
    );
  }
}

export default App;
