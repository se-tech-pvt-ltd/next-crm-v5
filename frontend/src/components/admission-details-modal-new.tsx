import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
console.log('[modal] loaded: frontend/src/components/admission-details-modal-new.tsx');
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTracker } from "./activity-tracker";
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Award, X } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Admission } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as AdmissionsService from "@/services/admissions";
import * as ApplicationsService from "@/services/applications";
import * as DropdownsService from '@/services/dropdowns';
import * as ActivitiesService from '@/services/activities';
import * as UsersService from '@/services/users';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AdmissionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission: Admission | null;
}

export function AdmissionDetailsModal({ open, onOpenChange, admission }: AdmissionDetailsModalProps) {
  const [, setLocation] = useLocation();
  const [matchEdit] = useRoute('/admissions/:id/edit');

  const { accessByRole } = useAuth() as any;
  const normalizeModule = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const singularize = (s: string) => String(s || '').replace(/s$/i, '');
  const canEditAdmission = useMemo(() => {
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalizeModule(a.moduleName ?? a.module_name)) === 'admission');
    if (entries.length === 0) return true;
    return entries.some((e: any) => (e.canEdit ?? e.can_edit) === true || (e.canUpdate ?? e.can_update) === true || (e.edit ?? e.update) === true || e.canEdit === 1 || e.can_update === 1);
  }, [accessByRole]);

  const isEdit = !!(matchEdit && canEditAdmission);

  useEffect(() => {
    if (matchEdit && !canEditAdmission && admission?.id) {
      try { setLocation(`/admissions/${admission.id}`); } catch {}
    }
  }, [matchEdit, canEditAdmission, admission?.id, setLocation]);

  const { data: admissionDropdowns } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/dropdowns/module/Admissions'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Admissions'),
    enabled: !!admission,
    staleTime: 5 * 60 * 1000,
  });

  const statusSequence = useMemo(() => {
    const list: any[] = (admissionDropdowns as any)?.Status || (admissionDropdowns as any)?.status || [];
    if (!Array.isArray(list)) return [];
    return list.map((o: any) => (o.key || o.id || o.value)).filter(Boolean);
  }, [admissionDropdowns]);

  const getStatusDisplayName = (statusId: string) => {
    const list: any[] = (admissionDropdowns as any)?.Status || (admissionDropdowns as any)?.status || [];
    const byId = list.find((o: any) => o.id === statusId || o.key === statusId || o.value === statusId);
    if (byId && byId.value) return byId.value;
    return statusId;
  };

  const AdmissionStatusBar = ({ currentStatus, onChange }: { currentStatus: string; onChange: (s: string) => void }) => {
    const idx = statusSequence.findIndex((s) => s === currentStatus);
    return (
      <div className="w-full bg-gray-100 rounded-md p-1.5">
        <div className="flex items-center justify-between relative">
          {statusSequence.map((s, i) => {
            const isCompleted = i <= idx && idx !== -1;
            const label = getStatusDisplayName(s);
            return (
              <div key={s} className="flex-1 flex flex-col items-center relative cursor-pointer select-none" onClick={() => onChange(s)}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-white' : 'bg-gray-300'}`} />
                </div>
                <span className={`mt-1 text-[10px] font-medium ${isCompleted ? 'text-blue-600' : 'text-gray-600'}`}>{label}</span>
                {i < statusSequence.length - 1 && (
                  <div className={`absolute top-2.5 left-1/2 w-full h-0.5 -translate-y-1/2 ${i < idx ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const [currentStatus, setCurrentStatus] = useState<string>(admission?.status || '');
  const [caseStatus, setCaseStatus] = useState<string>(admission?.caseStatus || '');

  useEffect(() => {
    setCurrentStatus(admission?.status || '');
    setCaseStatus(admission?.caseStatus || '');
  }, [admission, statusSequence]);

  const queryClient = useQueryClient();

  const { data: student } = useQuery({
    queryKey: [`/api/students/${admission?.studentId}`],
    enabled: !!admission?.studentId,
  });

  const { data: application } = useQuery({
    queryKey: [`/api/applications/${admission?.applicationId}`],
    queryFn: async () => ApplicationsService.getApplication(admission?.applicationId as string),
    enabled: !!admission?.applicationId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    enabled: !!admission,
  });
  const { data: regions = [] } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: async () => RegionsService.listRegions(),
    enabled: !!admission,
    staleTime: 60_000,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: async () => BranchesService.listBranches(),
    enabled: !!admission,
    staleTime: 60_000,
  });

  const getCaseStatusOptions = () => {
    const dd = admissionDropdowns || {};
    let list: any[] = dd?.['Case Status'] || dd?.caseStatus || dd?.CaseStatus || dd?.case_status || [];
    if (!Array.isArray(list)) list = [];
    return list.map(o => ({ label: o.value, value: o.id ?? o.key ?? o.value }));
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!admission) return;
      return AdmissionsService.updateAdmission(admission.id, { status: newStatus });
    },
    onMutate: async (newStatus: string) => {
      const prev = admission?.status ?? '';
      setCurrentStatus(newStatus);
      return { previousStatus: prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previousStatus) setCurrentStatus(context.previousStatus);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    },
    onSuccess: async (updatedAdmission: any, _vars, context: any) => {
      try {
        // Update list cache if present
        queryClient.setQueryData(['/api/admissions'], (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) return old.map((a: any) => (a.id === updatedAdmission.id ? updatedAdmission : a));
          if (old.data && Array.isArray(old.data)) return { ...old, data: old.data.map((a: any) => (a.id === updatedAdmission.id ? updatedAdmission : a)) };
          return old;
        });

        // Update single admission cache
        queryClient.setQueryData([`/api/admissions/${updatedAdmission.id}`], updatedAdmission);
      } catch (e) {
        console.warn('[AdmissionDetailsModal] cache update failed', e);
      }

      // Still invalidate to ensure fresh server data if needed
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admissions/${admission?.id}`] });
      // Refresh activity timeline for this admission
      queryClient.invalidateQueries({ queryKey: [`/api/activities/admission/${admission?.id}`] });

      // Log activity attributing the status change to the current user
      try {
        const prev = context?.previousStatus ?? '';
        const curr = updatedAdmission?.status ?? '';
        const content = `status changed from \"${prev}\" to \"${curr}\"`;
        await ActivitiesService.createActivity({ entityType: 'admission', entityId: String(updatedAdmission.id), content, activityType: 'status_changed' });
      } catch (err) {
        console.warn('Failed to log admission status change', err);
      }

      toast({ title: 'Status updated' });
    },
  });

  const updateCaseStatusMutation = useMutation({
    mutationFn: async (newCaseStatus: string) => {
      if (!admission) return;
      return AdmissionsService.updateAdmission(admission.id, { caseStatus: newCaseStatus });
    },
    onSuccess: (updatedAdmission: any) => {
      try {
        queryClient.setQueryData(['/api/admissions'], (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) return old.map((a: any) => (a.id === updatedAdmission.id ? updatedAdmission : a));
          if (old.data && Array.isArray(old.data)) return { ...old, data: old.data.map((a: any) => (a.id === updatedAdmission.id ? updatedAdmission : a)) };
          return old;
        });
        queryClient.setQueryData([`/api/admissions/${updatedAdmission.id}`], updatedAdmission);
      } catch (e) {
        console.warn('[AdmissionDetailsModal] cache update failed', e);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admissions/${admission?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/admission/${admission?.id}`] });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (!canEditAdmission) {
      toast({ title: 'You do not have permission to edit admissions', variant: 'destructive' });
      return;
    }
    setCurrentStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  // keep local editable inputs for dates
  const [depositDateInput, setDepositDateInput] = useState<string>('');
  const [visaDateInput, setVisaDateInput] = useState<string>('');

  useEffect(() => {
    // initialize date inputs in yyyy-mm-dd format for native date inputs
    const toISODate = (d: any) => {
      if (!d) return '';
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      return dt.toISOString().slice(0, 10);
    };
    setDepositDateInput(toISODate(admission?.depositDate));
    setVisaDateInput(toISODate(admission?.visaDate));
  }, [admission]);

  // In edit mode, don't auto-save caseStatus. Just set local state.
  const handleCaseStatusChange = (newCase: string) => {
    setCaseStatus(newCase);
  };

  const updateAdmissionMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!admission) return;
      return AdmissionsService.updateAdmission(admission.id, payload);
    },
    onMutate: async (payload: any) => {
      const prev = admission ? { ...admission } : null;
      return { previousAdmission: prev };
    },
    onSuccess: async (updatedAdmission: any, _vars, context: any) => {
      try {
        try {
          queryClient.setQueryData(['/api/admissions'], (old: any) => {
            if (!old) return old;
            if (Array.isArray(old)) return old.map((a: any) => (a.id === updatedAdmission.id ? updatedAdmission : a));
            if (old.data && Array.isArray(old.data)) return { ...old, data: old.data.map((a: any) => (a.id === updatedAdmission.id ? updatedAdmission : a)) };
            return old;
          });
          queryClient.setQueryData([`/api/admissions/${updatedAdmission.id}`], updatedAdmission);
        } catch (e) {
          console.warn('[AdmissionDetailsModal] cache update failed', e);
        }
        queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
        queryClient.invalidateQueries({ queryKey: [`/api/admissions/${admission?.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/activities/admission/${admission?.id}`] });
        // Log activity if status changed
        try {
          const prev = (context?.previousAdmission as any)?.status ?? '';
          const curr = updatedAdmission?.status ?? '';
          if (prev !== curr) {
            const content = `status changed from \"${prev}\" to \"${curr}\"`;
            await ActivitiesService.createActivity({ entityType: 'admission', entityId: String(updatedAdmission.id), content, activityType: 'status_changed' });
          }
        } catch (err) {
          console.warn('Failed to log admission status change on update', err);
        }
      } catch (e) {
        console.error('Error in updateAdmissionMutation onSuccess', e);
      }
    },
  });

  if (!admission) return null;

  const headerLeft = (
    <div className="text-base sm:text-lg font-semibold leading-tight truncate max-w-[60vw]">{student?.name || `Admission ${admission.admissionId || admission.id}`}</div>
  );

  const headerRight = isEdit ? (
    <div className="flex items-center gap-2">
      <Button
        size="xs"
        className="px-3 [&_svg]:size-3 bg-[#0071B0] hover:bg-[#00649D] text-white"
        onClick={() => {
          // Save changes
          const payload: any = {};
          payload.depositDate = depositDateInput || null;
          payload.visaDate = visaDateInput || null;
          payload.caseStatus = caseStatus || null;
          updateAdmissionMutation.mutate(payload, {
            onSuccess: () => {
              try { setLocation(`/admissions/${admission.id}`); } catch {}
            }
          });
        }}
        title="Save Changes"
      >
        Save
      </Button>

      <Button
        variant="outline"
        size="xs"
        className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
        onClick={() => {
          // Cancel edit: navigate back to view and reset local inputs
          try { setLocation(`/admissions/${admission.id}`); } catch {}
          setDepositDateInput(admission.depositDate ? new Date(admission.depositDate).toISOString().slice(0,10) : '');
          setVisaDateInput(admission.visaDate ? new Date(admission.visaDate).toISOString().slice(0,10) : '');
          setCaseStatus(admission.caseStatus || '');
        }}
        title="Cancel Edit"
      >
        Cancel
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 rounded-full bg-white text-black hover:bg-gray-100 border border-gray-300"
        onClick={() => onOpenChange(false)}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      {canEditAdmission && (
        <Button
          variant="outline"
          size="xs"
          className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
          onClick={() => {
            try { setLocation(`/admissions/${admission.id}/edit`); } catch { }
          }}
          title="Edit Admission"
        >
          Edit
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 rounded-full bg-white text-black hover:bg-gray-100 border border-gray-300"
        onClick={() => onOpenChange(false)}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );

  const formatDateOrdinal = (d: any) => {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    const day = date.getDate();
    const j = day % 10;
    const k = day % 100;
    const suffix = (k >= 11 && k <= 13) ? 'th' : (j === 1 ? 'st' : j === 2 ? 'nd' : j === 3 ? 'rd' : 'th');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day}${suffix} ${month}, ${year}`;
  };

  const caseStatusLabel = (() => { const opt = getCaseStatusOptions().find(o => o.value === caseStatus); return opt?.label || (admission as any)?.caseStatus || ''; })();

  return (
    <DetailsDialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Admission Details"
      headerClassName="bg-[#223E7D] text-white"
      statusBarWrapperClassName="px-4 py-2 bg-[#223E7D] text-white -mt-px"
      headerLeft={headerLeft}
      headerRight={headerRight}
      statusBar={<AdmissionStatusBar currentStatus={currentStatus} onChange={handleStatusChange} />}
      rightWidth="360px"
      leftContent={(
        <>
          <div className="px-2 pb-1" />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Linked Entities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Student</Label>
                  <div className="mt-[-3px]">
                    <Button type="button" variant="link" className="p-0 h-6 text-xs mt-[-2px]" onClick={() => {
                      onOpenChange(false);
                      setTimeout(() => {
                        try { setLocation(`/students/${admission.studentId}`); }
                        catch { try { window.location.hash = `#/students/${admission.studentId}`; } catch {} }
                      }, 160);
                    }}>
                      {student ? student.name : admission.studentId}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Application Code</Label>
                  <div className="mt-[-2px]">
                    <Button type="button" variant="link" className="p-0 h-6 text-xs font-mono mt-[-1px]" onClick={() => {
                      onOpenChange(false);
                      setTimeout(() => {
                        try { setLocation(`/applications/${admission.applicationId}`); }
                        catch { try { window.location.hash = `#/applications/${admission.applicationId}`; } catch {} }
                      }, 160);
                    }}>
                      {application?.applicationCode || admission.applicationId}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Admission ID</Label>
                  <p className="text-xs font-mono mt-1">{admission.admissionId || admission.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Admission Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Deposit Date</Label>
                  <div className="mt-1">
                    {isEdit ? (
                      <Input type="date" value={depositDateInput} onChange={(e) => setDepositDateInput((e.target as HTMLInputElement).value)} className="text-xs" />
                    ) : (
                      <Input value={admission.depositDate ? formatDateOrdinal(admission.depositDate) : ''} placeholder="Not specified" disabled readOnly className="text-xs" />
                    )}
                  </div>
                </div>

                <div>
                  <Label>Visa Date</Label>
                  <div className="mt-1">
                    {isEdit ? (
                      <Input type="date" value={visaDateInput} onChange={(e) => setVisaDateInput((e.target as HTMLInputElement).value)} className="text-xs" />
                    ) : (
                      <Input value={admission.visaDate ? formatDateOrdinal(admission.visaDate) : ''} placeholder="Not specified" disabled readOnly className="text-xs" />
                    )}
                  </div>
                </div>

                <div>
                  <Label>Case Status</Label>
                  <div className="mt-1">
                    {isEdit ? (
                      <Select value={caseStatus || ''} onValueChange={handleCaseStatusChange}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select case status" />
                        </SelectTrigger>
                        <SelectContent>
                          {getCaseStatusOptions().length > 0 ? getCaseStatusOptions().map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>) : (
                            <SelectItem key="__none__" value="__none__" disabled>{admission.caseStatus || 'Not specified'}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={caseStatusLabel ?? ''} placeholder="Not specified" disabled readOnly className="text-xs" />
                    )}
                  </div>
                </div>

                <div>
                  <Label>University</Label>
                  <div className="mt-1">
                    <Input value={admission.university ?? ''} placeholder="Not specified" disabled readOnly className="text-xs" />
                  </div>
                </div>
                <div>
                  <Label>Program</Label>
                  <div className="mt-1">
                    <Input value={admission.program ?? ''} placeholder="Not specified" disabled readOnly className="text-xs" />
                  </div>
                </div>
                <div>
                  <Label>Net Tuition Fee</Label>
                  <div className="mt-1">
                    <Input value={String(admission.netTuitionFee ?? '')} placeholder="Not specified" disabled readOnly className="text-xs" />
                  </div>
                </div>

                <div>
                  <Label>Initial Deposit</Label>
                  <div className="mt-1">
                    <Input value={String(admission.initialDeposit ?? admission.depositAmount ?? '')} placeholder="Not specified" disabled readOnly className="text-xs" />
                  </div>
                </div>
                <div>
                  <Label>Full Tuition Fee</Label>
                  <div className="mt-1">
                    <Input value={String(admission.fullTuitionFee ?? '')} placeholder="Not specified" disabled readOnly className="text-xs" />
                  </div>
                </div>
                <div>
                  <Label>Scholarship Amount</Label>
                  <div className="mt-1">
                    <Input value={String(admission.scholarshipAmount ?? '')} placeholder="Not specified" disabled readOnly className="text-xs" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="flex items-center space-x-2"><span>Region</span></Label>
                  <div className="text-xs px-2 py-1.5 rounded border bg-white">
                    {(() => {
                      const rid = (admission as any)?.regionId || (student as any)?.regionId;
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
                  <Label className="flex items-center space-x-2"><span>Branch</span></Label>
                  <div className="text-xs px-2 py-1.5 rounded border bg-white">
                    {(() => {
                      const bid = (admission as any)?.branchId || (student as any)?.branchId;
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
                  <Label className="flex items-center space-x-2"><span>Admission Officer</span></Label>
                  <div className="text-xs px-2 py-1.5 rounded border bg-white">
                    {(() => {
                      const officerId = (admission as any)?.admissionOfficerId || (student as any)?.admissionOfficerId || (student as any)?.admission_officer_id || '';
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
                  <Label className="flex items-center space-x-2"><span>Counselor</span></Label>
                  <div className="text-xs px-2 py-1.5 rounded border bg-white">
                    {(() => {
                      const cid = (admission as any)?.counsellorId || (admission as any)?.counselorId || (student as any)?.counselorId || (student as any)?.counsellorId;
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
        </>
      )}
      rightContent={(
        <div className="flex-1 overflow-y-auto pt-1 min-h-0">
          <ActivityTracker
            entityType="admission"
            entityId={admission.id}
            entityName={admission.program}
          />
        </div>
      )}
    />
  );
}
