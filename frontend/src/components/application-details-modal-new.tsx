import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityTracker } from "./activity-tracker";
import { School, User, X, ExternalLink } from "lucide-react";
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
  const [currentStatus, setCurrentStatus] = useState<string>(application?.appStatus || 'Open');
  const queryClient = useQueryClient();

  const { data: student } = useQuery({
    queryKey: [`/api/students/${application?.studentId}`],
    enabled: !!application?.studentId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!application) return;
      return apiRequest('PUT', `/api/applications/${application.id}`, { appStatus: newStatus });
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogTitle className="sr-only">Application Details</DialogTitle>
        
        {/* Header with Fixed Position */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <School className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{application.university}</h1>
                <p className="text-sm text-gray-600">{application.program}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs text-gray-500">Application Status</label>
                <Select value={currentStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="default"
                className="w-10 h-10 p-0 rounded-full bg-black hover:bg-gray-800 text-white ml-2"
                onClick={() => onOpenChange(false)}
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

          {/* Right Sidebar - Activity Timeline */}
          <div className="w-96 bg-gradient-to-br from-blue-50 to-blue-100 border-l overflow-hidden">
            <div className="px-4 py-5 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="text-lg font-semibold">Activity Timeline</h2>
            </div>
            <div className="overflow-y-auto h-full pt-2">
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
