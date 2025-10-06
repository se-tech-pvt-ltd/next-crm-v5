import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
console.log('[modal] loaded: frontend/src/components/application-details-modal.tsx');
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityTracker } from "./activity-tracker";
import { School, User, X, ExternalLink, Edit, Save } from "lucide-react";
import { Application, Student } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ApplicationsService from "@/services/applications";
import { useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';

interface ApplicationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onOpenStudentProfile?: (studentId: string) => void;
}

export function ApplicationDetailsModal({ open, onOpenChange, application, onOpenStudentProfile }: ApplicationDetailsModalProps) {
  const [currentStatus, setCurrentStatus] = useState<string>(application?.appStatus || 'Open');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Application>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const updateApplicationMutation = useMutation({
    mutationFn: async (data: Partial<Application>) => {
      if (!application) return;
      return ApplicationsService.updateApplication(application.id, data);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Application updated.' });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${application?.id}`] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed to update application.', variant: 'destructive' });
    },
  });

  useEffect(() => {
    setCurrentStatus(application?.appStatus || 'Open');
    setEditData(application || {});
  }, [application]);

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  const handleSaveChanges = () => {
    updateApplicationMutation.mutate(editData);
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <DialogTitle className="sr-only">Application Details</DialogTitle>

        <div className="grid grid-cols-[1fr_360px] h-[90vh] min-h-0">
          {/* Left: Content */}
          <div className="flex flex-col min-h-0">
            {/* Sticky header inside scroll context */}
            <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 max-[991px]:w-[100%] max-[991px]:mx-0 lg:mx-0 lg:w-auto">
              <div className="w-full">
                <div className="w-full max-[991px]:w-[60%] max-[991px]:mx-auto">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <School className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-lg font-semibold truncate">{application.university}</h1>
                        <p className="text-xs text-gray-600 truncate">{application.program}</p>
                      </div>
                    </div>

                    <div className="hidden md:block">
                      <label htmlFor="header-status" className="text-[11px] text-gray-500">Application Status</label>
                      <Select value={currentStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="h-8 text-xs w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button variant="default" size="xs" className="rounded-full px-2 [&_svg]:size-3 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSaveChanges} title="Save" disabled={updateApplicationMutation.isPending}>
                            <Save />
                            <span className="hidden lg:inline">{updateApplicationMutation.isPending ? 'Saving…' : 'Save'}</span>
                          </Button>
                          <Button variant="outline" size="xs" className="rounded-full px-2 [&_svg]:size-3" onClick={() => { setIsEditing(false); setEditData(application); }} title="Cancel" disabled={updateApplicationMutation.isPending}>
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

                  {/* Status bar (simple) */}
                  <div className="px-4 pb-3">
                    <div className="w-full bg-gray-100 rounded-md p-1.5">
                      <div className="flex items-center justify-between relative">
                        {['Open','Needs Attention','Closed'].map((s, index, arr) => {
                          const currentIndex = arr.indexOf(currentStatus || '');
                          const isCompleted = currentIndex >= 0 && index <= currentIndex;
                          const label = s;
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

            {/* Scrollable body */}
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
                        {isEditing ? (
                          <Input value={editData.university || ''} disabled />
                        ) : (
                          <p className="text-lg font-semibold">{application.university}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Program</label>
                        {isEditing ? (
                          <Input value={editData.program || ''} disabled />
                        ) : (
                          <p className="text-lg font-semibold">{application.program}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Course Type</label>
                        {isEditing ? (
                          <Input value={editData.courseType || ''} disabled />
                        ) : (
                          <p>{application.courseType || 'Not specified'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Country</label>
                        {isEditing ? (
                          <Input value={editData.country || ''} disabled />
                        ) : (
                          <p>{application.country || 'Not specified'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Intake</label>
                        {isEditing ? (
                          <Input value={editData.intake || ''} disabled />
                        ) : (
                          <p>{application.intake || 'Not specified'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Channel Partner</label>
                        {isEditing ? (
                          <Input value={editData.channelPartner || ''} onChange={(e) => setEditData(prev => ({ ...prev, channelPartner: e.target.value }))} />
                        ) : (
                          <p>{application.channelPartner || 'Not specified'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Google Drive Link</label>
                        {isEditing ? (
                          <Input value={editData.googleDriveLink || ''} onChange={(e) => setEditData(prev => ({ ...prev, googleDriveLink: e.target.value }))} />
                        ) : (
                          <p>{application.googleDriveLink ? <a className="text-blue-600 underline" href={application.googleDriveLink} target="_blank" rel="noreferrer">Open Link</a> : 'Not provided'}</p>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-600">Notes</label>
                        <Textarea value={editData.notes || ''} onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
                      </div>
                    ) : (
                      application.notes && (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-gray-600">Notes</label>
                          <p className="mt-1 text-gray-800">{application.notes}</p>
                        </div>
                      )
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

          <div className="w-[420px] border-l bg-white flex flex-col min-h-0" style={{ width: '420px' }}>
            <div className="pt-1 min-h-0 flex-1 overflow-y-auto">
              <ActivityTracker entityType="application" entityId={application.id} entityName={`${application.university} - ${application.program}`} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
