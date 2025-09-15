import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import AddLead from "@/pages/add-lead";
import Students from "@/pages/students";
import Applications from "@/pages/applications";
import AddApplication from "@/pages/add-application";
import ApplicationDetails from "@/pages/application-details";
import Admissions from "@/pages/admissions";
import EventsPage from "@/pages/events";
import AddAdmissionPage from "@/pages/add-admission";
import StudentDetails from "@/pages/student-details";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import ToolkitPage from "@/pages/toolkit";
import Login from "@/pages/login";

function Router() {
  const { isAuthenticated, isLoading, login } = useAuth();

  console.log('Router: isLoading =', isLoading, ', isAuthenticated =', isAuthenticated);

  if (isLoading) {
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
    console.log('Router: User not authenticated, showing Login component');
    try {
      return <Login onLogin={login} />;
    } catch (error) {
      console.error('Router: Error rendering Login component:', error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Login Error</h1>
            <p className="text-gray-700">There was an error loading the login page.</p>
            <pre className="mt-4 text-sm text-gray-600 bg-gray-100 p-4 rounded">
              {error instanceof Error ? error.message : 'Unknown error'}
            </pre>
          </div>
        </div>
      );
    }
  }

  console.log('Router: User authenticated, showing main app');

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/leads" component={Leads} />
      <Route path="/leads/add" component={AddLead} />
      <Route path="/leads/new" component={Leads} />
      <Route path="/leads/:id/edit" component={Leads} />
      <Route path="/leads/:id" component={Leads} />
      <Route path="/leads/:id/student" component={Leads} />
      <Route path="/leads/:id/convert" component={Leads} />
      <Route path="/students" component={Students} />
      <Route path="/students/:id/edit" component={Students} />
      <Route path="/students/:id" component={Students} />
      <Route path="/students/:id/application" component={Students} />
      <Route path="/applications/add" component={AddApplication} />
      <Route path="/applications/new" component={AddApplication} />
      <Route path="/applications/:id/edit" component={Applications} />
      <Route path="/applications/:id" component={Applications} />
      <Route path="/applications" component={Applications} />
      <Route path="/admissions/add" component={AddAdmissionPage} />
      <Route path="/admissions/new" component={AddAdmissionPage} />
      <Route path="/admissions/:id/edit" component={Admissions} />
      <Route path="/admissions/:id" component={Admissions} />
      <Route path="/admissions" component={Admissions} />
      <Route path="/events" component={EventsPage} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/toolkit" component={ToolkitPage} />
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
