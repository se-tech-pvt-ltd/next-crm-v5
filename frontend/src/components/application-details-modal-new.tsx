import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
console.log('[modal] loaded: frontend/src/components/application-details-modal-new.tsx');
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivityTracker } from '@/components/activity-tracker';
import { AddAdmissionModal } from '@/components/add-admission-modal';
import * as ApplicationsService from '@/services/applications';
import * as StudentsService from '@/services/students';
import * as AdmissionsService from '@/services/admissions';
import * as DropdownsService from '@/services/dropdowns';
import * as ActivitiesService from '@/services/activities';
import * as UsersService from '@/services/users';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { type Application, type Student, type Admission } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { StudentProfileModal } from './student-profile-modal-new';
import {
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

interface ApplicationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onOpenStudentProfile?: (studentId: string) => void;
  startInEdit?: boolean;
}

export function ApplicationDetailsModal({ open, onOpenChange, application, onOpenStudentProfile, startInEdit }: ApplicationDetailsModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: authUser, accessByRole } = useAuth() as any;
  const normalizeModule = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const singularize = (s: string) => String(s || '').replace(/s$/i, '');
  const canEditApplication = React.useMemo(() => {
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalizeModule(a.moduleName ?? a.module_name)) === 'application');
    if (entries.length === 0) return true;
    return entries.some((e: any) => (e.canEdit ?? e.can_edit) === true);
  }, [accessByRole]);

  const normalizeRoleValue = React.useCallback((value?: string) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'), []);
  const getNormalizedRole = React.useCallback(() => {
    try {
      const raw = authUser?.role || authUser?.role_name || authUser?.roleName || authUser?.role_details?.role_name || authUser?.roleDetails?.roleName || '';
      if (raw) return normalizeRoleValue(raw);
      const token = (() => { try { return localStorage.getItem('auth_token'); } catch { return null; } })();
      if (token) {
        try {
          const parts = String(token).split('.');
          if (parts.length >= 2) {
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const pad = b64.length % 4;
            const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
            const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const payload = JSON.parse(json) as any;
            const tokenRole = payload?.role_details?.role_name || payload?.role_name || payload?.role || '';
            if (tokenRole) return normalizeRoleValue(tokenRole);
          }
        } catch {}
      }
    } catch {}
    return '';
  }, [authUser, normalizeRoleValue]);
  const roleName = React.useMemo(() => getNormalizedRole(), [getNormalizedRole]);
  const isPartnerRole = React.useMemo(() => String(roleName || '').includes('partner'), [roleName]);

  const [currentApp, setCurrentApp] = useState<Application | null>(application || null);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const openStudentProfile = (sid: string) => {
    try { setLocation(`/students/${sid}`); } catch {}
    if (typeof onOpenStudentProfile === 'function') {
      onOpenStudentProfile(sid);
      onOpenChange(false);
      return;
    }
    setSelectedStudentId(sid);
    // Close the current application modal first
    try {
      onOpenChange(false);
    } catch {}
    try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsStudentProfileOpen(true)); } catch { setIsStudentProfileOpen(true); }
  };
  useEffect(() => {
    setCurrentApp(application || null);
  }, [application]);

  useEffect(() => {
    if (open && startInEdit) {
      if (canEditApplication) setIsEditing(true); else setIsEditing(false);
      return;
    }
    if (!open) {
      setIsEditing(false);
    }
  }, [open, startInEdit, canEditApplication]);

  useEffect(() => {
    if (!currentApp) return;
    setIsEditing(Boolean(startInEdit));
  }, [currentApp?.id, startInEdit]);

  const { data: applicationsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Applications'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Applications'),
    enabled: open,
  });

  const normalizeKey = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const caseStatusOptions = useMemo(() => {
    const dd: any = applicationsDropdowns as any;
    if (!dd || typeof dd !== 'object') return [];
    const keyMap: Record<string, string> = {};
    for (const k of Object.keys(dd || {})) keyMap[normalizeKey(k)] = k;
    const candidates = ['Case Status','caseStatus','CaseStatus','case_status','Case status'];
    let list: any[] = [];
    for (const raw of candidates) {
      const foundKey = keyMap[normalizeKey(raw)];
      if (foundKey && Array.isArray(dd[foundKey])) { list = dd[foundKey]; break; }
    }
    if (!Array.isArray(list)) list = [];
    list = [...list].sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0)));
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
  }, [applicationsDropdowns]);

  const makeOptions = useCallback((keys: string[]) => {
    const dd: any = applicationsDropdowns as any;
    if (!dd || typeof dd !== 'object') return [] as {label:string;value:string}[];
    const keyMap: Record<string, string> = {};
    for (const k of Object.keys(dd || {})) keyMap[normalizeKey(k)] = k;
    let list: any[] = [];
    for (const raw of keys) {
      const foundKey = keyMap[normalizeKey(raw)];
      if (foundKey && Array.isArray(dd[foundKey])) { list = dd[foundKey]; break; }
    }
    if (!Array.isArray(list)) list = [];
    return [...list].sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0))).map((o: any) => ({ label: o.value, value: o.id || o.key || o.value }));
  }, [applicationsDropdowns]);

  const courseTypeOptions = useMemo(() => makeOptions(['Course Type','courseType','course_type','CourseType']), [makeOptions]);
  const countryOptions = useMemo(() => makeOptions(['Country','country']), [makeOptions]);
  const intakeOptions = useMemo(() => makeOptions(['Intake','intake']), [makeOptions]);
  const channelPartnerOptions = useMemo(() => makeOptions(['Channel Partner','ChannelPartners','channelPartner','channel_partners','Channel Partner(s)','ChannelPartner']), [makeOptions]);

  const mapToOptionValue = useCallback((raw: string | undefined, options: {label:string;value:string}[]) => {
    if (!raw) return '';
    const found = options.find(o => o.value === raw || o.label === raw || (String(o.value) === String(raw)));
    return found ? found.value : raw;
  }, []);

  const { data: student } = useQuery<Student>({
    queryKey: currentApp?.studentId ? ['/api/students', currentApp.studentId] : ['noop'],
    queryFn: async () => StudentsService.getStudent(currentApp?.studentId),
    enabled: !!currentApp?.studentId,
  });

  const { data: admissions } = useQuery<Admission[]>({
    queryKey: ['/api/admissions'],
    queryFn: async () => AdmissionsService.getAdmissions() as any,
    enabled: open,
  });
  const admissionForApp = useMemo(() => (admissions || []).find((a) => a.applicationId === currentApp?.id), [admissions, currentApp?.id]);

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    enabled: open,
  });
  const { data: regions = [] } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: async () => RegionsService.listRegions(),
    enabled: open,
    staleTime: 60_000,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: async () => BranchesService.listBranches(),
    enabled: open,
    staleTime: 60_000,
  });

  const subPartnerId = useMemo(() => {
    const candidates = [
      (currentApp as any)?.subPartner,
      (currentApp as any)?.sub_partner,
      (currentApp as any)?.subPartnerId,
      (currentApp as any)?.sub_partner_id,
      (student as any)?.subPartner,
      (student as any)?.sub_partner,
      (student as any)?.subPartnerId,
      (student as any)?.sub_partner_id,
    ];
    for (const candidate of candidates) {
      const value = String(candidate ?? '').trim();
      if (value) return value;
    }
    return '';
  }, [currentApp, student]);

  const subPartnerUser = useMemo(() => {
    if (!subPartnerId) return null;
    const list = Array.isArray(users) ? users : [];
    return (list as any[]).find((u: any) => String(u.id) === String(subPartnerId)) || null;
  }, [users, subPartnerId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Application>>({});
  const [currentStatus, setCurrentStatus] = useState<string>(currentApp?.appStatus || 'Open');
  const [isAddAdmissionOpen, setIsAddAdmissionOpen] = useState(false);

  useEffect(() => {
    if (currentApp) {
      setEditData({
        university: currentApp.university,
        program: currentApp.program,
        courseType: mapToOptionValue(currentApp.courseType || '', courseTypeOptions),
        country: mapToOptionValue(currentApp.country || '', countryOptions),
        intake: mapToOptionValue(currentApp.intake || '', intakeOptions),
        channelPartner: mapToOptionValue(currentApp.channelPartner || '', channelPartnerOptions) || currentApp.channelPartner,
        googleDriveLink: currentApp.googleDriveLink,
        caseStatus: mapToOptionValue(currentApp.caseStatus || '', caseStatusOptions),
      });
      setCurrentStatus(currentApp.appStatus || 'Open');
    }
  }, [currentApp]);

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
      if (!currentApp) return;
      return ApplicationsService.updateApplication(currentApp.id, { appStatus: newStatus });
    },
    onMutate: async (newStatus: string) => {
      await queryClient.cancelQueries({ queryKey: ['/api/applications'] });
      const prev = currentApp?.appStatus || '';
      setCurrentStatus(newStatus);
      setCurrentApp((c) => c ? { ...c, appStatus: newStatus } : c);
      return { previousStatus: prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previousStatus) {
        setCurrentStatus(context.previousStatus);
        setCurrentApp((c) => c ? { ...c, appStatus: context.previousStatus } : c);
      }
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    },
    onSuccess: async (updated: Application, _vars, context: any) => {
      try {
        const prev = context?.previousStatus ?? '';
        const curr = updated.appStatus ?? '';
        setCurrentStatus(curr);
        setCurrentApp((prevApp) => (prevApp ? { ...prevApp, appStatus: updated.appStatus } as Application : prevApp));
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        queryClient.refetchQueries({ queryKey: ['/api/applications'] });
        toast({ title: 'Status updated' });
      } catch (err) {
        console.error('Error handling application status success', err);
      }
    }
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async (data: Partial<Application>) => {
      if (!currentApp) return;
      return ApplicationsService.updateApplication(currentApp.id, data);
    },
    onMutate: async (data: Partial<Application>) => {
      const prev = currentApp ? { ...currentApp } : null;
      return { previousApp: prev };
    },
    onSuccess: async (updated: Application, _vars, context: any) => {
      try {
        const prevApp = context?.previousApp as Application | null;
        setCurrentApp((prev) => (prev ? { ...prev, ...updated } : updated));
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        setIsEditing(false);
        setCurrentStatus(updated.appStatus || 'Open');
        // If appStatus changed, server will log activity; just notify and refresh.
        toast({ title: 'Application updated' });
        try { setLocation(`/applications/${updated.id}`); } catch {}
      } catch (e) {
        console.error('Error in updateApplicationMutation onSuccess', e);
      }
    },
    onError: (e: any, _vars, context: any) => {
      toast({ title: 'Error', description: e.message || 'Failed to update application', variant: 'destructive' });
      if (context?.previousApp) setCurrentApp(context.previousApp);
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
      <div className="w-full bg-gray-100 rounded-md p-1.5">
        <div className="flex items-center justify-between relative">
          {statusSequence.map((status, index) => {
            const isCompleted = index <= (currentIndex < 0 ? 0 : currentIndex);
            const handleClick = () => {
              if (updateStatusMutation.isPending) return;
              if (!currentApp) return;
              if (status === currentStatus) return;
              updateStatusMutation.mutate(status);
            };

            return (
              <div key={status} className="flex-1 flex flex-col items-center relative cursor-pointer select-none" onClick={handleClick} role="button" aria-label={`Set status to ${status}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                  {isCompleted ? <div className="w-1.5 h-1.5 bg-white rounded-full" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                </div>
                <span className={`mt-1 text-xs font-medium text-center ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>{status}</span>
                {index < statusSequence.length - 1 && (
                  <div className={`absolute top-2.5 left-1/2 w-full h-0.5 -translate-y-1/2 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
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

  if (!currentApp) return null;

  return (
    <>
      <DetailsDialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title="Application Details"
        headerClassName="bg-[#223E7D] text-white"
        statusBarWrapperClassName="px-4 py-2 bg-[#223E7D] text-white -mt-px"
        statusBar={<StatusProgressBar />}
        rightWidth="420px"
        headerLeft={(
          <div className="text-base sm:text-lg font-semibold leading-tight truncate max-w-[60vw]">
            {currentApp.university || 'Application'}{currentApp.applicationCode ? ` (${currentApp.applicationCode})` : ''}
          </div>
        )}
        headerRight={(
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                {admissionForApp ? (
                  <Button
                    variant="outline"
                    size="xs"
                    className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                    onClick={() => { try { setLocation(`/admissions/${admissionForApp.id}`); } catch { try { window.location.hash = `#/admissions/${admissionForApp.id}`; } catch {} } }}
                    title="View Admission"
                  >
                    <ExternalLink />
                    <span>View Admission</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                    onClick={() => { onOpenChange(false); try { setLocation(`/applications/${currentApp?.id}/admission`); } catch {} }}
                    title="Add Admission"
                  >
                    <Plus />
                    <span>Add Admission</span>
                  </Button>
                )}
                {canEditApplication && (
                <Button
                  variant="outline"
                  size="xs"
                  className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                  onClick={() => { if (!canEditApplication) return; setIsEditing(true); try { setLocation(`/applications/${currentApp?.id}/edit`); } catch {} }}
                  title="Edit"
                >
                  <Edit />
                  <span>Edit</span>
                </Button>
                )}
              </>
            ) : (
              <>
                <Button size="xs" onClick={handleSave} disabled={!canEditApplication || updateApplicationMutation.isPending} title="Save Changes" className="bg-[#0071B0] hover:bg-[#00649D] text-white">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  <span>Save Changes</span>
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => { setIsEditing(false); setEditData({
                    university: currentApp.university,
                    program: currentApp.program,
                    courseType: currentApp.courseType,
                    country: currentApp.country,
                    intake: currentApp.intake,
                    channelPartner: currentApp.channelPartner,
                    googleDriveLink: currentApp.googleDriveLink,
                    caseStatus: currentApp.caseStatus || 'Raw',
                  }); try { setLocation(`/applications/${currentApp?.id}`); } catch {} }}
                  title="Cancel"
                  className="bg-white text-[#223E7D] hover:bg-white/90 border border-white"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  <span>Cancel</span>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 bg-white text-[#223E7D] hover:bg-white/90" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        leftContent={(
          <div className="flex gap-0 w-full">
            <div className="flex-1 flex flex-col space-y-4 min-w-0 w-full">
              <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center"><School className="w-5 h-5 mr-2" />Application Information</CardTitle>
                    <div className="flex items-center gap-3" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Student</span></Label>
                      {student ? (
                        <Button type="button" variant="link" className="h-8 p-0 text-xs" onClick={() => { openStudentProfile(student.id); }}>
                          {student.name}
                        </Button>
                      ) : (
                        <Input value={currentApp.studentId} disabled className="h-8 text-xs transition-all" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Case Status</span></Label>
                      {isEditing ? (
                        <Select value={(editData.caseStatus as string) || ''} onValueChange={(v) => setEditData({ ...editData, caseStatus: v })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Please select" />
                          </SelectTrigger>
                          <SelectContent>
                            {caseStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={currentApp.caseStatus || 'Raw'} disabled className="h-8 text-xs transition-all" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Application ID</span></Label>
                      <Input value={currentApp.applicationCode || 'Not provided'} disabled className="h-8 text-xs transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center"><BookOpen className="w-5 h-5 mr-2" />Program Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Country</span></Label>
                      <Input value={isEditing ? (editData.country || '') : (currentApp.country || '')} disabled className="h-8 text-xs transition-all" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><School className="w-4 h-4" /><span>University</span></Label>
                      <Input value={isEditing ? (editData.university || '') : (currentApp.university || '')} disabled className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Course Type</span></Label>
                      <Input value={isEditing ? (editData.courseType || '') : (currentApp.courseType || '')} disabled className="h-8 text-xs transition-all" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Program</span></Label>
                      <Input value={isEditing ? (editData.program || '') : (currentApp.program || '')} disabled className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>Intake</span></Label>
                      <Input value={isEditing ? (editData.intake || '') : (currentApp.intake || '')} disabled className="h-8 text-xs transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center"><ExternalLink className="w-5 h-5 mr-2" />Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Channel Partner</span></Label>
                      {isEditing ? (
                        <Select value={(editData.channelPartner as string) || ''} onValueChange={(v) => setEditData({ ...editData, channelPartner: v })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Please select" />
                          </SelectTrigger>
                          <SelectContent>
                            {channelPartnerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={currentApp.channelPartner || ''} disabled className="h-8 text-xs transition-all" />
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label className="flex items-center space-x-2"><ExternalLink className="w-4 h-4" /><span>Google Drive Link</span></Label>
                      {isEditing ? (
                        <Input value={editData.googleDriveLink || ''} onChange={(e) => setEditData({ ...editData, googleDriveLink: e.target.value })} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={async (e) => { e.preventDefault(); if (!currentApp.googleDriveLink) { toast({ title: 'No link', description: 'Google Drive link is not provided', variant: 'destructive' }); return; } const ok = await copyToClipboard(currentApp.googleDriveLink); toast({ title: ok ? 'Copied' : 'Copy failed', description: ok ? 'Google Drive link copied to clipboard' : 'Could not copy link', variant: ok ? undefined : 'destructive' }); }} disabled={!currentApp.googleDriveLink}>
                            <Copy className="w-4 h-4 mr-1" /> Copy
                          </Button>
                          <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); if (currentApp.googleDriveLink) window.open(currentApp.googleDriveLink, '_blank', 'noopener'); }} disabled={!currentApp.googleDriveLink}>
                            <ExternalLink className="w-4 h-4 mr-1" /> Open
                          </Button>
                          {!currentApp.googleDriveLink && (
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
                  <CardTitle className="flex items-center"><Users className="w-5 h-5 mr-2" />Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isPartnerRole ? (
                    (() => {
                      const pIdCandidates = [
                        (currentApp as any)?.partner,
                        (currentApp as any)?.partnerId,
                        (currentApp as any)?.partner_id,
                        (student as any)?.partner,
                        (student as any)?.partnerId,
                        (student as any)?.partner_id,
                        (authUser as any)?.id,
                      ];
                      let pId = '';
                      for (const c of pIdCandidates) { const v = String(c ?? '').trim(); if (v) { pId = v; break; } }
                      const partnerUser = pId ? (Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(pId)) : null) : null;
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Partner</span></Label>
                            <div className="text-xs px-2 py-1.5 rounded border bg-white">
                              {partnerUser ? (
                                <div>
                                  <div className="font-medium text-xs">{[partnerUser.firstName || (partnerUser as any).first_name, partnerUser.lastName || (partnerUser as any).last_name].filter(Boolean).join(' ').trim() || partnerUser.email || partnerUser.id}</div>
                                  {partnerUser.email ? <div className="text-[11px] text-muted-foreground">{partnerUser.email}</div> : null}
                                </div>
                              ) : (pId || '—')}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Sub partner</span></Label>
                            <div className="text-xs px-2 py-1.5 rounded border bg-white">
                              {subPartnerUser ? (
                                <div>
                                  <div className="font-medium text-xs">{[
                                    subPartnerUser.firstName || (subPartnerUser as any).first_name,
                                    subPartnerUser.lastName || (subPartnerUser as any).last_name,
                                  ].filter(Boolean).join(' ').trim() || subPartnerUser.email || subPartnerUser.id}</div>
                                  {subPartnerUser.email ? <div className="text-[11px] text-muted-foreground">{subPartnerUser.email}</div> : null}
                                </div>
                              ) : (subPartnerId || '—')}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Region</span></Label>
                        <div className="text-xs px-2 py-1.5 rounded border bg-white">
                          {(() => {
                            const rid = (currentApp as any)?.regionId || (student as any)?.regionId;
                            const r = Array.isArray(regions) ? (regions as any[]).find((x: any) => String(x.id) === String(rid)) : null;
                            if (!r) return '—';
                            const regionName = (r as any).regionName || (r as any).name || (r as any).id;
                            const head = Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String((r as any).regionHeadId || '')) : null;
                            const headName = head ? ([head.firstName || head.first_name, head.lastName || head.last_name].filter(Boolean).join(' ').trim() || head.email || head.id) : '';
                            const headEmail = head?.email || '';
                            return (
                              <div>
                                <div className="font-medium text-xs">{`${regionName}${headName ? ` - Head: ${headName}` : ''}`}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Branch</span></Label>
                        <div className="text-xs px-2 py-1.5 rounded border bg-white">
                          {(() => {
                            const bid = (currentApp as any)?.branchId || (student as any)?.branchId;
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
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Admission Officer</span></Label>
                        <div className="text-xs px-2 py-1.5 rounded border bg-white">
                          {(() => {
                            const officerId = (currentApp as any)?.admissionOfficerId || (student as any)?.admissionOfficerId || (student as any)?.admission_officer_id || '';
                            const officer = officerId && Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(officerId)) : null;
                            if (!officer) return '—';
                            const fullName = [officer.firstName || officer.first_name, officer.lastName || officer.last_name].filter(Boolean).join(' ').trim();
                            const email = officer.email || '';
                            return (
                              <div>
                                <div className="font-medium text-xs">{fullName || officer.id}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Counselor</span></Label>
                        <div className="text-xs px-2 py-1.5 rounded border bg-white">
                          {(() => {
                            const cid = (currentApp as any)?.counsellorId || (currentApp as any)?.counselorId || (student as any)?.counselorId || (student as any)?.counsellorId;
                            const c = cid && Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(cid)) : null;
                            if (!c) return '—';
                            const fullName = [c.firstName || c.first_name, c.lastName || c.last_name].filter(Boolean).join(' ').trim();
                            const email = c.email || '';
                            return (
                              <div>
                                <div className="font-medium text-xs">{fullName || c.id}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        )}
        rightContent={(
          <div className="pt-1 min-h-0 flex-1 overflow-y-auto">
            <ActivityTracker entityType="application" entityId={currentApp.id} initialInfoDate={currentApp.createdAt as any} />
          </div>
        )}
      />

      <AddAdmissionModal
        open={isAddAdmissionOpen}
        onOpenChange={setIsAddAdmissionOpen}
        applicationId={currentApp?.id as any}
        studentId={currentApp?.studentId}
      />

      <StudentProfileModal open={isStudentProfileOpen} onOpenChange={setIsStudentProfileOpen} studentId={selectedStudentId} />
    </>
  );
}
