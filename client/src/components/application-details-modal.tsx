import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School, GraduationCap, Calendar, DollarSign, FileText, Clock, User, Edit, ExternalLink } from "lucide-react";
import { Application, Student } from "@shared/schema";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface ApplicationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onOpenStudentProfile?: (studentId: number) => void;
}

export function ApplicationDetailsModal({ open, onOpenChange, application, onOpenStudentProfile }: ApplicationDetailsModalProps) {
  const [currentStatus, setCurrentStatus] = useState<string>(application?.status || 'draft');
  const queryClient = useQueryClient();

  const { data: student } = useQuery({
    queryKey: [`/api/students/${application?.studentId}`],
    enabled: !!application?.studentId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!application) return;
      return apiRequest('PUT', `/api/applications/${application.id}`, { status: newStatus });
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Application Details
            </DialogTitle>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900">{application.university}</h2>
              <p className="text-lg text-gray-600 mt-1">{application.program}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Intake:</span> {application.intakeSemester} {application.intakeYear}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Application ID:</span> #{application.id}
                </div>
              </div>
            </div>
            <div className="ml-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Status
              </label>
              <Select value={currentStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Student Information with Link */}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name</span>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email</span>
                    <p className="text-sm">{student.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                    <p className="text-sm">{student.phone || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Program & University Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Program Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Program</span>
                  <p className="mt-1">{application.program}</p>
                </div>
                {application.degree && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Degree Type</span>
                    <p className="mt-1">{application.degree}</p>
                  </div>
                )}
                {application.specialization && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Specialization</span>
                    <p className="mt-1">{application.specialization}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Application Deadline</span>
                  <p className="mt-1">{application.applicationDeadline ? format(new Date(application.applicationDeadline), 'PPP') : 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Submission Date</span>
                  <p className="mt-1">{application.submissionDate ? format(new Date(application.submissionDate), 'PPP') : 'Not submitted'}</p>
                </div>
                {application.decisionDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Decision Date</span>
                    <p className="mt-1">{format(new Date(application.decisionDate), 'PPP')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Application Fee</span>
                  <p className="mt-1 font-medium">{application.applicationFee || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Tuition Fee</span>
                  <p className="mt-1 font-medium">{application.tuitionFee || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Living Costs</span>
                  <p className="mt-1 font-medium">{application.estimatedLivingCosts || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements & Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Requirements & Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.englishProficiencyRequirement && (
                <div>
                  <span className="text-sm font-medium text-gray-500">English Proficiency</span>
                  <p className="mt-1">{application.englishProficiencyRequirement}</p>
                </div>
              )}
              {application.academicRequirements && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Academic Requirements</span>
                  <p className="mt-1">{application.academicRequirements}</p>
                </div>
              )}
              {application.documentsSubmitted && application.documentsSubmitted.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Documents Submitted</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {application.documentsSubmitted.map((doc, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {application.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{application.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Created/Updated Timeline */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
            <span>Created: {format(new Date(application.createdAt), 'PPP p')}</span>
            <span>Last Updated: {format(new Date(application.updatedAt), 'PPP p')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}