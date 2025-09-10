import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivityTracker } from '@/components/activity-tracker';
import * as ApplicationsService from '@/services/applications';
import * as StudentsService from '@/services/students';
import * as AdmissionsService from '@/services/admissions';
import * as DropdownsService from '@/services/dropdowns';
import { useToast } from '@/hooks/use-toast';
import { type Application, type Student, type Admission } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
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
  Plus
} from 'lucide-react';

interface ApplicationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
}

export function ApplicationDetailsModal({ open, onOpenChange, application }: ApplicationDetailsModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentApp, setCurrentApp] = useState<Application | null>(application || null);
  useEffect(() => {
    setCurrentApp(application || null);
  }, [application]);

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
    queryKey: currentApp?.studentId ? ['/api/students', currentApp.studentId] : ['noop'],
    queryFn: async () => StudentsService.getStudent(currentApp?.studentId),
    enabled: !!currentApp?.studentId,
  });

  const { data: admissions } = useQuery<Admission[]>({
    queryKey: ['/api/admissions'],
    queryFn: async () => AdmissionsService.getAdmissions() as any,
  });
  const admissionForApp = useMemo(() => (admissions || []).find((a) => a.applicationId === currentApp?.id), [admissions, currentApp?.id]);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Application>>({});
  const [currentStatus, setCurrentStatus] = useState<string>(currentApp?.appStatus || 'Open');

  useEffect(() => {
    if (currentApp) {
      setEditData({
        university: currentApp.university,
        program: currentApp.program,
        courseType: currentApp.courseType,
        country: currentApp.country,
        intake: currentApp.intake,
        channelPartner: currentApp.channelPartner,
        googleDriveLink: currentApp.googleDriveLink,
        caseStatus: currentApp.caseStatus || '',
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
    onSuccess: (updated: Application) => {
      setCurrentStatus(updated.appStatus || 'Open');
      setCurrentApp((prev) => (prev ? { ...prev, appStatus: updated.appStatus } as Application : prev));
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.refetchQueries({ queryKey: ['/api/applications'] });
      toast({ title: 'Status updated' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async (data: Partial<Application>) => {
      if (!currentApp) return;
      return ApplicationsService.updateApplication(currentApp.id, data);
    },
    onSuccess: (updated: Application) => {
      setCurrentApp((prev) => (prev ? { ...prev, ...updated } : updated));
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
              if (!currentApp) return;
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

  if (!currentApp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <DialogTitle className="sr-only">Application Details</DialogTitle>

        <div className="grid grid-cols-[1fr_30rem] h-[90vh] min-h-0">
          <div className="flex flex-col min-h-0">
            <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <School className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-semibold truncate">Application Details</h1>
                    <p className="text-xs text-gray-600 truncate">View and edit application details</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={() => onOpenChange(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="px-4 pb-3">
                <StatusProgressBar />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex gap-0 w-full">
                <div className="flex-1 flex flex-col space-y-4 min-w-0 w-full">
                  <Card className="w-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center"><School className="w-5 h-5 mr-2" />Application Information</CardTitle>
                        <div className="flex items-center gap-3">
                          {admissionForApp ? (
                            <Button variant="outline" size="sm" className="rounded-full px-2 md:px-3 [&_svg]:size-5" onClick={() => setLocation(`/admissions/${admissionForApp.id}`)} title="View Admission">
                              <ExternalLink />
                              <span className="hidden lg:inline">View Admission</span>
                            </Button>
                          ) : !isEditing ? (
                            <>
                              <Button variant="outline" size="sm" className="rounded-full px-2 md:px-3 [&_svg]:size-5" onClick={() => { const from = typeof window!== 'undefined' ? window.location.pathname : '/applications'; setLocation(`/admissions/new?applicationId=${currentApp.id}&studentId=${currentApp.studentId}&from=${encodeURIComponent(from)}`); }} title="Add Admission">
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
                               university: currentApp.university,
                               program: currentApp.program,
                               courseType: currentApp.courseType,
                               country: currentApp.country,
                               intake: currentApp.intake,
                               channelPartner: currentApp.channelPartner,
                               googleDriveLink: currentApp.googleDriveLink,
                               caseStatus: currentApp.caseStatus || 'Raw',
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
                            <Input value={currentApp.studentId} disabled className="h-8 text-xs transition-all" />
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

                  <Card className="w-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center"><BookOpen className="w-5 h-5 mr-2" />Program Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2"><School className="w-4 h-4" /><span>University</span></Label>
                          <Input value={isEditing ? (editData.university || '') : (currentApp.university || '')} onChange={(e) => setEditData({ ...editData, university: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Program</span></Label>
                          <Input value={isEditing ? (editData.program || '') : (currentApp.program || '')} onChange={(e) => setEditData({ ...editData, program: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Course Type</span></Label>
                          <Input value={isEditing ? (editData.courseType || '') : (currentApp.courseType || '')} onChange={(e) => setEditData({ ...editData, courseType: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Country</span></Label>
                          <Input value={isEditing ? (editData.country || '') : (currentApp.country || '')} onChange={(e) => setEditData({ ...editData, country: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>Intake</span></Label>
                          <Input value={isEditing ? (editData.intake || '') : (currentApp.intake || '')} onChange={(e) => setEditData({ ...editData, intake: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
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
                          <Input value={isEditing ? (editData.channelPartner || '') : (currentApp.channelPartner || '')} onChange={(e) => setEditData({ ...editData, channelPartner: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
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
                </div>
              </div>
            </div>
          </div>

          <div className="w-[30rem] flex-shrink-0 bg-white rounded-l-lg border-l p-3 flex flex-col min-h-0">
            <div className="sticky top-0 z-10 px-1 pb-2 bg-white">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <h2 className="text-sm font-semibold">Activity Timeline</h2>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ActivityTracker
                entityType="application"
                entityId={currentApp.id}
                initialInfoDate={currentApp.createdAt as any}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
