import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/help-tooltip';
import * as StudentsService from '@/services/students';
import * as ApplicationsService from '@/services/applications';
import * as AdmissionsService from '@/services/admissions';
import * as BranchesService from '@/services/branches';
import * as UsersService from '@/services/users';
import * as EventsService from '@/services/events';
import * as RegistrationsService from '@/services/event-registrations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Users, GraduationCap, Trophy, DollarSign, Globe, Target, Calendar } from 'lucide-react';

function isWithinRange(dLike: any, from?: Date | null, to?: Date | null) {
  if (!dLike) return false;
  const d = new Date(dLike);
  if (Number.isNaN(d.getTime())) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function groupCount<T>(items: T[], pick: (item: T) => string | null | undefined) {
  const map = new Map<string, number>();
  for (const it of items) {
    const key = (pick(it) || 'Unknown').toString();
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);
}

export default function Reports() {
  // Base datasets
  const { data: leadsResponse, isLoading: leadsLoading } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: async () => {
      const response = await fetch('/api/leads');
      return await response.json();
    }
  });
  const { data: studentsResponse, isLoading: studentsLoading } = useQuery({ queryKey: ['/api/students'], queryFn: () => StudentsService.getStudents() });
  const { data: applicationsResponse, isLoading: applicationsLoading } = useQuery({ queryKey: ['/api/applications'], queryFn: () => ApplicationsService.getApplications() });
  const { data: admissionsResponse, isLoading: admissionsLoading } = useQuery({ queryKey: ['/api/admissions'], queryFn: () => AdmissionsService.getAdmissions() });

  // Global filters data
  const { data: branches = [] } = useQuery({ queryKey: ['/api/branches'], queryFn: () => BranchesService.listBranches({ limit: 1000 }) });
  const { data: users = [] } = useQuery({ queryKey: ['/api/users'], queryFn: () => UsersService.getUsers() });

  // Events data
  const { data: events = [] } = useQuery({ queryKey: ['/api/events'], queryFn: () => EventsService.getEvents() });
  const { data: registrations = [] } = useQuery({ queryKey: ['/api/event-registrations'], queryFn: () => RegistrationsService.getRegistrations() });

  // Filters state
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('all');
  const [counsellorId, setCounsellorId] = useState<string>('all');
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate + 'T23:59:59') : null;
  const branchMatch = (val?: string | null) => branchId === 'all' || (val && String(val) === branchId);
  const counsellorMatch = (val?: string | null) => counsellorId === 'all' || (val && String(val) === counsellorId);

  // Normalize and filter arrays
  const rawLeads = leadsResponse?.data || [];
  const rawStudents = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse?.data || []);
  const rawApplications = Array.isArray(applicationsResponse) ? applicationsResponse : (applicationsResponse?.data || []);
  const rawAdmissions = Array.isArray(admissionsResponse) ? admissionsResponse : (admissionsResponse?.data || []);

  const leads = rawLeads.filter((l: any) => isWithinRange(l.createdAt || l.created_at || l.created_on, from, to) && branchMatch(l.branchId || l.branch_id) && counsellorMatch(l.counselorId || l.counsellorId || l.counsellor_id));
  const students = rawStudents.filter((s: any) => isWithinRange(s.createdAt || s.created_at || s.created_on, from, to) && branchMatch(s.branchId || s.branch_id) && counsellorMatch(s.counselorId || s.counsellorId || s.counsellor_id));
  const applications = rawApplications.filter((a: any) => isWithinRange(a.createdAt || a.created_at || a.created_on, from, to) && branchMatch(a.branchId || a.branch_id) && counsellorMatch(a.counsellorId || a.counselorId || a.counsellor_id));
  const admissions = rawAdmissions.filter((ad: any) => isWithinRange(ad.createdAt || ad.created_at || ad.created_on, from, to) && branchMatch(ad.branchId || ad.branch_id) && counsellorMatch(ad.counsellorId || ad.counselorId || ad.counsellor_id));

  const isLoading = leadsLoading || studentsLoading || applicationsLoading || admissionsLoading;

  // Derived metrics
  const totalLeads = leads.length;
  const totalStudents = students.length;
  const totalApplications = applications.length;
  const acceptedAdmissions = admissions.filter((a: any) => (a.decision || '').toLowerCase() === 'accepted').length;
  const leadToStudentRate = totalLeads > 0 ? (totalStudents / totalLeads) * 100 : 0;
  const studentToApplicationRate = totalStudents > 0 ? (totalApplications / totalStudents) * 100 : 0;
  const applicationToAdmissionRate = totalApplications > 0 ? (acceptedAdmissions / totalApplications) * 100 : 0;

  const eventsFiltered = (events as any[]).filter((e) => isWithinRange((e as any).date, from, to) && branchMatch((e as any).branchId) && counsellorMatch((e as any).counsellorId));
  const regsFiltered = (registrations as any[]).filter((r) => isWithinRange((r as any).createdAt || (r as any).created_at, from, to));
  const totalEvents = eventsFiltered.length;
  const totalRegistrations = regsFiltered.length;
  const totalRegLeads = regsFiltered.filter((r: any) => (r.status || '').toLowerCase().includes('lead')).length;
  const totalAttended = regsFiltered.filter((r: any) => (r.status || '').toLowerCase().includes('attend')).length;

  const exportPDF = () => window.print();

  return (
    <Layout title="Reports" subtitle="Analytics and insights" helpText="Track performance, conversions, and insights across the organization.">
      <div className="space-y-4">
        {/* Filters + Export */}
        <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4 print:hidden">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">From</div>
              <Input type="date" value={fromDate} onChange={(e)=>setFromDate((e.target as HTMLInputElement).value)} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">To</div>
              <Input type="date" value={toDate} onChange={(e)=>setToDate((e.target as HTMLInputElement).value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Branch</div>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name || b.branchName || b.code || b.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Counsellor</div>
              <Select value={counsellorId} onValueChange={setCounsellorId}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {users.filter((u: any)=>String(u.role||'').toLowerCase().includes('counsel')).map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.firstName || u.name || u.email || u.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:opacity-90" onClick={exportPDF}>Export PDF</button>
          </div>
        </div>

        <Tabs defaultValue="overall" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="admissions">Admissions</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
          </TabsList>

          {/* Overall */}
          <TabsContent value="overall">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Leads</CardTitle></CardHeader><CardContent>{isLoading? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalLeads}</div>}</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Students</CardTitle></CardHeader><CardContent>{isLoading? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalStudents}</div>}</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Applications</CardTitle></CardHeader><CardContent>{isLoading? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalApplications}</div>}</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Admissions</CardTitle></CardHeader><CardContent>{isLoading? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{acceptedAdmissions}</div>}</CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader><div className="flex items-center justify-between"><CardTitle>Leads by Status</CardTitle><HelpTooltip content="Distribution of leads by status" /></div></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupCount(leads, (l:any)=>l.status)}>
                      <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><div className="flex items-center justify-between"><CardTitle>Applications by Status</CardTitle><HelpTooltip content="Distribution of applications by status" /></div></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupCount(applications, (a:any)=>a.appStatus || a.caseStatus)}>
                      <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Events</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalEvents}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Registrations</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalRegistrations}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalRegLeads}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Attended</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalAttended}</div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader><CardTitle>Registrations by Event</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupCount(regsFiltered, (r:any)=> (eventsFiltered.find((e:any)=>String(e.id)===String(r.eventId))?.name) || r.eventId)}>
                      <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#22c55e" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Conversions by Event</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupCount(regsFiltered.filter((r:any)=>String(r.status||'').toLowerCase().includes('lead')), (r:any)=> (eventsFiltered.find((e:any)=>String(e.id)===String(r.eventId))?.name) || r.eventId)}>
                      <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#059669" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leads */}
          <TabsContent value="leads">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalLeads}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Active Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{leads.filter((l:any)=>String(l.status||'').toLowerCase()==='active').length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Lost Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{leads.filter((l:any)=>String(l.isLost||'').toString()==='1' || String(l.status||'').toLowerCase()==='lost').length}</div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card><CardHeader><CardTitle>By Status</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(leads,(l:any)=>l.status)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Branch</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(leads,(l:any)=>l.branchId)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><CardTitle>By Source</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(leads,(l:any)=>l.source)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#60a5fa" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><CardTitle>By Counsellor</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(leads,(l:any)=>l.counselorId || l.counsellorId)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
            </div>
          </TabsContent>

          {/* Students */}
          <TabsContent value="students">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalStudents}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Active Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{students.filter((s:any)=>String(s.status||'').toLowerCase()==='active').length}</div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card><CardHeader><CardTitle>By Status</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(students,(s:any)=>s.status)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Branch</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(students,(s:any)=>s.branchId)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7c3aed" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><CardTitle>By Source</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(students,(s:any)=>s.source)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#a78bfa" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><CardTitle>By Counsellor</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(students,(s:any)=>s.counselorId || s.counsellorId)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#6d28d9" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
            </div>
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications">
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Applications</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalApplications}</div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card><CardHeader><CardTitle>Applications by Status</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(applications,(a:any)=>a.appStatus || a.caseStatus)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Source</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(applications,(a:any)=>a.source)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#ef4444" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Branch</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(applications,(a:any)=>a.branchId)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Intake</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(applications,(a:any)=>a.intake)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#06b6d4" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Country</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(applications,(a:any)=>a.country)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By University</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(applications,(a:any)=>a.university)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#16a34a" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><CardTitle>By Counsellor</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(applications,(a:any)=>a.counsellorId || a.counselorId)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
            </div>
          </TabsContent>

          {/* Admissions */}
          <TabsContent value="admissions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Admissions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{admissions.length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Deposits</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{admissions.filter((ad:any)=>!!ad.depositDate).length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Visa</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{admissions.filter((ad:any)=>!!ad.visaDate || String(ad.visaStatus||'').toLowerCase()==='approved').length}</div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card><CardHeader><CardTitle>By Status</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(admissions,(ad:any)=>ad.status || ad.caseStatus || ad.decision)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Branch</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(admissions,(ad:any)=>ad.branchId)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#34d399" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Source</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(admissions,(ad:any)=>ad.source)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#a7f3d0" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Intake</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(admissions,(ad:any)=>ad.intake)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#6ee7b7" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By Country</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(admissions,(ad:any)=>ad.country)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#34d399" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle>By University</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(admissions,(ad:any)=>ad.university)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><CardTitle>By Counsellor</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupCount(admissions,(ad:any)=>ad.counsellorId || ad.counselorId)}><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#059669" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
