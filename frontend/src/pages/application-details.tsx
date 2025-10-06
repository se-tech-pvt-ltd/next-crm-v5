import { useEffect, useMemo, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DropdownsService from '@/services/dropdowns';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivityTracker } from '@/components/activity-tracker';
import * as ApplicationsService from '@/services/applications';
import * as StudentsService from '@/services/students';
import * as AdmissionsService from '@/services/admissions';
import * as ActivitiesService from '@/services/activities';
import * as UsersService from '@/services/users';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import { useToast } from '@/hooks/use-toast';
import { type Application, type Student, type Admission } from '@/lib/types';
import { AddAdmissionModal } from '@/components/add-admission-modal';
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
  Copy,
  Plus,
  Users
} from 'lucide-react';

export default function ApplicationDetails() {
  const [match, params] = useRoute('/applications/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading, error } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    queryFn: async () => ApplicationsService.getApplications() as any,
  });
  const application = useMemo(() => (applications || []).find((a) => a.id === params?.id), [applications, params?.id]);

  const { data: applicationsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Applications'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Applications')
  });

  const caseStatusOptions = useMemo(() => {
    const dd: any = applicationsDropdowns as any;
    let list: any[] = dd?.['Case Status'] || dd?.caseStatus || dd?.CaseStatus || [];
    if (!Array.isArray(list)) list = [];
    list = [...list].sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0)));
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
  }, [applicationsDropdowns]);

  const { data: student } = useQuery<Student>({
    queryKey: application?.studentId ? ['/api/students', application.studentId] : ['noop'],
    queryFn: async () => StudentsService.getStudent(application?.studentId),
    enabled: !!application?.studentId,
  });

  const { data: admissions } = useQuery<Admission[]>({
    queryKey: ['/api/admissions'],
    queryFn: async () => AdmissionsService.getAdmissions() as any,
  });
  const admissionForApp = useMemo(() => (admissions || []).find((a) => a.applicationId === application?.id), [admissions, application?.id]);

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    enabled: true,
  });
  const { data: regions = [] } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: async () => RegionsService.listRegions(),
    staleTime: 60_000,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: async () => BranchesService.listBranches(),
    staleTime: 60_000,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Application>>({});
  const [currentStatus, setCurrentStatus] = useState<string>(application?.appStatus || 'Open');
  const [isAddAdmissionOpen, setIsAddAdmissionOpen] = useState(false);

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
        caseStatus: application.caseStatus || '',
      });
      setCurrentStatus(application.appStatus || 'Open');
    }
  }, [application]);

  // When application dropdowns load, pick default for Case Status if none provided
  useEffect(() => {
    try {
      if (!editData.caseStatus && caseStatusOptions && caseStatusOptions.length > 0) {
        const def = caseStatusOptions.find(o => (o as any).isDefault || (o as any).is_default || false);
        if (def) setEditData(d => ({ ...(d || {}), caseStatus: (def as any).value }));
      }
    } catch {}
  }, [caseStatusOptions]);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!application) return;
      return ApplicationsService.updateApplication(application.id, { appStatus: newStatus });
    },
    onMutate: async (newStatus: string) => {
      await queryClient.cancelQueries({ queryKey: ['/api/applications'] });
      const prev = application?.appStatus ?? '';
      setCurrentStatus(newStatus);
      return { previousStatus: prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previousStatus) setCurrentStatus(context.previousStatus);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    },
    onSuccess: async (updated: Application, _vars, context: any) => {
      try {
        setCurrentStatus(updated.appStatus || 'Open');
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        queryClient.refetchQueries({ queryKey: ['/api/applications'] });
        try {
          const key = [`/api/activities/application/${String(updated.id)}`];
          queryClient.invalidateQueries({ queryKey: key });
          queryClient.refetchQueries({ queryKey: key });
        } catch (e) {
          console.error('Failed to refresh activities cache', e);
        }
        toast({ title: 'Status updated' });
      } catch (err) {
        console.error('Error handling status update', err);
      }
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async (data: Partial<Application>) => {
      if (!application) return;
      return ApplicationsService.updateApplication(application.id, data);
    },
    onMutate: async (data: Partial<Application>) => {
      const prev = application ? { ...application } : null;
      return { previousApp: prev };
    },
    onSuccess: async (updated: Application, _vars, context: any) => {
      try {
        const prevApp = context?.previousApp as Application | null;
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        setIsEditing(false);
        setCurrentStatus(updated.appStatus || 'Open');
        try {
          const key = [`/api/activities/application/${String(updated.id)}`];
          queryClient.invalidateQueries({ queryKey: key });
          queryClient.refetchQueries({ queryKey: key });
        } catch (e) {
          console.error('Failed to refresh activities cache', e);
        }
        toast({ title: 'Application updated' });
      } catch (err) {
        console.error('Error in updateApplicationMutation onSuccess', err);
      }
    },
    onError: (e: any, _vars, context: any) => {
      toast({ title: 'Error', description: e.message || 'Failed to update application', variant: 'destructive' });
      if (context?.previousApp) setCurrentStatus(context.previousApp.appStatus);
    }
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
                  isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-blue-600'
                }`}>
                  {isCompleted ? <div className="w-1.5 h-1.5 bg-white rounded-full" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                </div>
                <span className={`mt-1 text-xs font-medium text-center ${isCompleted ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
                  {status}
                </span>
                {index < statusSequence.length - 1 && (
                  <div className={`absolute top-2.5 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${index < currentIndex ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
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
                      {admissionForApp ? (
                      <Button variant="outline" size="sm" className="rounded-full px-2 md:px-3 [&_svg]:size-5" onClick={() => { try { setLocation(`/admissions/${admissionForApp.id}`); } catch { try { window.location.hash = `#/admissions/${admissionForApp.id}`; } catch {} } }} title="View Admission">
                          <ExternalLink />
                          <span className="hidden lg:inline">View Admission</span>
                        </Button>
                      ) : !isEditing ? (
                        <>
                          <Button variant="outline" size="sm" className="rounded-full px-2 md:px-3 [&_svg]:size-5" onClick={() => { setTimeout(() => { try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAddAdmissionOpen(true)); } catch { setIsAddAdmissionOpen(true); } }, 160); }} title="Add Admission">
                            <Plus />
                            <span className="hidden lg:inline">Add Admission</span>
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-full px-2 md:px-3 [&_svg]:size-5" onClick={() => setIsEditing(true)} title="Edit">
                            <Edit />
                            <span className="hidden lg:inline">Edit</span>
                          </Button>
                        </>
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
                      <Label className="flex items-center space-x-2"><span>Student</span></Label>
                      {student ? (
                        <Button variant="link" className="h-8 p-0 text-xs" onClick={() => setLocation(`/students/${student.id}`)}>
                          {student.name}
                        </Button>
                      ) : (
                        <Input value={application.studentId} disabled className="h-8 text-xs transition-all" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Case Status</span></Label>
                      {isEditing ? (
                        <Select value={editData.caseStatus || 'Raw'} onValueChange={(v) => setEditData({ ...editData, caseStatus: v })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Please select" />
                          </SelectTrigger>
                          <SelectContent>
                            {caseStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={application.caseStatus || 'Raw'} disabled className="h-8 text-xs transition-all" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Application ID</span></Label>
                      <Input value={application.applicationCode || 'Not provided'} disabled className="h-8 text-xs transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center"><BookOpen className="w-5 h-5 mr-2" />Program Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Country</span></Label>
                      <Input value={isEditing ? (editData.country || '') : (application.country || '')} disabled className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><School className="w-4 h-4" /><span>University</span></Label>
                      <Input value={isEditing ? (editData.university || '') : (application.university || '')} disabled className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Course Type</span></Label>
                      <Input value={isEditing ? (editData.courseType || '') : (application.courseType || '')} disabled className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Program</span></Label>
                      <Input value={isEditing ? (editData.program || '') : (application.program || '')} disabled className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>Intake</span></Label>
                      <Input value={isEditing ? (editData.intake || '') : (application.intake || '')} disabled className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center"><ExternalLink className="w-5 h-5 mr-2" />Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Channel Partner</span></Label>
                      <Input value={isEditing ? (editData.channelPartner || '') : (application.channelPartner || '')} onChange={(e) => setEditData({ ...editData, channelPartner: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2 md:col-span-1">
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


              <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center"><Users className="w-5 h-5 mr-2" />Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Region</span></Label>
                      <div className="text-xs px-2 py-1.5 rounded border bg-white">
                        {(() => {
                          const rid = (application as any)?.regionId || (student as any)?.regionId;
                          const r = Array.isArray(regions) ? (regions as any[]).find((x: any) => String(x.id) === String(rid)) : null;
                          if (!r) return '—';
                          const regionName = (r as any).regionName || (r as any).name || (r as any).id;
                          const head = Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String((r as any).regionHeadId || '')) : null;
                          const headName = head ? ([head.firstName || head.first_name, head.lastName || head.last_name].filter(Boolean).join(' ').trim() || head.email || head.id) : '';
                          const headEmail = head?.email || '';
                          return (
                            <div>
                              <div className="font-medium text-xs">{`${regionName}${headName ? ` - Head: ${headName}` : ''}`}</div>
                              {headEmail ? <div className="text-[11px] text-muted-foreground">{headEmail}</div> : null}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Branch</span></Label>
                      <div className="text-xs px-2 py-1.5 rounded border bg-white">
                        {(() => {
                          const bid = (application as any)?.branchId || (student as any)?.branchId;
                          const b = Array.isArray(branches) ? (branches as any[]).find((x: any) => String(x.id) === String(bid)) : null;
                          if (!b) return '—';
                          const branchName = (b as any).branchName || (b as any).name || (b as any).code || (b as any).id;
                          const headId = (b as any).branchHeadId || (b as any).managerId || null;
                          const head = headId && Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(headId)) : null;
                          const headName = head ? ([head.firstName || head.first_name, head.lastName || head.last_name].filter(Boolean).join(' ').trim() || head.email || head.id) : '';
                          const headEmail = head?.email || '';
                          return (
                            <div>
                              <div className="font-medium text-xs">{`${branchName}${headName ? ` - Head: ${headName}` : ''}`}</div>
                              {headEmail ? <div className="text-[11px] text-muted-foreground">{headEmail}</div> : null}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Admission Officer</span></Label>
                      <div className="text-xs px-2 py-1.5 rounded border bg-white">
                        {(() => {
                          const officerId = (application as any)?.admissionOfficerId || (student as any)?.admissionOfficerId || (student as any)?.admission_officer_id || '';
                          const officer = officerId && Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(officerId)) : null;
                          if (!officer) return '—';
                          const fullName = [officer.firstName || officer.first_name, officer.lastName || officer.last_name].filter(Boolean).join(' ').trim();
                          const email = officer.email || '';
                          return (
                            <div>
                              <div className="font-medium text-xs">{fullName || email || officer.id}</div>
                              {email ? <div className="text-[11px] text-muted-foreground">{email}</div> : null}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Counselor</span></Label>
                      <div className="text-xs px-2 py-1.5 rounded border bg-white">
                        {(() => {
                          const cid = (application as any)?.counsellorId || (application as any)?.counselorId || (student as any)?.counselorId || (student as any)?.counsellorId;
                          const c = cid && Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(cid)) : null;
                          if (!c) return '—';
                          const fullName = [c.firstName || c.first_name, c.lastName || c.last_name].filter(Boolean).join(' ').trim();
                          const email = c.email || '';
                          return (
                            <div>
                              <div className="font-medium text-xs">{fullName || email || c.id}</div>
                              {email ? <div className="text-[11px] text-muted-foreground">{email}</div> : null}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>

            {/* Activity Sidebar (lead-style) */}
            <div className="border-l bg-white flex flex-col min-h-0" style={{ width: '420px' }}>
              <div className="pt-1 min-h-0 flex-1 overflow-y-auto">
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

      <AddAdmissionModal
        open={isAddAdmissionOpen}
        onOpenChange={setIsAddAdmissionOpen}
        applicationId={application?.id as any}
        studentId={application?.studentId}
      />

    </Layout>
  );
}
