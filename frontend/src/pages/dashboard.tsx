import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout';
import { HelpTooltip } from '@/components/help-tooltip';
import { ResizeObserverErrorBoundary } from '@/lib/error-boundary';
import {
  Users,
  GraduationCap,
  Trophy,
  TrendingUp,
  UserPlus,
  Calendar,
  Clock
} from 'lucide-react';
import { DashboardMetrics, PipelineData, Activity } from '@/lib/types';
import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

function DashboardFallback({ error }: FallbackProps) {
  return (
    <Layout title="Dashboard" helpText="Dashboard error occurred">
      <Card>
        <CardContent className="p-6">
          <div className="text-destructive">
            <h3 className="font-semibold">Error Loading Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">{error?.message || 'An unexpected error occurred'}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}

function DashboardContent() {
  const { data: leads, isLoading: leadsLoading } = useQuery({ queryKey: ['/api/leads'] });
  const { data: students, isLoading: studentsLoading } = useQuery({ queryKey: ['/api/students'] });
  const { data: applications, isLoading: applicationsLoading } = useQuery({ queryKey: ['/api/applications'] });
  const { data: admissions, isLoading: admissionsLoading } = useQuery({ queryKey: ['/api/admissions'] });

  const isLoading = leadsLoading || studentsLoading || applicationsLoading || admissionsLoading;

  const leadsArray = React.useMemo(() => Array.isArray(leads) ? leads : (leads && typeof leads === 'object' && Array.isArray((leads as any).data) ? (leads as any).data : Array.isArray((leads as any)?.results) ? (leads as any).results : []), [leads]);
  const studentsArray = React.useMemo(() => Array.isArray(students) ? students : (students && typeof students === 'object' && Array.isArray((students as any).data) ? (students as any).data : Array.isArray((students as any)?.results) ? (students as any).results : []), [students]);
  const applicationsArray = React.useMemo(() => Array.isArray(applications) ? applications : (applications && typeof applications === 'object' && Array.isArray((applications as any).data) ? (applications as any).data : Array.isArray((applications as any)?.results) ? (applications as any).results : []), [applications]);
  const admissionsArray = React.useMemo(() => Array.isArray(admissions) ? admissions : (admissions && typeof admissions === 'object' && Array.isArray((admissions as any).data) ? (admissions as any).data : Array.isArray((admissions as any)?.results) ? (admissions as any).results : []), [admissions]);

  const metrics: DashboardMetrics = {
    totalLeads: leadsArray.length,
    activeStudents: studentsArray.length,
    applications: applicationsArray.length,
    admissions: admissionsArray.filter((a: any) => a.decision === 'accepted').length,
    conversionRate: leadsArray.length ? (studentsArray.length / leadsArray.length) * 100 : 0,
    successRate: applicationsArray.length ? (admissionsArray.filter((a: any) => a.decision === 'accepted').length / applicationsArray.length) * 100 : 0,
  };

  const pipelineData: PipelineData = {
    newLeads: leadsArray.filter((lead: any) => lead.status === 'new').length,
    qualifiedStudents: studentsArray.filter((student: any) => (student as any).status === 'active').length,
    applicationsSubmitted: applicationsArray.filter((app: any) => app.status === 'submitted').length,
    admissions: admissionsArray.filter((admission: any) => admission.decision === 'accepted').length,
  };

  const recentActivities: Activity[] = [
    { id: '1', type: 'lead', action: 'New lead added', entityName: 'Emma Thompson', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), icon: 'user-plus', color: 'bg-emerald-500' },
    { id: '2', type: 'application', action: 'Application submitted for', entityName: 'John Davis', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), icon: 'file-text', color: 'bg-primary' },
    { id: '3', type: 'student', action: 'Follow-up required for', entityName: 'Sarah Wilson', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), icon: 'clock', color: 'bg-amber-500' },
    { id: '4', type: 'admission', action: 'Admission confirmed for', entityName: 'Michael Chen', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), icon: 'trophy', color: 'bg-emerald-500' }
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const Stat = ({ title, value, icon, bubbleClass }: { title: string; value: number | string; icon: React.ReactNode; bubbleClass: string; }) => (
    <Card className="overflow-hidden rounded-xl border-gray-200 shadow-sm">
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">{title}</p>
            {isLoading ? <Skeleton className="h-8 w-14 mt-1" /> : <p className="text-3xl font-bold text-gray-900 leading-tight">{value}</p>}
          </div>
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${bubbleClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout title="Dashboard" showSearch={false} helpText="Overview of key metrics, pipeline and recent activity.">
      <div className="space-y-4">
        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Stat title="Total Leads" value={metrics.totalLeads} icon={<Users className="text-primary" size={20} />} bubbleClass="bg-blue-100" />
          <Stat title="Applications" value={metrics.applications} icon={<GraduationCap className="text-amber-500" size={20} />} bubbleClass="bg-amber-100" />
          <Stat title="Admissions" value={metrics.admissions} icon={<Trophy className="text-emerald-600" size={20} />} bubbleClass="bg-emerald-100" />
          <Stat title="Students" value={metrics.activeStudents} icon={<GraduationCap className="text-purple-600" size={20} />} bubbleClass="bg-purple-100" />
          <Stat title="New Leads" value={pipelineData.newLeads} icon={<UserPlus className="text-primary" size={20} />} bubbleClass="bg-blue-100" />
          <Stat title="Success %" value={`${Math.round(metrics.successRate)}%`} icon={<TrendingUp className="text-emerald-600" size={20} />} bubbleClass="bg-emerald-100" />
        </div>

        {/* Activity and Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Activities</CardTitle>
                <HelpTooltip content="Latest actions across leads, students, applications and admissions." />
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
                      <p className="text-sm text-gray-900">{activity.action} <span className="font-medium">{activity.entityName}</span></p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="link" className="w-full mt-3 text-primary">View All Activities</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pipeline Overview</CardTitle>
                <HelpTooltip content="Track funnel progression from leads to admissions." />
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
                      <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">Qualified Students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 font-medium">{pipelineData.qualifiedStudents}</span>
                      <span className="text-xs text-gray-500">{pipelineData.newLeads ? Math.round((pipelineData.qualifiedStudents / pipelineData.newLeads) * 100) : 0}%</span>
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
                      <span className="text-xs text-gray-500">{pipelineData.newLeads ? Math.round((pipelineData.applicationsSubmitted / pipelineData.newLeads) * 100) : 0}%</span>
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
                      <span className="text-xs text-gray-500">{pipelineData.newLeads ? Math.round((pipelineData.admissions / pipelineData.newLeads) * 100) : 0}%</span>
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

        {/* This Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Month</CardTitle>
            <p className="text-sm text-gray-500">Performance summary</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-2">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200"></circle>
                    <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray="264" strokeDashoffset={264 - (264 * metrics.successRate) / 100} className="text-emerald-500"></circle>
                  </svg>
                  <span className="absolute text-2xl font-bold text-gray-900">{Math.round(metrics.successRate)}%</span>
                </div>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">New Leads</span><span className="text-sm font-medium text-gray-900">+{metrics.totalLeads}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Conversions</span><span className="text-sm font-medium text-gray-900">{metrics.activeStudents}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Applications</span><span className="text-sm font-medium text-gray-900">{metrics.applications}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Admissions</span><span className="text-sm font-medium text-gray-900">{metrics.admissions}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
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
