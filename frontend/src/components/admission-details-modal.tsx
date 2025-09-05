import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityTracker } from "./activity-tracker";
import { Award, User, X, ExternalLink, Plane, Edit, Save } from "lucide-react";
import { Admission, Student } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as AdmissionsService from "@/services/admissions";
import { useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';

interface AdmissionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admission: Admission | null;
  onOpenStudentProfile?: (studentId: string) => void;
}

export function AdmissionDetailsModal({ open, onOpenChange, admission, onOpenStudentProfile }: AdmissionDetailsModalProps) {
  const [currentVisaStatus, setCurrentVisaStatus] = useState<string>(admission?.visaStatus || 'not_applied');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Admission>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const updateAdmissionMutation = useMutation({
    mutationFn: async (data: Partial<Admission>) => {
      if (!admission) return;
      return AdmissionsService.updateAdmission(admission.id, data);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Admission updated.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admissions/${admission?.id}`] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed to update admission.', variant: 'destructive' });
    },
  });

  const handleVisaStatusChange = (newStatus: string) => {
    setCurrentVisaStatus(newStatus);
    updateVisaStatusMutation.mutate(newStatus);
  };

  useEffect(() => {
    setCurrentVisaStatus(admission?.visaStatus || 'not_applied');
    setEditData(admission || {});
  }, [admission]);

  const handleSaveChanges = () => {
    updateAdmissionMutation.mutate(editData);
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
            <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
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
                  <label htmlFor="header-status" className="text-[11px] text-gray-500">Visa Status</label>
                  <Select value={currentVisaStatus} onValueChange={handleVisaStatusChange}>
                    <SelectTrigger className="h-8 text-xs w-32">
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

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="default" size="xs" className="rounded-full px-2 [&_svg]:size-3 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSaveChanges} title="Save" disabled={updateAdmissionMutation.isPending}>
                        <Save />
                        <span className="hidden lg:inline">{updateAdmissionMutation.isPending ? 'Saving…' : 'Save'}</span>
                      </Button>
                      <Button variant="outline" size="xs" className="rounded-full px-2 [&_svg]:size-3" onClick={() => { setIsEditing(false); setEditData(admission); }} title="Cancel" disabled={updateAdmissionMutation.isPending}>
                        <X />
                        <span className="hidden lg:inline">Cancel</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="xs" className="rounded-full px-2 [&_svg]:size-3" onClick={() => setIsEditing(true)} title="Edit">
                        <Edit />
                        <span className="hidden lg:inline">Edit</span>
                      </Button>
                      {student && (
                        <Button variant="default" size="xs" className="rounded-full px-2 [&_svg]:size-3 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onOpenStudentProfile?.(student.id)} title="View Student">
                          <ExternalLink />
                          <span className="hidden lg:inline">View Student</span>
                        </Button>
                      )}
                    </>
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
                      const currentIndex = arr.indexOf(currentVisaStatus || '');
                      const isCompleted = currentIndex >= 0 && index <= currentIndex;
                      const label = s.charAt(0).toUpperCase() + s.slice(1).replace('_',' ');
                      const handleClick = () => {
                        if (s === currentVisaStatus) return;
                        handleVisaStatusChange(s);
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

            {/* Scrollable body */}
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
                        {isEditing ? (
                          <Input value={editData.program || ''} onChange={(e) => setEditData(prev => ({ ...prev, program: e.target.value }))} />
                        ) : (
                          <p className="text-lg font-semibold">{admission.program}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Decision Date</label>
                        {isEditing ? (
                          <Input value={editData.decisionDate || ''} onChange={(e) => setEditData(prev => ({ ...prev, decisionDate: e.target.value }))} />
                        ) : (
                          <p>{admission.decisionDate ? new Date(admission.decisionDate).toLocaleDateString() : 'Pending'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tuition Fee</label>
                        {isEditing ? (
                          <Input value={editData.tuitionFee || ''} onChange={(e) => setEditData(prev => ({ ...prev, tuitionFee: e.target.value }))} />
                        ) : (
                          <p>{admission.tuitionFee || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Scholarship Amount</label>
                        {isEditing ? (
                          <Input value={editData.scholarshipAmount || ''} onChange={(e) => setEditData(prev => ({ ...prev, scholarshipAmount: e.target.value }))} />
                        ) : (
                          <p>{admission.scholarshipAmount || 'No scholarship'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                        {isEditing ? (
                          <Input value={editData.startDate || ''} onChange={(e) => setEditData(prev => ({ ...prev, startDate: e.target.value }))} />
                        ) : (
                          <p>{admission.startDate ? new Date(admission.startDate).toLocaleDateString() : 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Date</label>
                        {isEditing ? (
                          <Input value={editData.endDate || ''} onChange={(e) => setEditData(prev => ({ ...prev, endDate: e.target.value }))} />
                        ) : (
                          <p>{admission.endDate ? new Date(admission.endDate).toLocaleDateString() : 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-600">Notes</label>
                        <Textarea value={editData.notes || ''} onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
                      </div>
                    ) : (
                      admission.notes && (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-gray-600">Notes</label>
                          <p className="mt-1 text-gray-800">{admission.notes}</p>
                        </div>
                      )
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
                          <Badge variant={currentVisaStatus === 'approved' ? 'default' : 'secondary'}>{currentVisaStatus.replace('_', ' ').toUpperCase()}</Badge>
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
                          <Button variant="outline" size="sm" onClick={() => onOpenStudentProfile(student.id)}>
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
          </div>

          {/* Right Sidebar - Activity Timeline */}
          <div className="w-[360px] border-l bg-white flex flex-col min-h-0">
            <div className="sticky top-0 z-10 px-4 py-3 border-b bg-white">
              <h2 className="text-sm font-semibold">Activity Timeline</h2>
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
