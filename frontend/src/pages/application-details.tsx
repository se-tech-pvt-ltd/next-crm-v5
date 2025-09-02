import { useEffect, useMemo, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CollapsibleCard } from '@/components/collapsible-card';
import { ActivityTracker } from '@/components/activity-tracker';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type Application, type Student } from '@/lib/types';
import {
  ArrowLeft,
  School,
  User as UserIcon,
  ExternalLink,
  MapPin,
  Calendar,
  BookOpen,
  Edit,
  Save,
  X,
  Copy
} from 'lucide-react';

export default function ApplicationDetails() {
  const [match, params] = useRoute('/applications/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading, error } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });
  const application = useMemo(() => (applications || []).find((a) => a.id === params?.id), [applications, params?.id]);

  const { data: student } = useQuery<Student>({
    queryKey: application?.studentId ? ['/api/students', application.studentId] : ['noop'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/students/${application?.studentId}`);
      return res.json();
    },
    enabled: !!application?.studentId,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Application>>({});
  const [currentStatus, setCurrentStatus] = useState<string>(application?.appStatus || 'Open');

  useEffect(() => {
    if (application) {
      setEditData({
        university: application.university,
        program: application.program,
        courseType: application.courseType,
        country: application.country,
        intake: application.intake,
        channelPartner: application.channelPartner,
        googleDriveLink: application.googleDriveLink,
        caseStatus: application.caseStatus || 'Raw',
      });
      setCurrentStatus(application.appStatus || 'Open');
    }
  }, [application]);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!application) return;
      const res = await apiRequest('PUT', `/api/applications/${application.id}`, { appStatus: newStatus });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (updated: Application) => {
      setCurrentStatus(updated.appStatus || 'Open');
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.refetchQueries({ queryKey: ['/api/applications'] });
      toast({ title: 'Status updated' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async (data: Partial<Application>) => {
      if (!application) return;
      const res = await apiRequest('PUT', `/api/applications/${application.id}`, data);
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        throw new Error(info.message || 'Failed to update application');
      }
      return res.json();
    },
    onSuccess: (updated: Application) => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      setIsEditing(false);
      setCurrentStatus(updated.appStatus || 'Open');
      toast({ title: 'Application updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message || 'Failed to update application', variant: 'destructive' })
  });

  const handleSave = () => {
    updateApplicationMutation.mutate({ ...editData });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'Needs Attention': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusSequence = ['Open', 'Needs Attention', 'Closed'];
  const StatusProgressBar = () => {
    const currentIndex = statusSequence.findIndex((s) => (currentStatus || 'Open') === s);
    return (
      <div className="w-full bg-gray-100 rounded-md p-1.5 mb-3">
        <div className="flex items-center justify-between relative">
          {statusSequence.map((status, index) => {
            const isCompleted = index <= (currentIndex < 0 ? 0 : currentIndex);
            const handleClick = () => {
              if (!application) return;
              if (status === currentStatus) return;
              updateStatusMutation.mutate(status);
            };
            return (
              <div key={status} className="flex flex-col items-center relative flex-1 cursor-pointer select-none" onClick={handleClick} role="button" aria-label={`Set status to ${status}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'
                }`}>
                  {isCompleted ? <div className="w-1.5 h-1.5 bg-white rounded-full" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                </div>
                <span className={`mt-1 text-xs font-medium text-center ${isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>
                  {status}
                </span>
                {index < statusSequence.length - 1 && (
                  <div className={`absolute top-2.5 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return false;
    try {
      if (navigator.clipboard && (window as any).isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  if (!match) return <div>Not found</div>;

  if (error) {
    return (
      <Layout title="Application Details">
        <Card><CardContent className="p-6">Error loading application</CardContent></Card>
      </Layout>
    );
  }

  return (
    <Layout
      title={
        <Button variant="ghost" size="sm" onClick={() => setLocation('/applications')} className="p-1 h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      }
      helpText="View and edit application details, track activities, and review linked student information."
    >
      {isLoading || !application ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="text-xs md:text-[12px]">
          <StatusProgressBar />

          <div className="flex gap-0 min-h-[calc(100vh-12rem)] w-full">
            {/* Main Content */}
            <div className="flex-1 flex flex-col space-y-4 min-w-0 w-full">
              {/* Overview / Editable Information */}
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center"><School className="w-5 h-5 mr-2" />Application Information</CardTitle>
                    <div className="flex items-center gap-3">
                      {!isEditing ? (
                        <Button variant="outline" size="sm" className="rounded-full px-2 md:px-3 [&_svg]:size-5" onClick={() => setIsEditing(true)} title="Edit">
                          <Edit />
                          <span className="hidden lg:inline">Edit</span>
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={handleSave} disabled={updateApplicationMutation.isPending}>
                            <Save className="w-4 h-4 mr-1" /> Save Changes
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditData({
                           university: application.university,
                           program: application.program,
                           courseType: application.courseType,
                           country: application.country,
                           intake: application.intake,
                           channelPartner: application.channelPartner,
                           googleDriveLink: application.googleDriveLink,
                           caseStatus: application.caseStatus || 'Raw',
                         }); }}>
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Application ID</span></Label>
                      <Input value={application.id} disabled className="h-8 text-xs transition-all" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>App Status</span></Label>
                      <Input value={currentStatus} disabled className="h-8 text-xs transition-all" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Case Status</span></Label>
                      {isEditing ? (
                        <Select value={editData.caseStatus || 'Raw'} onValueChange={(v) => setEditData({ ...editData, caseStatus: v })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select case status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Raw">Raw</SelectItem>
                            <SelectItem value="Not Eligible">Not Eligible</SelectItem>
                            <SelectItem value="Documents Pending">Documents Pending</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Ready to Apply">Ready to Apply</SelectItem>
                            <SelectItem value="Submitted">Submitted</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="COL Received">COL Received</SelectItem>
                            <SelectItem value="UOL Requested">UOL Requested</SelectItem>
                            <SelectItem value="UOL Received">UOL Received</SelectItem>
                            <SelectItem value="Interview Outcome Awaiting">Interview Outcome Awaiting</SelectItem>
                            <SelectItem value="Deposit">Deposit</SelectItem>
                            <SelectItem value="Deferred">Deferred</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={application.caseStatus || 'Raw'} disabled className="h-8 text-xs transition-all" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Linked Student</span></Label>
                      <Input value={student ? `${student.name} (${student.email})` : application.studentId} disabled className="h-8 text-xs transition-all" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><School className="w-4 h-4" /><span>University</span></Label>
                      <Input value={isEditing ? (editData.university || '') : (application.university || '')} onChange={(e) => setEditData({ ...editData, university: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Program</span></Label>
                      <Input value={isEditing ? (editData.program || '') : (application.program || '')} onChange={(e) => setEditData({ ...editData, program: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Course Type</span></Label>
                      <Input value={isEditing ? (editData.courseType || '') : (application.courseType || '')} onChange={(e) => setEditData({ ...editData, courseType: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Country</span></Label>
                      <Input value={isEditing ? (editData.country || '') : (application.country || '')} onChange={(e) => setEditData({ ...editData, country: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>Intake</span></Label>
                      <Input value={isEditing ? (editData.intake || '') : (application.intake || '')} onChange={(e) => setEditData({ ...editData, intake: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Channel Partner</span></Label>
                      <Input value={isEditing ? (editData.channelPartner || '') : (application.channelPartner || '')} onChange={(e) => setEditData({ ...editData, channelPartner: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="flex items-center space-x-2"><ExternalLink className="w-4 h-4" /><span>Google Drive Link</span></Label>
                      {isEditing ? (
                        <Input value={editData.googleDriveLink || ''} onChange={(e) => setEditData({ ...editData, googleDriveLink: e.target.value })} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={async (e) => { e.preventDefault(); if (!application.googleDriveLink) { toast({ title: 'No link', description: 'Google Drive link is not provided', variant: 'destructive' }); return; } const ok = await copyToClipboard(application.googleDriveLink); toast({ title: ok ? 'Copied' : 'Copy failed', description: ok ? 'Google Drive link copied to clipboard' : 'Could not copy link', variant: ok ? undefined : 'destructive' }); }} disabled={!application.googleDriveLink}>
                            <Copy className="w-4 h-4 mr-1" /> Copy
                          </Button>
                          <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); if (application.googleDriveLink) window.open(application.googleDriveLink, '_blank', 'noopener'); }} disabled={!application.googleDriveLink}>
                            <ExternalLink className="w-4 h-4 mr-1" /> Open
                          </Button>
                          {!application.googleDriveLink && (
                            <span className="text-[11px] text-gray-500">Not provided</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Information */}
              <CollapsibleCard
                persistKey={`application-details:student:${application.id}`}
                header={<CardTitle className="text-sm flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Student</span></CardTitle>}
              >
                <div className="flex items-center justify-between">
                  {student ? (
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-gray-600">{student.email}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Loading student...</p>
                  )}
                  {student && (
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/students/${student.id}`)}>View Profile</Button>
                  )}
                </div>
              </CollapsibleCard>
            </div>

            {/* Activity Sidebar */}
            <div className="w-[30rem] flex-shrink-0 bg-gray-50 rounded-lg p-3 flex flex-col min-h-full">
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Activity Timeline
              </h3>
              <div className="flex-1 overflow-y-auto">
                <ActivityTracker
                  entityType="application"
                  entityId={application.id}
                  initialInfoDate={application.createdAt as any}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
