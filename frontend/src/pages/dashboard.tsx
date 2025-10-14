import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout';
import { HelpTooltip } from '@/components/help-tooltip';
import { ResizeObserverErrorBoundary } from '@/lib/error-boundary';
import {
  Users,
  GraduationCap,
  FileText,
  Wallet,
  Plus,
  Calendar,
} from 'lucide-react';
import { Activity, FollowUp, Application, Lead, Student, Admission } from '@/lib/types';
import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { getFollowUps } from '@/services/followUps';
import { AddLeadModal } from '@/components/add-lead-modal';
import { AddStudentModal } from '@/components/add-student-modal';
import { AddApplicationModal } from '@/components/add-application-modal';
import { useAuth } from '@/contexts/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

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

function inCurrentMonth(dateLike: unknown): boolean {
  if (!dateLike) return false;
  const d = new Date(String(dateLike));
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function DashboardContent() {
  const { user } = useAuth();

  const { data: leads, isLoading: leadsLoading } = useQuery({ queryKey: ['/api/leads'] });
  const { data: students, isLoading: studentsLoading } = useQuery({ queryKey: ['/api/students'] });
  const { data: applications, isLoading: applicationsLoading } = useQuery({ queryKey: ['/api/applications'] });
  const { data: admissions, isLoading: admissionsLoading } = useQuery({ queryKey: ['/api/admissions'] });
  const { data: applicationsDropdowns } = useQuery({ queryKey: ['/api/dropdowns/module/Applications'] });

  const isLoading = leadsLoading || studentsLoading || applicationsLoading || admissionsLoading;

  const leadsArray = React.useMemo<Lead[]>(() => Array.isArray(leads) ? leads as any : (leads && typeof leads === 'object' && Array.isArray((leads as any).data) ? (leads as any).data : Array.isArray((leads as any)?.results) ? (leads as any).results : []), [leads]);
  const studentsArray = React.useMemo<Student[]>(() => Array.isArray(students) ? students as any : (students && typeof students === 'object' && Array.isArray((students as any).data) ? (students as any).data : Array.isArray((students as any)?.results) ? (students as any).results : []), [students]);
  const applicationsArray = React.useMemo<Application[]>(() => Array.isArray(applications) ? applications as any : (applications && typeof applications === 'object' && Array.isArray((applications as any).data) ? (applications as any).data : Array.isArray((applications as any)?.results) ? (applications as any).results : []), [applications]);
  const admissionsArray = React.useMemo<Admission[]>(() => Array.isArray(admissions) ? admissions as any : (admissions && typeof admissions === 'object' && Array.isArray((admissions as any).data) ? (admissions as any).data : Array.isArray((admissions as any)?.results) ? (admissions as any).results : []), [admissions]);

  const leadsThisMonth = React.useMemo(() => leadsArray.filter(l => inCurrentMonth((l as any).createdAt || (l as any).created_at || (l as any).created_on)), [leadsArray]);
  const studentsThisMonth = React.useMemo(() => studentsArray.filter(s => inCurrentMonth((s as any).createdAt || (s as any).created_at || (s as any).created_on)), [studentsArray]);
  const applicationsThisMonth = React.useMemo(() => applicationsArray.filter(a => inCurrentMonth((a as any).createdAt || (a as any).created_at || (a as any).created_on)), [applicationsArray]);
  const depositsThisMonth = React.useMemo(() => admissionsArray.filter(a => inCurrentMonth((a as any).depositDate || (a as any).deposit_date)), [admissionsArray]);

  const metrics = {
    totalLeads: leadsThisMonth.length,
    activeStudents: studentsArray.filter((s: any) => String((s.status || '')).trim().toLowerCase() !== 'closed').length,
    applications: applicationsThisMonth.length,
    admissions: depositsThisMonth.length,
    conversionRate: leadsThisMonth.length ? (studentsThisMonth.length / leadsThisMonth.length) * 100 : 0,
    successRate: applicationsThisMonth.length ? (depositsThisMonth.length / applicationsThisMonth.length) * 100 : 0,
  };

  const pipelineData = {
    newLeads: leadsThisMonth.length,
    qualifiedStudents: studentsThisMonth.filter((s: any) => String((s.status || '')).trim().toLowerCase() !== 'closed').length,
    applicationsSubmitted: applicationsThisMonth.length,
    admissions: depositsThisMonth.length,
  };

  // Applications by Stage (current month) - includes zero-count statuses from dropdowns
  const applicationsByStage = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of applicationsThisMonth) {
      const stage = String((app as any).appStatus || (app as any).status || (app as any).caseStatus || 'Unknown').trim();
      const key = stage || 'Unknown';
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    // Derive full status list from Applications module dropdowns (various possible keys)
    const dd: any = applicationsDropdowns as any;
    let labels: string[] = [];
    if (dd && typeof dd === 'object') {
      const normalizeKey = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const keyMap: Record<string, string> = {};
      for (const k of Object.keys(dd)) keyMap[normalizeKey(k)] = k;
      const candidates = ['App Status','Application Status','Status','AppStatus','app status','App status'];
      let list: any[] = [];
      for (const raw of candidates) {
        const foundKey = keyMap[normalizeKey(raw)];
        if (foundKey && Array.isArray(dd[foundKey])) { list = dd[foundKey]; break; }
      }
      list = Array.isArray(list) ? [...list] : [];
      list.sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0)));
      labels = list.map((o: any) => String(o.value || o.label || '').trim()).filter(Boolean);
    }

    if (labels.length > 0) {
      return labels.map((name) => ({ name, value: counts.get(name) || 0 }));
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [applicationsThisMonth, applicationsDropdowns]);

  // Recent updates: mix of newly created entities this month
  const recentUpdates: Activity[] = React.useMemo(() => {
    const items: Activity[] = [] as any;
    for (const l of leadsThisMonth) items.push({ id: Date.now() + Math.random(), entityType: 'lead', entityId: (l as any).id, activityType: 'created', title: 'New Lead', description: (l as any).name || (l as any).email || 'Lead created', oldValue: null, newValue: null, fieldName: null, followUpAt: null, userId: (l as any).createdBy || null, createdAt: (l as any).createdAt as any });
    for (const s of studentsThisMonth) items.push({ id: Date.now() + Math.random(), entityType: 'student', entityId: (s as any).id, activityType: 'created', title: 'New Student', description: (s as any).name || (s as any).email || 'Student created', oldValue: null, newValue: null, fieldName: null, followUpAt: null, userId: (s as any).counselorId || null, createdAt: (s as any).createdAt as any });
    for (const a of applicationsThisMonth) items.push({ id: Date.now() + Math.random(), entityType: 'application', entityId: (a as any).id, activityType: 'created', title: 'Application', description: (a as any).university || 'Application created', oldValue: null, newValue: null, fieldName: null, followUpAt: null, userId: (a as any).counsellorId || null, createdAt: (a as any).createdAt as any });
    for (const ad of depositsThisMonth) items.push({ id: Date.now() + Math.random(), entityType: 'admission', entityId: (ad as any).id, activityType: 'deposit', title: 'Deposit Recorded', description: (ad as any).program || (ad as any).university || 'Deposit recorded', oldValue: null, newValue: null, fieldName: null, followUpAt: null, userId: (ad as any).admissionOfficerId || null, createdAt: ((ad as any).depositDate || (ad as any).createdAt) as any });
    items.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
    return items.slice(0, 6);
  }, [leadsThisMonth, studentsThisMonth, applicationsThisMonth, depositsThisMonth]);

  // Upcoming follow-ups for current user (now -> end of month)
  const monthRange = React.useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: now, end };
  }, []);

  const { data: followUpsResp } = useQuery({
    queryKey: ['dashboard-follow-ups', monthRange.start.toISOString(), monthRange.end.toISOString(), user?.id || 'anon'],
    queryFn: () => getFollowUps({ start: monthRange.start, end: monthRange.end, userId: (user as any)?.id }),
    enabled: !!user,
  });
  const upcomingFollowUps: FollowUp[] = React.useMemo(() => {
    const list = followUpsResp?.data ?? [];
    const now = Date.now();
    return list
      .filter(fu => new Date(fu.followUpOn).getTime() >= now)
      .sort((a, b) => new Date(a.followUpOn).getTime() - new Date(b.followUpOn).getTime())
      .slice(0, 6);
  }, [followUpsResp]);

  const [addLeadOpen, setAddLeadOpen] = React.useState(false);
  const [addStudentOpen, setAddStudentOpen] = React.useState(false);
  const [addApplicationOpen, setAddApplicationOpen] = React.useState(false);

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
    <Layout title="Dashboard" showSearch={false} helpText="Overview for the current month.">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Current Month</div>
          <div className="hidden sm:block text-xs text-muted-foreground">Stats are limited to this month</div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat title="Total Leads" value={metrics.totalLeads} icon={<Users className="text-primary" size={20} />} bubbleClass="bg-blue-100" />
          <Stat title="Active Students" value={metrics.activeStudents} icon={<GraduationCap className="text-purple-600" size={20} />} bubbleClass="bg-purple-100" />
          <Stat title="Applications" value={metrics.applications} icon={<FileText className="text-amber-600" size={20} />} bubbleClass="bg-amber-100" />
          <Stat title="Deposits" value={metrics.admissions} icon={<Wallet className="text-emerald-600" size={20} />} bubbleClass="bg-emerald-100" />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <HelpTooltip content="Create records quickly" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={() => setAddLeadOpen(true)} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add New Lead</Button>
              <Button onClick={() => setAddStudentOpen(true)} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add New Student</Button>
              <Button onClick={() => setAddApplicationOpen(true)} className="w-full"><Plus className="w-4 h-4 mr-2" /> Create Application</Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts + Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Applications by Stage</CardTitle>
                <HelpTooltip content="Breakdown of applications created this month by stage" />
              </div>
            </CardHeader>
            <CardContent className="h-72">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResizeObserverErrorBoundary>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={applicationsByStage} layout="vertical" margin={{ left: 4, right: 8, top: 8, bottom: 8 }} barCategoryGap="60%">
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} tickMargin={2} width={90} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#4f46e5" radius={[0, 8, 8, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ResizeObserverErrorBoundary>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pipeline (This Month)</CardTitle>
                <HelpTooltip content="From leads to deposits" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">New Leads</span><span className="text-sm font-medium text-gray-900">{pipelineData.newLeads}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Active Students</span><span className="text-sm font-medium text-gray-900">{pipelineData.qualifiedStudents}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Applications</span><span className="text-sm font-medium text-gray-900">{pipelineData.applicationsSubmitted}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Deposits</span><span className="text-sm font-medium text-gray-900">{pipelineData.admissions}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Updates</CardTitle>
                <HelpTooltip content="Recent records created this month" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUpdates.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No recent updates</div>
                ) : (
                  recentUpdates.map((item) => (
                    <div key={`${item.entityType}-${item.entityId}-${item.createdAt}`} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                        {item.entityType === 'lead' && <Users className="w-4 h-4 text-primary" />}
                        {item.entityType === 'student' && <GraduationCap className="w-4 h-4 text-purple-600" />}
                        {item.entityType === 'application' && <FileText className="w-4 h-4 text-amber-600" />}
                        {item.entityType === 'admission' && <Wallet className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                        <div className="text-xs text-gray-600 truncate">{item.description}</div>
                        <div className="text-xs text-muted-foreground">{new Date(item.createdAt as any).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Upcoming Follow Ups</CardTitle>
                <HelpTooltip content="Your next scheduled follow ups for this month" />
              </div>
            </CardHeader>
            <CardContent>
              {(!upcomingFollowUps || upcomingFollowUps.length === 0) ? (
                <div className="text-sm text-muted-foreground">No upcoming follow ups</div>
              ) : (
                <div className="space-y-3">
                  {upcomingFollowUps.map((fu) => (
                    <div key={fu.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{fu.entityType} • {new Date(fu.followUpOn).toLocaleString()}</div>
                        <div className="text-xs text-gray-600 truncate">{fu.comments}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddLeadModal open={addLeadOpen} onOpenChange={setAddLeadOpen} />
      <AddStudentModal open={addStudentOpen} onOpenChange={setAddStudentOpen} leadId={undefined as any} />
      <AddApplicationModal open={addApplicationOpen} onOpenChange={setAddApplicationOpen} studentId={undefined as any} />
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
