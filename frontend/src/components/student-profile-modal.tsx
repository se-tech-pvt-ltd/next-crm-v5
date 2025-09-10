import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DobPicker } from '@/components/ui/dob-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityTracker } from './activity-tracker';
import { type Student, type Application, type Admission } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import * as StudentsService from '@/services/students';
import { useToast } from '@/hooks/use-toast';
import { User, Edit, Save, X, Plus, FileText, Award, Calendar, Phone, Mail } from 'lucide-react';

interface StudentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
  onOpenAddApplication?: (studentId?: string | null) => void;
}

export function StudentProfileModal({ open, onOpenChange, studentId }: StudentProfileModalProps) {
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Student>>({});
  const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false);
  
  const { data: student, isLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
  });

  const { data: lead } = useQuery({
    queryKey: [`/api/leads/${student?.leadId}`],
    enabled: !!student?.leadId,
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: [`/api/applications/student/${studentId}`],
    enabled: !!studentId,
  });

  const { data: admissions } = useQuery<Admission[]>({
    queryKey: [`/api/admissions/student/${studentId}`],
    enabled: !!studentId,
  });

  useEffect(() => {
    if (student) {
      setEditData(student);
      setCurrentStatus(student.status);
    }
  }, [student]);

  const updateStudentMutation = useMutation({
    mutationFn: async (data: Partial<Student>) => StudentsService.updateStudent(student?.id, data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to update student.', variant: 'destructive' });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    updateStudentMutation.mutate({ status: newStatus });
  };

  const handleSaveChanges = () => {
    updateStudentMutation.mutate(editData);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle className="sr-only">Loading Student</DialogTitle>
          <div className="text-center py-8">Loading student...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!student) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle className="sr-only">Student Not Found</DialogTitle>
          <div className="text-center py-8">Student not found</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Student Profile</DialogTitle>

          <div className="grid grid-cols-[1fr_360px] h-[90vh] min-h-0">
            {/* Left: Content */}
            <div className="flex flex-col min-h-0">
              {/* Sticky header inside scroll context */}
              <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 max-[991px]:w-[60%] max-[991px]:mx-auto lg:mx-0 lg:w-auto">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <h1 className="text-lg font-semibold truncate">{student.name}</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="default" size="xs" className="rounded-full px-2 [&_svg]:size-3 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSaveChanges} title="Save" disabled={updateStudentMutation.isPending}>
                          <Save />
                          <span className="hidden lg:inline">{updateStudentMutation.isPending ? 'Saving…' : 'Save'}</span>
                        </Button>
                        <Button variant="outline" size="xs" className="rounded-full px-2 [&_svg]:size-3" onClick={() => { setIsEditing(false); setEditData(student); }} title="Cancel" disabled={updateStudentMutation.isPending}>
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
                        <Button variant="outline" size="xs" className="rounded-full px-2 [&_svg]:size-3" onClick={() => { onOpenChange(false); if (typeof onOpenAddApplication === 'function') { setTimeout(() => onOpenAddApplication(student?.id), 160); } else { setTimeout(() => setIsAddApplicationOpen(true), 160); } }} title="Add Application">
                          <Plus />
                          <span className="hidden lg:inline">Add App</span>
                        </Button>
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
                      {['active','applied','admitted','enrolled','inactive'].map((s, index, arr) => {
                        const currentIndex = arr.indexOf(currentStatus || '');
                        const isCompleted = currentIndex >= 0 && index <= currentIndex;
                        const statusName = s.charAt(0).toUpperCase() + s.slice(1);
                        const handleClick = () => {
                          if (currentStatus === s) return;
                          handleStatusChange(s);
                        };
                        return (
                          <div key={s} className="flex flex-col items-center relative flex-1 cursor-pointer select-none" onClick={handleClick} role="button" aria-label={`Set status to ${statusName}`}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'}`}>
                              {isCompleted ? <div className="w-1.5 h-1.5 bg-white rounded-full" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                            </div>
                            <span className={`mt-1 text-xs font-medium text-center ${isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>{statusName}</span>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                <div className="space-y-6">
                  {/* Student Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Student Information</h2>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                          {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" value={editData.name || ''} onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))} disabled={!isEditing} />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" value={editData.email || ''} onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))} disabled={!isEditing} />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" value={editData.phone || ''} onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))} disabled={!isEditing} />
                        </div>
                        <div>
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <DobPicker id="dateOfBirth" value={editData.dateOfBirth || ''} onChange={(v) => setEditData(prev => ({ ...prev, dateOfBirth: v }))} disabled={!isEditing} />
                        </div>
                      </div>
                      {isEditing && (
                        <div className="mt-4 flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                          <Button onClick={handleSaveChanges}>Save Changes</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Lead Information */}
                  {lead && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">Lead Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Original Source</label>
                            <p>{lead.source || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Lead Type</label>
                            <p>{lead.type || 'General'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Interest Country</label>
                            <p>{lead.country || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Interest Program</label>
                            <p>{lead.program || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Expectation</label>
                            <p>{lead.expectation || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Created Date</label>
                            <p>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Academic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Academic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Academic Background</label>
                          <p>{student.academicBackground || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">English Proficiency</label>
                          <p>{student.englishProficiency || 'Not assessed'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Target Country</label>
                          <p>{student.targetCountry || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Target Program</label>
                          <p>{student.targetProgram || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Budget</label>
                          <p>{student.budget || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Nationality</label>
                          <p>{student.nationality || 'Not provided'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Applications Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center"><FileText className="w-5 h-5 mr-2" />Applications ({applications?.length || 0})</h2>
                        <Button size="sm" onClick={() => { onOpenChange(false); if (typeof onOpenAddApplication === 'function') { setTimeout(() => onOpenAddApplication(student?.id), 160); } else { setTimeout(() => setIsAddApplicationOpen(true), 160); } }} className="flex items-center gap-2"><Plus className="w-4 h-4" />Add Application</Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {applications && applications.length > 0 ? (
                        <div className="space-y-3">
                          {applications.map((application) => (
                            <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium">{application.university}</h3>
                                  <p className="text-sm text-gray-600">{application.program}</p>
                                </div>
                                <Badge variant={application.appStatus === 'Closed' ? 'default' : 'secondary'}>{application.appStatus}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No applications yet</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Admissions Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center"><Award className="w-5 h-5 mr-2" />Admissions ({admissions?.length || 0})</h2>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {admissions && admissions.length > 0 ? (
                        <div className="space-y-3">
                          {admissions.map((admission) => (
                            <div key={admission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium">{admission.program}</h3>
                                  <p className="text-sm text-gray-600">Decision: {admission.decisionDate}</p>
                                </div>
                                <Badge variant="default">{admission.visaStatus || 'Pending'}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No admissions yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Activity Timeline (match LeadDetailsModal) */}
            <div className="border-l bg-white flex flex-col min-h-0 pt-5 lg:pt-0 max-[991px]:pt-5">
              <div className="sticky top-0 z-10 px-4 py-3 border-b bg-white">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 4h1M7 20h1M16 4h1M16 20h1" />
                  </svg>
                  <h2 className="text-sm font-semibold">Activity Timeline</h2>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pt-2 min-h-0">
                <ActivityTracker entityType="student" entityId={student.id} entityName={student.name} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Application Modal */}
      <AddApplicationModal open={isAddApplicationOpen} onOpenChange={setIsAddApplicationOpen} studentId={student.id} />

    </>
  );
}
