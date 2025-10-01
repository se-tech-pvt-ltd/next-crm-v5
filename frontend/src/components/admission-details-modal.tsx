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
import { useState, useEffect } from "react";
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

  useEffect(() => {
    setCurrentStatus(admission?.status || 'not_applied');
    setCaseStatus(admission?.caseStatus || '');
  }, [admission]);

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
                          {/* If dropdown config exists, try to render options; otherwise fall back to common statuses */}
                          {getCaseStatusOptions().length === 0 ? (
                            <>
                              <SelectItem value="not_applied">Not Applied</SelectItem>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                            </>
                          ) : (
                            // reuse caseStatus options as a simple fallback for status options when configured
                            getCaseStatusOptions().map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)
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

                      <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={() => onOpenChange(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="px-4 pb-3">
                    <div className="w-full bg-gray-100 rounded-md p-1.5">
                      <div className="flex items-center justify-between relative">
                        {['not_applied','applied','interview_scheduled','approved','on_hold','rejected'].map((s, index, arr) => {
                          const currentIndex = arr.indexOf(currentStatus || '');
                          const isCompleted = currentIndex >= 0 && index <= currentIndex;
                          const label = s.charAt(0).toUpperCase() + s.slice(1).replace('_',' ');
                          const handleClick = () => {
                            if (s === currentStatus) return;
                            handleStatusChange(s);
                          };
                          return (
                            <div key={s} className="flex flex-col items-center relative flex-1 cursor-pointer select-none" onClick={handleClick} role="button" aria-label={`Set status to ${label}`}>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'}`}>
                                {isCompleted ? <div className="w-1.5 h-1.5 bg-white rounded-full" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                              </div>
                              <span className={`mt-1 text-[11px] font-medium text-center ${isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>{label}</span>
                              {index < arr.length - 1 && (
                                <div className={`absolute top-2.5 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable body: simplified Admission Information only */}
            <div className="flex-1 overflow-y-auto p-6 pt-28">
              <div className="space-y-6">
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
                        <label className="text-sm font-medium text-gray-600">University</label>
                        <p className="text-lg font-semibold">{admission.university || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Program</label>
                        <p className="text-lg font-semibold">{admission.program || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Initial Deposit</label>
                        <p>{admission.initialDeposit ?? admission.depositAmount ?? 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Tuition Fee</label>
                        <p>{admission.fullTuitionFee || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Net Tuition Fee</label>
                        <p>{admission.netTuitionFee || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Scholarship Amount</label>
                        <p>{admission.scholarshipAmount || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Deposit Date</label>
                        <p>{admission.depositDate ? formatDateOrdinal(admission.depositDate) : 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Visa Date</label>
                        <p>{admission.visaDate ? formatDateOrdinal(admission.visaDate) : 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <p>{(admission.status || '').toString() || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Case Status</label>
                        <div className="mt-1">
                          <Select value={caseStatus || ''} onValueChange={handleCaseStatusChange}>
                            <SelectTrigger className="h-8 text-xs shadow-sm border border-gray-300 bg-white"><SelectValue placeholder="Select case status" /></SelectTrigger>
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
              </div>
            </div>
          </div>

          {/* Right Sidebar - Activity Timeline */}
          <div className="w-[420px] border-l bg-white flex flex-col min-h-0 pt-5 lg:pt-0 max-[991px]:pt-5">
            <div className="sticky top-0 z-10 px-4 py-3 border-b bg-white">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 4h1M7 20h1M16 4h1M16 20h1" />
                </svg>
                <h2 className="text-sm font-semibold">Activity Timeline</h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-2 min-h-0">
              <ActivityTracker entityType="admission" entityId={admission.id} entityName={admission.program} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
