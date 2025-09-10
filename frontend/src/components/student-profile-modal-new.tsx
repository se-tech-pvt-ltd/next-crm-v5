import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleCard } from './collapsible-card';
import { Input } from '@/components/ui/input';
import { DobPicker } from '@/components/ui/dob-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ActivityTracker } from './activity-tracker';
import { ApplicationDetailsModal } from '@/components/application-details-modal-new';
import { type Student, type Application } from '@/lib/types';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import * as StudentsService from '@/services/students';
import * as DropdownsService from '@/services/dropdowns';
import * as UsersService from '@/services/users';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { formatStatus } from '@/lib/utils';
import {
  User,
  Edit,
  Save,
  X,
  Plus,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  BookOpen,
  Target,
  User as UserIcon
} from 'lucide-react';

interface StudentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
  onOpenApplication?: (app: Application) => void;
  onOpenAddApplication?: (studentId?: string | null) => void;
}

export function StudentProfileModal({ open, onOpenChange, studentId, onOpenApplication }: StudentProfileModalProps) {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Student>>({});
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [, setLocation] = useLocation();
  
  const { data: student, isLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: [`/api/applications/student/${studentId}`],
    enabled: !!studentId,
  });


  // Get dropdown data for Students module
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/students'],
    queryFn: async () => DropdownsService.getModuleDropdowns('students')
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
  });

  // Helpers to resolve dropdown-backed labels (case-insensitive field keys)
  const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const getFieldOptions = (fieldName: string): any[] => {
    const data = dropdownData as any;
    if (!data) return [];
    const target = normalize(fieldName);
    const candidates = [target];
    if (target === 'englishproficiency') {
      candidates.push('elttest', 'elt', 'englishtest', 'english');
    }
    const entry = Object.entries(data).find(([k]) => candidates.includes(normalize(String(k))));
    return (entry?.[1] as any[]) || [];
  };
  const getDropdownLabel = (fieldName: string, value?: string | null) => {
    if (!value) return '';
    const options = getFieldOptions(fieldName);
    const hit = options.find((opt: any) => opt.id === value || opt.key === value || opt.value === value);
    return hit?.value || value;
  };

  useEffect(() => {
    if (student) {
      setEditData(student);
      setCurrentStatus(student.status);
    }
  }, [student]);

  // Build status sequence from dropdown API (ordered by sequence)
  const statusSequence = useMemo<string[]>(() => {
    const list: any[] = (dropdownData as any)?.Status || [];
    if (!Array.isArray(list) || list.length === 0) {
      // Fallback to default student statuses
      return ['active', 'applied', 'admitted', 'enrolled', 'inactive'];
    }
    return list.map((o: any) => o.key || o.id || o.value).filter(Boolean);
  }, [dropdownData]);

  const getStatusDisplayName = (statusId: string) => {
    const list: any[] = (dropdownData as any)?.Status || [];
    const byId = list.find((o: any) => o.id === statusId);
    if (byId?.value) return byId.value;
    const byKey = list.find((o: any) => o.key === statusId);
    if (byKey?.value) return byKey.value;
    const byValue = list.find((o: any) => o.value === statusId);
    if (byValue?.value) return byValue.value;
    return formatStatus(statusId);
  };

  const getCurrentStatusIndex = () => {
    const list: any[] = (dropdownData as any)?.Status || [];
    if (!Array.isArray(list) || list.length === 0 || !currentStatus) {
      // Fallback logic for default statuses
      const defaultStatuses = ['active', 'applied', 'admitted', 'enrolled', 'inactive'];
      return defaultStatuses.findIndex(s => s === currentStatus);
    }

    const option = list.find((o: any) => o.key === currentStatus || o.id === currentStatus || o.value === currentStatus);
    if (!option) return -1;

    return statusSequence.findIndex((id) => id === (option.key || option.id));
  };

  const dropdownsForStudent = () => {
    const data = dropdownData as any;
    if (data && typeof data === 'object') {
      const entry = Object.entries(data).find(([k]) => normalize(String(k)).includes('counsel'));
      return (entry?.[1] as any[]) || [];
    }
    return [] as any[];
  };

  const counselorOptions = () => {
    const opts = dropdownsForStudent();
    if (opts.length > 0) return opts.map((o: any) => ({ id: o.key || o.id || o.value, value: o.value }));
    return (users as User[]).map((u) => ({ id: u.id, value: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User' }));
  };

  const updateStudentMutation = useMutation({
    mutationFn: async (data: Partial<Student>) => StudentsService.updateStudent(student?.id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatusKey: string) => StudentsService.updateStudent(student?.id, { status: newStatusKey }),
    onMutate: async (newStatusKey: string) => {
      await queryClient.cancelQueries({ queryKey: [`/api/students/${studentId}`] });
      const previousStudent = queryClient.getQueryData([`/api/students/${studentId}`]);
      const previousStatus = currentStatus;
      setCurrentStatus(newStatusKey);
      if (previousStudent && typeof previousStudent === 'object') {
        queryClient.setQueryData([`/api/students/${studentId}`], { ...(previousStudent as any), status: newStatusKey });
      }
      return { previousStudent, previousStatus } as { previousStudent: any; previousStatus: string };
    },
    onError: (error: any, _newStatusKey, context) => {
      if (context?.previousStatus) setCurrentStatus(context.previousStatus);
      if (context?.previousStudent) queryClient.setQueryData([`/api/students/${studentId}`], context.previousStudent);
      toast({ title: 'Error', description: error.message || 'Failed to update status', variant: 'destructive' });
    },
    onSuccess: (updatedStudent) => {
      setCurrentStatus(updatedStudent.status);
      queryClient.setQueryData([`/api/students/${studentId}`], updatedStudent);
      toast({ title: 'Status updated', description: `Student status set to ${getStatusDisplayName(updatedStudent.status)}` });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/student/${studentId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/activities/student/${studentId}`] });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  const handleSaveChanges = () => {
    updateStudentMutation.mutate(editData);
  };

  const StatusProgressBar = () => {
    const currentIndex = getCurrentStatusIndex();

    return (
      <div className="w-full bg-gray-100 rounded-md p-1 mb-2">
        <div className="flex items-center justify-between relative">
          {statusSequence.map((statusId, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index <= currentIndex;
            const statusName = getStatusDisplayName(statusId);

            const handleClick = () => {
              if (updateStatusMutation.isPending) return;
              if (!student) return;
              const targetKey = statusId;
              if (currentStatus === targetKey) return;
              updateStatusMutation.mutate(targetKey);
            };

            return (
              <div
                key={statusId}
                className="flex flex-col items-center relative flex-1 cursor-pointer select-none"
                onClick={handleClick}
                role="button"
                aria-label={`Set status to ${statusName}`}
              >
                {/* Status Circle */}
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'
                }`}>
                  {isCompleted && <div className="w-1 h-1 bg-white rounded-full" />}
                  {!isCompleted && <div className="w-1 h-1 bg-gray-300 rounded-full" />}
                </div>

                {/* Status Label */}
                <span className={`mt-1 text-[11px] font-medium text-center ${
                  isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                }`}>
                  {statusName}
                </span>

                {/* Connector Line */}
                {index < statusSequence.length - 1 && (
                  <div className={`absolute top-2 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                  }`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideClose className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Loading Student</DialogTitle>
          <div className="text-center py-8">
            <p>Loading student...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!student) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideClose className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Student Not Found</DialogTitle>
          <div className="text-center py-8">
            <p>Student not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideClose className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Student Profile</DialogTitle>
          
          <div className="grid grid-cols-[1fr_360px] h-[90vh] min-h-0">
            {/* Left: Content */}
            <div className="flex flex-col min-h-0">
              {/* Sticky header inside scroll context */}
              <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex-1">
                    {statusSequence.length > 0 && <StatusProgressBar />}
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={() => onOpenChange(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs">Student Information</CardTitle>
                      <div className="flex items-center space-x-2">
                        {!isEditing ? (
                          <>
                            <Button
                              variant="outline"
                              size="xs"
                              className="rounded-full px-2 [&_svg]:size-3"
                              onClick={() => { onOpenChange(false); if (typeof onOpenAddApplication === 'function') { setTimeout(() => onOpenAddApplication(student?.id), 160); } }}
                              title="Add Application"
                            >
                              <Plus />
                              <span className="hidden lg:inline">Add Application</span>
                            </Button>
                            <Button variant="outline" size="xs" className="rounded-full px-2 [&_svg]:size-3" onClick={() => setIsEditing(true)} disabled={isLoading} title="Edit">
                              <Edit />
                              <span className="hidden lg:inline">Edit</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" onClick={handleSaveChanges} disabled={updateStudentMutation.isPending}>
                              <Save className="w-4 h-4 mr-1" />
                              Save Changes
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditData(student); }}>
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label className="flex items-center space-x-2"><span>Student ID</span></Label>
                        <div className="text-sm text-gray-700">{student?.student_id || student?.id || 'N/A'}</div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center space-x-2">
                          <UserIcon className="w-4 h-4" />
                          <span>Full Name</span>
                        </Label>
                        <Input id="name" value={isEditing ? (editData.name || '') : (student?.name || '')} onChange={(e) => setEditData({ ...editData, name: e.target.value })} disabled={!isEditing} className="h-7 text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passportNumber" className="flex items-center space-x-2">
                          <UserIcon className="w-4 h-4" />
                          <span>Passport Number</span>
                        </Label>
                        <Input id="passportNumber" value={isEditing ? (editData.passportNumber || '') : (student?.passportNumber || '')} onChange={(e) => setEditData({ ...editData, passportNumber: e.target.value })} disabled={!isEditing} className="h-7 text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Email Address</span>
                        </Label>
                        <Input id="email" type="email" value={isEditing ? (editData.email || '') : (student?.email || '')} onChange={(e) => setEditData({ ...editData, email: e.target.value })} disabled={!isEditing} className="h-7 text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Phone Number</span>
                        </Label>
                        <Input id="phone" type="tel" value={isEditing ? (editData.phone || '') : (student?.phone || '')} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} disabled={!isEditing} className="h-7 text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Date of Birth</span>
                        </Label>
                        <DobPicker id="dateOfBirth" value={isEditing ? (editData.dateOfBirth || '') : (student?.dateOfBirth || '')} onChange={(v) => setEditData({ ...editData, dateOfBirth: v })} disabled={!isEditing} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Address</span>
                        </Label>
                        <Textarea id="address" rows={3} value={isEditing ? (editData.address || '') : (student?.address || '')} onChange={(e) => setEditData({ ...editData, address: e.target.value })} disabled={!isEditing} className="text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <CollapsibleCard persistKey={`student-details:${authUser?.id || 'anon'}:academic-information`} cardClassName="shadow-sm hover:shadow-md transition-shadow" header={<CardTitle className="text-xs flex items-center space-x-2"><GraduationCap className="w-4 h-4 text-primary" /><span>Academic Information</span></CardTitle>}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="englishProficiency" className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>English Proficiency</span>
                      </Label>
                      {isEditing ? (
                        <Select value={editData.englishProficiency || ''} onValueChange={(v) => setEditData({ ...editData, englishProficiency: v })}>
                          <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Select proficiency" /></SelectTrigger>
                          <SelectContent>
                            {getFieldOptions('englishProficiency').map((opt: any) => (
                              <SelectItem key={opt.key || opt.id || opt.value} value={(opt.key || opt.id || opt.value) as string}>
                                {opt.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input id="englishProficiency" value={getDropdownLabel('englishProficiency', student?.englishProficiency || '')} disabled className="h-7 text-[11px]" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Counsellor</span></Label>
                      {isEditing ? (
                        <Select value={editData.counselorId || ''} onValueChange={(value) => setEditData({ ...editData, counselorId: value })}>
                          <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Select counsellor" /></SelectTrigger>
                          <SelectContent>
                            {counselorOptions().map((opt: any) => (
                              <SelectItem key={opt.id} value={opt.id}>{opt.value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-gray-700">{(() => { const found = counselorOptions().find((d: any) => d.id === student?.counselorId); return found?.value || 'Unassigned'; })()}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><span>Expectation</span></Label>
                      {isEditing ? (
                        <Select value={editData.expectation || ''} onValueChange={(v) => setEditData({ ...editData, expectation: v })}>
                          <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Select expectation" /></SelectTrigger>
                          <SelectContent>
                            {getFieldOptions('expectation').map((opt: any) => (
                              <SelectItem key={opt.key || opt.id || opt.value} value={(opt.key || opt.id || opt.value) as string}>
                                {opt.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={getDropdownLabel('expectation', student?.expectation || '')} disabled className="h-7 text-[11px]" />
                      )}
                    </div>

                    <div className="space-y-2">
                      {isEditing ? (
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-3">
                            <Checkbox checked={!!editData.consultancyFree} onCheckedChange={(v) => setEditData({ ...editData, consultancyFree: !!v })} />
                            <span className="text-sm">Consultancy Free</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Checkbox checked={!!editData.scholarship} onCheckedChange={(v) => setEditData({ ...editData, scholarship: !!v })} />
                            <span className="text-sm">Scholarship</span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-[11px] text-gray-600">Consultancy Fee</div>
                            <div className="text-sm text-gray-700">{student?.consultancyFree ? 'Yes' : 'No'}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-gray-600">Scholarship</div>
                            <div className="text-sm text-gray-700">{student?.scholarship ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </CollapsibleCard>

                <CollapsibleCard
                  persistKey={`student-details:${authUser?.id || 'anon'}:applications`}
                  cardClassName="shadow-sm hover:shadow-md transition-shadow"
                  header={
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="text-xs flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Applications</span>
                        {Array.isArray(applications) && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">{applications.length}</Badge>
                        )}
                      </CardTitle>
                      <Button variant="outline" size="xs" className="rounded-full px-2 [&_svg]:size-3" onClick={() => { onOpenChange(false); if (typeof onOpenAddApplication === 'function') { setTimeout(() => onOpenAddApplication(student?.id), 160); } }}>
                        <Plus />
                        <span className="hidden lg:inline">Add Application</span>
                      </Button>
                    </div>
                  }
                >
                  {(!applications || applications.length === 0) ? (
                    <div className="text-xs text-gray-500">No applications yet.</div>
                  ) : (
                    <div className="divide-y">
                      {applications.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => { if (typeof onOpenApplication === 'function') { onOpenApplication(app); onOpenChange(false); } else { setSelectedApplication(app); setIsAppDetailsOpen(true); onOpenChange(false); } }}
                          className="w-full text-left flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{app.university} — {app.program}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {(app.country || '-')}{app.intake ? ` • ${app.intake}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px]">{app.appStatus}</Badge>
                            {app.caseStatus && <Badge variant="secondary" className="text-[10px]">{app.caseStatus}</Badge>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CollapsibleCard>

              </div>
            </div>

            {/* Right: Timeline */}
            <div className="border-l bg-white flex flex-col min-h-0">
              <div className="sticky top-0 z-10 px-3 py-2 border-b bg-white">
                <h2 className="text-xs font-semibold">Activity Timeline</h2>
              </div>
              <div className="flex-1 overflow-y-auto pt-1 min-h-0">
                <ActivityTracker entityType="student" entityId={student.id} entityName={student.name} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <ApplicationDetailsModal
        open={isAppDetailsOpen}
        onOpenChange={(open) => { setIsAppDetailsOpen(open); if (!open) setSelectedApplication(null); }}
        application={selectedApplication}
      />

    </>
  );
}
