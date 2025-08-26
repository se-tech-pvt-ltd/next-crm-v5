import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatStatus } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/help-tooltip';
import { Lead, Student, Application, Admission } from '@shared/schema';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  GraduationCap, 
  Trophy,
  DollarSign,
  Globe,
  Calendar,
  Target
} from 'lucide-react';

export default function Reports() {
  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const { data: admissions, isLoading: admissionsLoading } = useQuery<Admission[]>({
    queryKey: ['/api/admissions'],
  });

  const isLoading = leadsLoading || studentsLoading || applicationsLoading || admissionsLoading;

  // Calculate conversion metrics
  const totalLeads = leads?.length || 0;
  const totalStudents = students?.length || 0;
  const totalApplications = applications?.length || 0;
  const acceptedAdmissions = admissions?.filter(a => a.decision === 'accepted').length || 0;
  
  const leadToStudentRate = totalLeads > 0 ? (totalStudents / totalLeads) * 100 : 0;
  const studentToApplicationRate = totalStudents > 0 ? (totalApplications / totalStudents) * 100 : 0;
  const applicationToAdmissionRate = totalApplications > 0 ? (acceptedAdmissions / totalApplications) * 100 : 0;

  // Lead source analysis
  const leadSources = leads?.reduce((acc, lead) => {
    const source = lead.source || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Country analysis
  const targetCountries = students?.reduce((acc, student) => {
    const country = student.targetCountry || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Program analysis
  const targetPrograms = students?.reduce((acc, student) => {
    const program = student.targetProgram || 'Unknown';
    acc[program] = (acc[program] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // University analysis
  const universities = applications?.reduce((acc, app) => {
    acc[app.university] = (acc[app.university] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Status distribution
  const leadStatuses = leads?.reduce((acc, lead) => {
    const status = lead.status || 'new';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const studentStatuses = students?.reduce((acc, student) => {
    const status = student.status || 'active';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const applicationStatuses = applications?.reduce((acc, app) => {
    const status = app.status || 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const getTopItems = (data: Record<string, number>, limit = 5) => {
    return Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);
  };

  return (
    <Layout 
      title="Reports" 
      subtitle="Analytics and insights"
      helpText="Comprehensive analytics and reports to track your consultancy's performance, conversion rates, and business insights."
    >
      <div className="space-y-6">
        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Lead Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {leadToStudentRate.toFixed(1)}%
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Leads to Students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <GraduationCap className="w-4 h-4 mr-2" />
                Application Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-amber-600">
                  {studentToApplicationRate.toFixed(1)}%
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Students to Applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-emerald-600">
                  {applicationToAdmissionRate.toFixed(1)}%
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Applications to Admissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Avg. Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple">
                45
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Days (Lead to Application)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Analysis & Lead Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversion Funnel</CardTitle>
                <HelpTooltip content="Track how prospects move through your sales funnel from initial lead to successful admission." />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Leads</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{totalLeads}</span>
                      <span className="text-xs text-gray-500">100%</span>
                    </div>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="w-4 h-4 text-purple" />
                      <span className="text-sm font-medium">Students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{totalStudents}</span>
                      <span className="text-xs text-gray-500">{leadToStudentRate.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Progress value={leadToStudentRate} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Applications</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{totalApplications}</span>
                      <span className="text-xs text-gray-500">
                        {totalLeads > 0 ? ((totalApplications / totalLeads) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress value={totalLeads > 0 ? (totalApplications / totalLeads) * 100 : 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">Admissions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{acceptedAdmissions}</span>
                      <span className="text-xs text-gray-500">
                        {totalLeads > 0 ? ((acceptedAdmissions / totalLeads) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                  <Progress value={totalLeads > 0 ? (acceptedAdmissions / totalLeads) * 100 : 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopItems(leadSources).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{source}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / totalLeads) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">{count}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(leadSources).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No lead source data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geographic & Program Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Target Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                Popular Destinations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopItems(targetCountries).map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{country}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full" 
                          style={{ width: `${(count / totalStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">{count}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(targetCountries).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No destination data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Popular Programs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="w-4 h-4 mr-2" />
                Popular Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTopItems(targetPrograms).map(([program, count]) => (
                  <div key={program} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{program}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple h-2 rounded-full" 
                          style={{ width: `${(count / totalStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">{count}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(targetPrograms).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No program data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(leadStatuses).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">{formatStatus(status)}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-gray-500">
                        {totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Student Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Student Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(studentStatuses).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">{formatStatus(status)}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-gray-500">
                        {totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(applicationStatuses).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">{formatStatus(status)}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-gray-500">
                        {totalApplications > 0 ? ((count / totalApplications) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Universities */}
        <Card>
          <CardHeader>
            <CardTitle>Top Universities by Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTopItems(universities, 6).map(([university, count]) => (
                <div key={university} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{university}</h4>
                      <p className="text-sm text-gray-500">{count} applications</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {totalApplications > 0 ? ((count / totalApplications) * 100).toFixed(0) : 0}%
                      </div>
                      <div className="text-xs text-gray-500">of total</div>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(universities).length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm text-gray-500">No university data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
