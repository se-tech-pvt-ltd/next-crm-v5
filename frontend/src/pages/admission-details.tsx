import { useMemo, useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityTracker } from '@/components/activity-tracker';
import { apiRequest } from '@/lib/queryClient';
import { type Admission, type Student, type Application } from '@/lib/types';
import { ArrowLeft, Award, User as UserIcon, Plane, Calendar, ExternalLink } from 'lucide-react';

export default function AdmissionDetails() {
  const [match, params] = useRoute('/admissions/:id');
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: admissions, isLoading, error } = useQuery<Admission[]>({
    queryKey: ['/api/admissions'],
  });
  const admission = useMemo(() => (admissions || []).find((a) => a.id === params?.id), [admissions, params?.id]);

  const { data: student } = useQuery<Student>({
    queryKey: admission?.studentId ? ['/api/students', admission.studentId] : ['noop'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/students/${admission?.studentId}`);
      return res.json();
    },
    enabled: !!admission?.studentId,
  });

  const { data: linkedApplication } = useQuery<Application>({
    queryKey: admission?.applicationId ? ['/api/applications', admission.applicationId] : ['noop'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/applications/${admission?.applicationId}`);
      return res.json();
    },
    enabled: !!admission?.applicationId,
  });

  const [currentVisaStatus, setCurrentVisaStatus] = useState<string>((admission?.visaStatus || 'pending').replace(/_/g, '-'));
  useEffect(() => {
    if (admission) setCurrentVisaStatus((admission.visaStatus || 'pending').replace(/_/g, '-'));
  }, [admission]);

  const updateVisaStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!admission) return;
      const res = await apiRequest('PUT', `/api/admissions/${admission.id}`, { visaStatus: newStatus });
      if (!res.ok) throw new Error('Failed to update visa status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      queryClient.refetchQueries({ queryKey: ['/api/admissions'] });
    },
  });

  const handleVisaStatusChange = (newStatus: string) => {
    setCurrentVisaStatus(newStatus);
    updateVisaStatusMutation.mutate(newStatus);
  };

  if (!match) return <div>Not found</div>;

  if (error) {
    return (
      <Layout title="Admission Details">
        <Card><CardContent className="p-6">Error loading admission</CardContent></Card>
      </Layout>
    );
  }

  if (!isLoading && !admission) {
    return (
      <Layout title={<Button variant="ghost" size="sm" onClick={() => setLocation('/admissions')} className="p-1 h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>}>
        <Card><CardContent className="p-6">Admission not found</CardContent></Card>
      </Layout>
    );
  }

  return (
    <Layout
      title={
        <Button variant="ghost" size="sm" onClick={() => setLocation('/admissions')} className="p-1 h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      }
      helpText="View admission details, update visa status, and review linked student information."
    >
      {isLoading || !admission ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="text-xs md:text-[12px]">
          <div className="flex gap-0 min-h-[calc(100vh-12rem)] w-full">
            {/* Main Content */}
            <div className="flex-1 flex flex-col space-y-4 min-w-0 w-full">
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">Linked Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <div className="text-[11px] text-gray-600">Admission ID</div>
                      <div className="text-sm font-medium break-all">{(admission as any).admissionId || admission.id}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-gray-600">Student</div>
                      {student ? (
                        <Button variant="link" className="h-5 p-0 text-xs leading-5" onClick={() => setLocation(`/students/${student.id}`)}>
                          {student.name}
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-500">Loading...</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-gray-600">Application ID</div>
                      {linkedApplication ? (
                        <Button variant="link" className="h-5 p-0 text-xs leading-5" onClick={() => setLocation(`/applications/${linkedApplication.id}`)}>
                          {linkedApplication.applicationCode || linkedApplication.id}
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-500">Not linked</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center"><Award className="w-5 h-5 mr-2" />Admission Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <div className="text-[11px] text-gray-600">Status</div>
                      <Badge className="w-fit">{linkedApplication?.appStatus || 'Open'}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-gray-600">Case Status</div>
                      <div className="text-sm">{linkedApplication?.caseStatus || 'Raw'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-gray-600">Full Tuition Fee</div>
                      <div className="text-sm">{(admission as any).tuitionFee || 'Not specified'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-gray-600">Scholarship</div>
                      <div className="text-sm">{admission.scholarshipAmount || 'None'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-gray-600">Net Tuition Fee</div>
                      <div className="text-sm">{(() => { const t = parseFloat(String((admission as any).tuitionFee||'').replace(/[^0-9.-]/g,'')); const s = parseFloat(String(admission.scholarshipAmount||'').replace(/[^0-9.-]/g,'')); if (isNaN(t)) return 'Not specified'; const net = t - (isNaN(s)?0:s); return isNaN(net) ? 'Not specified' : net.toLocaleString(); })()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-gray-600">Initial Deposit</div>
                      <div className="text-sm">{admission.depositAmount || 'Not specified'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-gray-600">Deposit Date</div>
                      <div className="text-sm">{admission.depositDeadline ? new Date(admission.depositDeadline as any).toLocaleDateString() : 'Not specified'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-gray-600">Visa Date</div>
                      <div className="text-sm">{(function(){ const a:any = admission as any; const d = a.visaApprovalDate || a.visaInterviewDate || a.visaApplicationDate || null; return d ? new Date(d).toLocaleDateString() : 'Not provided'; })()}</div>
                    </div>
                    <div className="space-y-1 md:col-span-1 lg:col-span-1">
                      <div className="text-[11px] text-gray-600">Google Drive Link</div>
                      {linkedApplication?.googleDriveLink ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); window.open(linkedApplication.googleDriveLink!, '_blank', 'noopener'); }}>
                            <ExternalLink className="w-4 h-4 mr-1" /> Open
                          </Button>
                          <span className="text-[11px] text-gray-500 truncate max-w-[14rem]">{linkedApplication.googleDriveLink}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not provided</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center"><Plane className="w-5 h-5 mr-2" />Visa Information</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] text-gray-600">Visa Status</div>
                      <Select value={currentVisaStatus} onValueChange={handleVisaStatusChange}>
                        <SelectTrigger className="h-8 text-xs w-40">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-applied">Not Applied</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="interview-scheduled">Interview Scheduled</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant={currentVisaStatus === 'approved' ? 'default' : 'secondary'} className="w-fit">
                    {currentVisaStatus.replace(/[_-]/g, ' ').toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              {student && (
                <Card className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center"><UserIcon className="w-5 h-5 mr-2" />Student Information</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setLocation(`/students/${student.id}`)}>
                        <ExternalLink className="w-4 h-4 mr-2" /> View Profile
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-[11px] text-gray-600">Name</div>
                        <div className="text-sm font-medium">{student.name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] text-gray-600">Email</div>
                        <div className="text-sm">{student.email}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] text-gray-600">Phone</div>
                        <div className="text-sm">{student.phone || 'Not provided'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] text-gray-600">Status</div>
                        <Badge variant="outline" className="w-fit">{student.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Activity Sidebar */}
            <div className="w-[30rem] flex-shrink-0 bg-gray-50 rounded-lg p-3 flex flex-col min-h-full">
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Activity Timeline
              </h3>
              {isLoading ? (
                <div className="space-y-4 flex-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <ActivityTracker entityType="admission" entityId={admission.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
