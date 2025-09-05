import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityTracker } from "./activity-tracker";
import { Award, User, X, ExternalLink, Plane, Calendar } from "lucide-react";
import { Admission, Student } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as AdmissionsService from "@/services/admissions";
import { useState } from "react";

interface AdmissionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission: Admission | null;
  onOpenStudentProfile?: (studentId: string) => void;
}

export function AdmissionDetailsModal({ open, onOpenChange, admission, onOpenStudentProfile }: AdmissionDetailsModalProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogTitle className="sr-only">Admission Details</DialogTitle>
        
        {/* Header with Fixed Position */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b p-3 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{admission.program}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="default"
                className="ml-2 p-0 h-auto w-auto bg-transparent hover:bg-transparent rounded-none text-gray-700"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[90vh]">
          {/* Main Content - Left Side */}
          <div className="flex-1 overflow-y-auto p-6 pt-16">
            {/* Status bar under header (mirror student) */}
            <div className="mb-3">
              <AdmissionStatusBar currentStatus={currentVisaStatus} onChange={handleVisaStatusChange} />
            </div>
            <div className="space-y-6">
              {/* Admission Information */}
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
                      <label className="text-sm font-medium text-gray-600">Program</label>
                      <p className="text-lg font-semibold">{admission.program}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Decision Date</label>
                      <p>{admission.decisionDate ? new Date(admission.decisionDate).toLocaleDateString() : 'Pending'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tuition Fee</label>
                      <p>{admission.tuitionFee || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Scholarship Amount</label>
                      <p>{admission.scholarshipAmount || 'No scholarship'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Start Date</label>
                      <p>{admission.startDate ? new Date(admission.startDate).toLocaleDateString() : 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">End Date</label>
                      <p>{admission.endDate ? new Date(admission.endDate).toLocaleDateString() : 'Not specified'}</p>
                    </div>
                  </div>
                  {admission.notes && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="mt-1 text-gray-800">{admission.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Visa Information */}
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
                      <label className="text-sm font-medium text-gray-600">Visa Status</label>
                      <div className="mt-1">
                        <Badge variant={currentVisaStatus === 'approved' ? 'default' : 'secondary'}>
                          {currentVisaStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Visa Application Date</label>
                      <p>{admission.visaApplicationDate ? new Date(admission.visaApplicationDate).toLocaleDateString() : 'Not applied'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Visa Interview Date</label>
                      <p>{admission.visaInterviewDate ? new Date(admission.visaInterviewDate).toLocaleDateString() : 'Not scheduled'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Visa Approval Date</label>
                      <p>{admission.visaApprovalDate ? new Date(admission.visaApprovalDate).toLocaleDateString() : 'Pending'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Information */}
              {student && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Student Information
                      </CardTitle>
                      {onOpenStudentProfile && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onOpenStudentProfile(student.id)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="font-medium">{student.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p>{student.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p>{student.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <Badge variant="outline">{student.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Activity Sidebar (mirror student) */}
          <div className="basis-[35%] max-w-[35%] flex-shrink-0 bg-white rounded-lg p-3 flex flex-col h-full min-h-0 border-l border-gray-200 mt-12">
            <h3 className="text-sm font-semibold mb-2 flex items-center border-b border-gray-200 pb-2">
              <Calendar className="w-5 h-5 mr-2" />
              Activity Timeline
            </h3>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ActivityTracker
                entityType="admission"
                entityId={admission.id}
                entityName={admission.program}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
