import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityTracker } from "./activity-tracker";
import { School, User, X, ExternalLink, Calendar } from "lucide-react";
import { Application, Student } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ApplicationsService from "@/services/applications";
import { useState } from "react";

interface ApplicationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onOpenStudentProfile?: (studentId: string) => void;
}

export function ApplicationDetailsModal({ open, onOpenChange, application, onOpenStudentProfile }: ApplicationDetailsModalProps) {
  const ApplicationStatusBar = ({ currentStatus, onChange }: { currentStatus: string; onChange: (s: string) => void }) => {
    const steps = ["Open", "Needs Attention", "Closed"];
    const idx = steps.findIndex((s) => s === currentStatus);
    return (
      <div className="w-full bg-gray-100 rounded-md p-1.5">
        <div className="flex items-center justify-between relative">
          {steps.map((s, i) => {
            const isCompleted = i <= idx;
            return (
              <div key={s} className="flex-1 flex flex-col items-center relative cursor-pointer select-none" onClick={() => onChange(s)}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-white' : 'bg-gray-300'}`} />
                </div>
                <span className={`mt-1 text-xs font-medium ${isCompleted ? 'text-blue-600' : 'text-gray-600'}`}>{s}</span>
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
  const [currentStatus, setCurrentStatus] = useState<string>(application?.appStatus || 'Open');
  const queryClient = useQueryClient();

  const { data: student } = useQuery({
    queryKey: [`/api/students/${application?.studentId}`],
    enabled: !!application?.studentId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!application) return;
      return ApplicationsService.updateApplication(application.id, { appStatus: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${application?.id}`] });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogTitle className="sr-only">Application Details</DialogTitle>
        
        {/* Header with Fixed Position */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b p-3 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <School className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{application.university}</h1>
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
              <ApplicationStatusBar currentStatus={currentStatus} onChange={handleStatusChange} />
            </div>
            <div className="space-y-6">
              {/* Application Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <School className="w-5 h-5 mr-2" />
                    Application Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">University</label>
                      <p className="text-lg font-semibold">{application.university}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Program</label>
                      <p className="text-lg font-semibold">{application.program}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Course Type</label>
                      <p>{application.courseType || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Country</label>
                      <p>{application.country || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Intake</label>
                      <p>{application.intake || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Channel Partner</label>
                      <p>{application.channelPartner || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Google Drive Link</label>
                      <p>{application.googleDriveLink ? <a className="text-blue-600 underline" href={application.googleDriveLink} target="_blank" rel="noreferrer">Open Link</a> : 'Not provided'}</p>
                    </div>
                  </div>
                  {application.notes && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="mt-1 text-gray-800">{application.notes}</p>
                    </div>
                  )}
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
                entityType="application"
                entityId={application.id}
                entityName={`${application.university} - ${application.program}`}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
