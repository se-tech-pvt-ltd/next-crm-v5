import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, School, GraduationCap, Calendar, DollarSign, Clock, User, CreditCard, Plane, Edit, ExternalLink } from "lucide-react";
import { Admission, Student } from "@shared/schema";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface AdmissionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission: Admission | null;
  onOpenStudentProfile?: (studentId: number) => void;
}

export function AdmissionDetailsModal({ open, onOpenChange, admission, onOpenStudentProfile }: AdmissionDetailsModalProps) {
  const [currentVisaStatus, setCurrentVisaStatus] = useState<string>(admission?.visaStatus || 'pending');
  const queryClient = useQueryClient();

  const { data: student } = useQuery({
    queryKey: [`/api/students/${admission?.studentId}`],
    enabled: !!admission?.studentId,
  });

  const updateVisaStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!admission) return;
      return apiRequest('PUT', `/api/admissions/${admission.id}`, { visaStatus: newStatus });
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

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waitlisted': return 'bg-yellow-100 text-yellow-800';
      case 'conditional': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisaStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'applied': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Admission Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{admission.university}</h2>
              <p className="text-gray-600">{admission.program}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={getDecisionColor(admission.decision)}>
                {admission.decision.charAt(0).toUpperCase() + admission.decision.slice(1)}
              </Badge>
              {admission.visaStatus && (
                <Badge className={getVisaStatusColor(admission.visaStatus)}>
                  Visa: {admission.visaStatus.charAt(0).toUpperCase() + admission.visaStatus.slice(1)}
                </Badge>
              )}
            </div>
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
                <span>{admission.university}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <span>{admission.program}</span>
              </div>
            </CardContent>
          </Card>

          {/* Decision Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Decision Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{admission.decision}</span>
              </div>
              {admission.decisionDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Decision Date: {format(new Date(admission.decisionDate), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {admission.conditions && (
                <div className="space-y-1">
                  <span className="text-gray-500">Conditions:</span>
                  <p className="text-gray-700 ml-6">{admission.conditions}</p>
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
            <CardContent className="space-y-3">
              {admission.scholarshipAmount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>Scholarship: {admission.scholarshipAmount}</span>
                </div>
              )}
              {admission.depositRequired && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span>Deposit Required: {admission.depositAmount || 'Amount TBD'}</span>
                  </div>
                  {admission.depositDeadline && (
                    <div className="flex items-center gap-2 ml-6">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span>Due: {format(new Date(admission.depositDeadline), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visa Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Visa Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{admission.visaStatus || 'Not Started'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {admission.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{admission.notes}</p>
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
              {admission.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{format(new Date(admission.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
              {admission.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{format(new Date(admission.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}