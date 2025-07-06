import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { School, GraduationCap, Calendar, DollarSign, FileText, Clock, User } from "lucide-react";
import { Application, Student } from "@shared/schema";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface ApplicationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
}

export function ApplicationDetailsModal({ open, onOpenChange, application }: ApplicationDetailsModalProps) {
  const { data: student } = useQuery({
    queryKey: ['/api/students', application?.studentId],
    enabled: !!application?.studentId,
  });

  if (!application) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under-review': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waitlisted': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Application Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{application.university}</h2>
              <p className="text-gray-600">{application.program}</p>
            </div>
            <Badge className={getStatusColor(application.status)}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
            </Badge>
          </div>

          <Separator />

          {/* Student Information */}
          {student && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{student.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Email:</span>
                  <span>{student.email}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Program Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Program Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-gray-500" />
                <span>{application.university}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <span>{application.program}</span>
              </div>
              {application.degree && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Degree:</span>
                  <span>{application.degree}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intake Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Intake Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.intakeYear && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Year:</span>
                  <span>{application.intakeYear}</span>
                </div>
              )}
              {application.intakeSemester && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Semester:</span>
                  <span>{application.intakeSemester}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.applicationFee && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>Application Fee: {application.applicationFee}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {application.submissionDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Submission Date:</span>
                  <span>{format(new Date(application.submissionDate), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {application.decisionDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Decision Date:</span>
                  <span>{format(new Date(application.decisionDate), 'MMM dd, yyyy')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {application.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{application.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {application.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{format(new Date(application.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
              {application.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{format(new Date(application.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}