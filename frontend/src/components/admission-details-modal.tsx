import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
console.log('[modal] loaded: frontend/src/components/admission-details-modal.tsx');
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityTracker } from "./activity-tracker";
import { Award, X, ExternalLink } from "lucide-react";
import { Admission, Student } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as AdmissionsService from "@/services/admissions";
import * as DropdownsService from '@/services/dropdowns';
import * as UsersService from '@/services/users';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import { useState, useEffect, useMemo } from "react";
import { useToast } from '@/hooks/use-toast';

interface AdmissionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission: Admission | null;
  onOpenStudentProfile?: (studentId: string) => void;
}

export function AdmissionDetailsModal({ open, onOpenChange, admission, onOpenStudentProfile }: AdmissionDetailsModalProps) {
  const [currentStatus, setCurrentStatus] = useState<string>(admission?.status || 'not_applied');
  const [caseStatus, setCaseStatus] = useState<string>(admission?.caseStatus || '');

  const queryClient = useQueryClient();

  const { data: student } = useQuery({
    queryKey: [`/api/students/${admission?.studentId}`],
    enabled: !!admission?.studentId,
  });

  const { data: admissionDropdowns } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/dropdowns/module/Admissions'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Admissions'),
    enabled: !!admission,
    staleTime: 5 * 60 * 1000,
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

  useEffect(() => {
    setCurrentStatus(admission?.status || 'not_applied');
    setCaseStatus(admission?.caseStatus || '');
  }, [admission]);

  const statusSequence = useMemo<string[]>(() => {
    const list: any[] = (admissionDropdowns as any)?.Status || (admissionDropdowns as any)?.status || [];
    if (!Array.isArray(list) || list.length === 0) return ['not_applied','applied','interview_scheduled','approved','on_hold','rejected'];
    return list.map((o: any) => o.key || o.id || o.value).filter(Boolean);
  }, [admissionDropdowns]);

  const getStatusDisplayName = (statusId: string) => {
    const list: any[] = (admissionDropdowns as any)?.Status || (admissionDropdowns as any)?.status || [];
    const byId = list.find((o: any) => o.id === statusId || o.key === statusId || o.value === statusId);
    if (byId?.value) return byId.value;
    return statusId;
  };

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

  if (!admission) return null;

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

  const getCaseStatusOptions = () => {
    const dd = admissionDropdowns || {};
    let list: any[] = dd?.['Case Status'] || dd?.caseStatus || dd?.CaseStatus || dd?.case_status || [];
    if (!Array.isArray(list)) list = [];
    return list.map(o => ({ label: o.value, value: o.id ?? o.key ?? o.value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <DialogTitle className="sr-only">Admission Details</DialogTitle>

        <div className="grid grid-cols-[1fr_360px] h-[90vh] min-h-0">
          {/* Left: Content */}
          <div className="flex flex-col min-h-0">
            {/* Sticky header inside scroll context */}
            <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 max-[991px]:w-[100%] max-[991px]:mx-0 lg:mx-0 lg:w-auto">
              <div className="w-full">
                <div className="w-full max-[991px]:w-[60%] max-[991px]:mx-auto">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-lg font-semibold truncate">{admission.program}</h1>
                        <p className="text-xs text-gray-600 truncate">Admission Decision</p>
                      </div>
                    </div>

                    <div className="hidden md:block">
                      <label htmlFor="header-status" className="text-[11px] text-gray-500">Status</label>
                      <Select value={currentStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="h-8 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusSequence.length === 0 ? (
                            <>
                              <SelectItem value="not_applied">Not Applied</SelectItem>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </>
                          ) : (
                            statusSequence.map(s => <SelectItem key={s} value={s}>{getStatusDisplayName(s)}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      {student && (
                        <Button variant="default" size="xs" className="rounded-full px-2 [&_svg]:size-3 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onOpenStudentProfile?.(student.id)} title="View Student">
                          <ExternalLink />
                          <span className="hidden lg:inline">View Student</span>
                        </Button>
                      )}

                    <div className="px-4 pb-3">...