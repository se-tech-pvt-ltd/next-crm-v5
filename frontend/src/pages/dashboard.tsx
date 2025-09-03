import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout';
import { HelpTooltip } from '@/components/help-tooltip';
import { ResizeObserverErrorBoundary, LayoutSafeWrapper } from '@/lib/error-boundary';
import {
  Users,
  GraduationCap,
  Trophy,
  TrendingUp,
  UserPlus,
  Calendar,
  Edit,
  ArrowRight,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { DashboardMetrics, PipelineData, Activity } from '@/lib/types';
import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

function DashboardFallback({ error }: FallbackProps) {
  return (
    <Layout title="Dashboard" helpText="Dashboard error occurred">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">Error Loading Dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error?.message || 'An unexpected error occurred'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}

function DashboardContent() {
  const { data: leads, isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ['/api/leads'],
  });

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['/api/students'],
  });

  const { data: applications, isLoading: applicationsLoading, error: applicationsError } = useQuery({
    queryKey: ['/api/applications'],
  });

  const { data: admissions, isLoading: admissionsLoading, error: admissionsError } = useQuery({
    queryKey: ['/api/admissions'],
  });

  const isLoading = leadsLoading || studentsLoading || applicationsLoading || admissionsLoading;

  // Debug logging
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard data:', { leads, students, applications, admissions });
      console.log('Dashboard errors:', { leadsError, studentsError, applicationsError, admissionsError });
    }
  }, [leads, students, applications, admissions, leadsError, studentsError, applicationsError, admissionsError]);

  // Ensure data is always an array - handle different API response formats
  const leadsArray = React.useMemo(() => {
    if (Array.isArray(leads)) return leads;
    if (leads && typeof leads === 'object' && Array.isArray(leads.data)) return leads.data;
    if (leads && typeof leads === 'object' && Array.isArray(leads.results)) return leads.results;
    return [];
  }, [leads]);

  const studentsArray = React.useMemo(() => {
    if (Array.isArray(students)) return students;
    if (students && typeof students === 'object' && Array.isArray(students.data)) return students.data;
    if (students && typeof students === 'object' && Array.isArray(students.results)) return students.results;
    return [];
  }, [students]);

  const applicationsArray = React.useMemo(() => {
    if (Array.isArray(applications)) return applications;
    if (applications && typeof applications === 'object' && Array.isArray(applications.data)) return applications.data;
    if (applications && typeof applications === 'object' && Array.isArray(applications.results)) return applications.results;
    return [];
  }, [applications]);

  const admissionsArray = React.useMemo(() => {
    if (Array.isArray(admissions)) return admissions;
    if (admissions && typeof admissions === 'object' && Array.isArray(admissions.data)) return admissions.data;
    if (admissions && typeof admissions === 'object' && Array.isArray(admissions.results)) return admissions.results;
    return [];
  }, [admissions]);

  // Calculate metrics
  const metrics: DashboardMetrics = {
    totalLeads: leadsArray.length,
    activeStudents: studentsArray.length,
    applications: applicationsArray.length,
    admissions: admissionsArray.filter((admission: any) => admission.decision === 'accepted').length,
    conversionRate: leadsArray.length ? (studentsArray.length / leadsArray.length) * 100 : 0,
    successRate: applicationsArray.length ? (admissionsArray.filter((admission: any) => admission.decision === 'accepted').length / applicationsArray.length) * 100 : 0,
  };

  // Calculate pipeline data
  const pipelineData: PipelineData = {
    newLeads: leadsArray.filter((lead: any) => lead.status === 'new').length,
    qualifiedStudents: studentsArray.filter((student: any) => student.status === 'active').length,
    applicationsSubmitted: applicationsArray.filter((app: any) => app.status === 'submitted').length,
    admissions: admissionsArray.filter((admission: any) => admission.decision === 'accepted').length,
  };

  // Generate recent activities
  const recentActivities: Activity[] = [
    {
      id: '1',
      type: 'lead',
      action: 'New lead added',
      entityName: 'Emma Thompson',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: 'user-plus',
      color: 'bg-emerald-500'
    },
    {
      id: '2',
      type: 'application',
      action: 'Application submitted for',
      entityName: 'John Davis',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      icon: 'file-text',
      color: 'bg-primary'
    },
    {
      id: '3',
      type: 'student',
      action: 'Follow-up required for',
      entityName: 'Sarah Wilson',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      icon: 'clock',
      color: 'bg-amber-500'
    },
    {
      id: '4',
      type: 'admission',
      action: 'Admission confirmed for',
      entityName: 'Michael Chen',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      icon: 'trophy',
      color: 'bg-emerald-500'
    }
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <Layout 
      title="Dashboard" 
      helpText="Dashboard shows key metrics and recent activities. Use the cards to get quick insights into your business performance."
    >
      <div className="space-y-4">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Leads</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalLeads}</p>
                  )}
                  <p className="text-xs text-emerald-600 mt-1">
                    <TrendingUp className="inline w-3 h-3 mr-1" />
                    +12% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Students</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{metrics.activeStudents}</p>
                  )}
                  <p className="text-xs text-emerald-600 mt-1">
                    <TrendingUp className="inline w-3 h-3 mr-1" />
                    +8% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-purple" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Applications</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{metrics.applications}</p>
                  )}
                  <p className="text-xs text-amber-600 mt-1">
                    <Clock className="inline w-3 h-3 mr-1" />
                    {applicationsArray.filter((app: any) => app.status === 'pending').length} pending
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-amber-500" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Admissions</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{metrics.admissions}</p>
                  )}
                  <p className="text-xs text-emerald-600 mt-1">
                    <Trophy className="inline w-3 h-3 mr-1" />
                    {Math.round(metrics.successRate)}% success rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Trophy className="text-emerald-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities & Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Activities */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activities</CardTitle>
                <HelpTooltip content="Track all recent activities across leads, students, and applications. Click on any activity to view details." />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      {activity.icon === 'user-plus' && <UserPlus className="text-white" size={14} />}
                      {activity.icon === 'file-text' && <GraduationCap className="text-white" size={14} />}
                      {activity.icon === 'clock' && <Clock className="text-white" size={14} />}
                      {activity.icon === 'trophy' && <Trophy className="text-white" size={14} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {activity.action} <span className="font-medium">{activity.entityName}</span>
                      </p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-4 text-primary">
                View All Activities
              </Button>
            </CardContent>
          </Card>

          {/* Pipeline Overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Pipeline Overview</CardTitle>
                <HelpTooltip content="Monitor the progression of leads through your sales funnel. Each stage shows conversion rates and opportunities." />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">New Leads</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 font-medium">{pipelineData.newLeads}</span>
                      <span className="text-xs text-gray-500">100%</span>
                    </div>
                  </div>
                  <ResizeObserverErrorBoundary>
                    <Progress value={100} className="h-2" />
                  </ResizeObserverErrorBoundary>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">Qualified Students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 font-medium">{pipelineData.qualifiedStudents}</span>
                      <span className="text-xs text-gray-500">
                        {pipelineData.newLeads ? Math.round((pipelineData.qualifiedStudents / pipelineData.newLeads) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <ResizeObserverErrorBoundary>
                    <Progress value={pipelineData.newLeads ? (pipelineData.qualifiedStudents / pipelineData.newLeads) * 100 : 0} className="h-2" />
                  </ResizeObserverErrorBoundary>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">Applications Submitted</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 font-medium">{pipelineData.applicationsSubmitted}</span>
                      <span className="text-xs text-gray-500">
                        {pipelineData.newLeads ? Math.round((pipelineData.applicationsSubmitted / pipelineData.newLeads) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <ResizeObserverErrorBoundary>
                    <Progress value={pipelineData.newLeads ? (pipelineData.applicationsSubmitted / pipelineData.newLeads) * 100 : 0} className="h-2" />
                  </ResizeObserverErrorBoundary>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">Admissions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 font-medium">{pipelineData.admissions}</span>
                      <span className="text-xs text-gray-500">
                        {pipelineData.newLeads ? Math.round((pipelineData.admissions / pipelineData.newLeads) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <ResizeObserverErrorBoundary>
                    <Progress value={pipelineData.newLeads ? (pipelineData.admissions / pipelineData.newLeads) * 100 : 0} className="h-2" />
                  </ResizeObserverErrorBoundary>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <p className="text-sm text-gray-500">Common tasks to get you started</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-3 flex flex-col items-start space-y-1">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <UserPlus className="text-white" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Add Lead</h4>
                    <p className="text-xs text-gray-500">Capture new prospect information</p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto p-3 flex flex-col items-start space-y-1">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <GraduationCap className="text-white" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">New Application</h4>
                    <p className="text-xs text-gray-500">Submit university application</p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto p-3 flex flex-col items-start space-y-1">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Calendar className="text-white" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Schedule Follow-up</h4>
                    <p className="text-xs text-gray-500">Set reminder for student contact</p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto p-3 flex flex-col items-start space-y-1">
                  <div className="w-8 h-8 bg-purple rounded-lg flex items-center justify-center">
                    <Edit className="text-white" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Update Status</h4>
                    <p className="text-xs text-gray-500">Change application or lead status</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>This Month</CardTitle>
              <p className="text-sm text-gray-500">Performance summary</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200"></circle>
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="36" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        fill="none" 
                        strokeDasharray="226" 
                        strokeDashoffset={226 - (226 * metrics.successRate) / 100}
                        className="text-emerald-500"
                      ></circle>
                    </svg>
                    <span className="absolute text-2xl font-bold text-gray-900">{Math.round(metrics.successRate)}%</span>
                  </div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Leads</span>
                    <span className="text-sm font-medium text-gray-900">+{metrics.totalLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Conversions</span>
                    <span className="text-sm font-medium text-gray-900">{metrics.activeStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Applications</span>
                    <span className="text-sm font-medium text-gray-900">{metrics.applications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Admissions</span>
                    <span className="text-sm font-medium text-gray-900">{metrics.admissions}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button className="w-full">
                    View Detailed Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary FallbackComponent={DashboardFallback}>
      <DashboardContent />
    </ErrorBoundary>
  );
}
