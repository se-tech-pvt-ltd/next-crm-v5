import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
console.log('[modal] loaded: frontend/src/components/admission-details-modal-new.tsx');
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTracker } from "./activity-tracker";
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Award, X, Plane } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Admission } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as AdmissionsService from "@/services/admissions";
import * as ApplicationsService from "@/services/applications";
import { useState } from "react";
import { useLocation } from 'wouter';

interface AdmissionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission: Admission | null;
}

export function AdmissionDetailsModal({ open, onOpenChange, admission }: AdmissionDetailsModalProps) {
  const [, setLocation] = useLocation();
  const AdmissionStatusBar = ({ currentStatus, onChange }: { currentStatus: string; onChange: (s: string) => void }) => {
    const steps = ['not_applied','applied','interview_scheduled','approved','rejected','on_hold'];
    const labels: Record<string,string> = { not_applied:'Not Applied', applied:'Applied', interview_scheduled:'Interview Scheduled', approved:'Approved', rejected:'Rejected', on_hold:'On Hold' };
    const idx = steps.findIndex((s) => s === currentStatus);
    return (
      <div className="w-full bg-gray-100 rounded-md p-1.5">
        <div className="flex items-center justify-between relative">
          {steps.map((s, i) => {
            const isCompleted = i <= idx && idx !== -1;
            return (
              <div key={s} className="flex-1 flex flex-col items-center relative cursor-pointer select-none" onClick={() => onChange(s)}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-white' : 'bg-gray-300'}`} />
                </div>
                <span className={`mt-1 text-[10px] font-medium ${isCompleted ? 'text-blue-600' : 'text-gray-600'}`}>{labels[s]}</span>
                {i < steps.length - 1 && (
                  <div className={`absolute top-2.5 left-1/2 w-full h-0.5 -translate-y-1/2 ${i < idx ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const [currentVisaStatus, setCurrentVisaStatus] = useState<string>(admission?.visaStatus || 'not_applied');
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

  const updateVisaStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!admission) return;
      return AdmissionsService.updateAdmission(admission.id, { visaStatus: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admissions/${admission?.id}`] });
    },
  });

  const handleVisaStatusChange = (newStatus: string) => {
    setCurrentVisaStatus(newStatus);
    updateVisaStatusMutation.mutate(newStatus);
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

  return (
    <DetailsDialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Admission Details"
      headerClassName="bg-[#223E7D] text-white"
      statusBarWrapperClassName="px-4 py-2 bg-[#223E7D] text-white -mt-px"
      headerLeft={headerLeft}
      headerRight={headerRight}
      statusBar={<AdmissionStatusBar currentStatus={currentVisaStatus} onChange={handleVisaStatusChange} />}
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
                  <Label>Program</Label>
                  <p className="text-xs font-semibold">{admission.program}</p>
                </div>
                <div>
                  <Label>Decision Date</Label>
                  <p className="text-xs">{admission.decisionDate ? new Date(admission.decisionDate).toLocaleDateString() : 'Pending'}</p>
                </div>
                <div>
                  <Label>Tuition Fee</Label>
                  <p className="text-xs">{(admission as any).fullTuitionFee || 'Not specified'}</p>
                </div>
                <div>
                  <Label>Scholarship Amount</Label>
                  <p className="text-xs">{admission.scholarshipAmount || 'No scholarship'}</p>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p className="text-xs">{admission.startDate ? new Date(admission.startDate).toLocaleDateString() : 'Not specified'}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="text-xs">{admission.endDate ? new Date(admission.endDate).toLocaleDateString() : 'Not specified'}</p>
                </div>
              </div>
              {admission.notes && (
                <div className="mt-4">
                  <Label>Notes</Label>
                  <p className="mt-1 text-xs text-gray-800">{admission.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plane className="w-5 h-5 mr-2" />
                Visa Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Visa Status</Label>
                  <div className="mt-1">
                    <Badge variant={currentVisaStatus === 'approved' ? 'default' : 'secondary'}>
                      <span className="text-xs">{currentVisaStatus.replace('_', ' ').toUpperCase()}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Visa Date</Label>
                  <p className="text-xs">{(admission as any).visaDate ? new Date((admission as any).visaDate as any).toLocaleDateString() : 'Not specified'}</p>
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
