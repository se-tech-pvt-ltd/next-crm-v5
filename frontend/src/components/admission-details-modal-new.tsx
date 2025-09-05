import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityTracker } from "./activity-tracker";
import { Award, User, X, ExternalLink, Plane } from "lucide-react";
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
        <div className="absolute top-0 left-0 right-0 bg-white border-b p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{admission.program}</h1>
                <p className="text-sm text-gray-600">Admission Decision</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs text-gray-500">Visa Status</label>
                <Select value={currentVisaStatus} onValueChange={handleVisaStatusChange}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_applied">Not Applied</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          <div className="flex-1 overflow-y-auto p-6 pt-28">
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
          <div className="basis-[35%] max-w-[35%] flex-shrink-0 bg-white rounded-lg p-3 flex flex-col h-full min-h-0 border-l border-gray-200">
            <h3 className="text-sm font-semibold mb-2 flex items-center border-b border-gray-200 pb-2">
              Activity Timeline
            </h3>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ActivityTracker
                entityType="admission"
                entityId={admission.id}
                entityName={admission.program}
                canAdd={false}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
