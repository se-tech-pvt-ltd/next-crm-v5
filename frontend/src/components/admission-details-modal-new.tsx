import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
console.log('[modal] loaded: frontend/src/components/admission-details-modal-new.tsx');
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTracker } from "./activity-tracker";
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Award, X } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Admission } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as AdmissionsService from "@/services/admissions";
import * as ApplicationsService from "@/services/applications";
import * as DropdownsService from '@/services/dropdowns';
import * as UsersService from '@/services/users';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useMemo } from "react";
import { useLocation } from 'wouter';

interface AdmissionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission: Admission | null;
}

export function AdmissionDetailsModal({ open, onOpenChange, admission }: AdmissionDetailsModalProps) {
  const [, setLocation] = useLocation();

  const { data: admissionDropdowns } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/dropdowns/module/Admissions'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Admissions'),
    enabled: !!admission,
    staleTime: 5 * 60 * 1000,
  });

  const statusSequence = useMemo(() => {
    const list: any[] = (admissionDropdowns as any)?.Status || (admissionDropdowns as any)?.status || [];
    if (!Array.isArray(list) || list.length === 0) return ['not_applied','applied','interview_scheduled','approved','rejected','on_hold'];
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

  const [currentStatus, setCurrentStatus] = useState<string>(admission?.status || (statusSequence.length>0?statusSequence[0]:'not_applied'));
  const [caseStatus, setCaseStatus] = useState<string>(admission?.caseStatus || '');

  useEffect(() => {
    setCurrentStatus(admission?.status || (statusSequence.length>0?statusSequence[0]:'not_applied'));
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admissions/${admission?.id}`] });
    },
  });

  const updateCaseStatusMutation = useMutation({
    mutationFn: async (newCaseStatus: string) => {
      if (!admission) return;
      return AdmissionsService.updateAdmission(admission.id, { caseStatus: newCaseStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admissions/${admission?.id}`] });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  const handleCaseStatusChange = (newCase: string) => {
    setCaseStatus(newCase);
    updateCaseStatusMutation.mutate(newCase);
  };

  if (!admission) return null;

  const headerLeft = (
    <div className="text-base sm:text-lg font-semibold leading-tight truncate max-w-[60vw]">{student?.name || `Admission ${admission.admissionId || admission.id}`}</div>
  );

  const headerRight = (
    <div className="flex items-center gap-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>University</Label>
                  <p className="text-xs font-semibold">{admission.university || 'Not specified'}</p>
                </div>
                <div>
                  <Label>Program</Label>
                  <p className="text-xs font-semibold">{admission.program || 'Not specified'}</p>
                </div>
                <div>
                  <Label>Initial Deposit</Label>
                  <p className="text-xs">{admission.initialDeposit ?? admission.depositAmount ?? 'Not specified'}</p>
                </div>
                <div>
                  <Label>Full Tuition Fee</Label>
                  <p className="text-xs">{admission.fullTuitionFee || 'Not specified'}</p>
                </div>
                <div>
                  <Label>Net Tuition Fee</Label>
                  <p className="text-xs">{admission.netTuitionFee || 'Not specified'}</p>
                </div>
                <div>
                  <Label>Scholarship Amount</Label>
                  <p className="text-xs">{admission.scholarshipAmount || 'Not specified'}</p>
                </div>
                <div>
                  <Label>Deposit Date</Label>
                  <p className="text-xs">{admission.depositDate ? formatDateOrdinal(admission.depositDate) : 'Not specified'}</p>
                </div>
                <div>
                  <Label>Visa Date</Label>
                  <p className="text-xs">{admission.visaDate ? formatDateOrdinal(admission.visaDate) : 'Not specified'}</p>
                </div>
                <div>
                  <Label>Case Status</Label>
                  <div className="mt-1">
                    <Select value={caseStatus || ''} onValueChange={handleCaseStatusChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select case status" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCaseStatusOptions().length > 0 ? getCaseStatusOptions().map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>) : (
                          <SelectItem key="__none__" value="">{admission.caseStatus || 'Not specified'}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
        <>
          <div className="sticky top-0 z-10 px-4 py-3 border-b bg-white">
            <h3 className="text-sm font-semibold">Activity Timeline</h3>
          </div>
          <div className="flex-1 overflow-y-auto pt-1 min-h-0">
            <ActivityTracker
              entityType="admission"
              entityId={admission.id}
              entityName={admission.program}
            />
          </div>
        </>
      )}
    />
  );
}
