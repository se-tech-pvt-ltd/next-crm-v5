import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleCard } from './collapsible-card';
import { Input } from '@/components/ui/input';
import { DobPicker } from '@/components/ui/dob-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ActivityTracker } from './activity-tracker';
import { AddApplicationModal } from './add-application-modal';
import { AddAdmissionModal } from './add-admission-modal';
import { type Student, type Application, type Admission } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import * as StudentsService from '@/services/students';
import * as DropdownsService from '@/services/dropdowns';
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
  Award,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Globe,
  BookOpen,
  Target,
  User as UserIcon
} from 'lucide-react';

interface StudentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
}

export function StudentProfileModal({ open, onOpenChange, studentId }: StudentProfileModalProps) {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Student>>({});
  const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false);
  const [isAddAdmissionOpen, setIsAddAdmissionOpen] = useState(false);

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: [`/api/applications/student/${studentId}`],
    enabled: !!studentId,
  });

  const { data: admissions } = useQuery<Admission[]>({
    queryKey: [`/api/admissions/student/${studentId}`],
    enabled: !!studentId,
  });

  // Get dropdown data for Students module
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/students'],
    queryFn: async () => DropdownsService.getModuleDropdowns('students')
  });

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
      <div className="w-full bg-gray-100 rounded-md p-1.5 mb-3">
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
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'
                }`}>
                  {isCompleted && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  {!isCompleted && <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                </div>

                {/* Status Label */}
                <span className={`mt-1 text-xs font-medium text-center ${
                  isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                }`}>
                  {statusName}
                </span>

                {/* Connector Line */}
                {index < statusSequence.length - 1 && (
                  <div className={`absolute top-2.5 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${
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
        <DialogContent hideClose className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
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
        <DialogContent hideClose className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
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
        <DialogContent hideClose className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Student Profile</DialogTitle>
          
          <div className="text-xs md:text-[12px]">
            <div className="flex gap-0 h-[calc(90vh-2rem)] w-full items-stretch">
              {/* Main Content */}
              <div className="flex-1 flex flex-col space-y-4 min-w-0 min-h-0 w-full p-6 overflow-y-auto">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">{student.name}</h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="default"
                      className="ml-2 p-0 h-auto w-auto bg-transparent hover:bg-transparent rounded-none text-gray-700"
                      onClick={() => onOpenChange(false)}
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="default"
                      size="xs"
                      className="rounded-full px-2 [&_svg]:size-3 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                      onClick={() => setIsAddApplicationOpen(true)}
                      title="Add Application"
                    >
                      <Plus />
                      <span className="hidden lg:inline">Add Application</span>
                    </Button>
                    <Button
                      variant="default"
                      size="xs"
                      className="rounded-full px-2 [&_svg]:size-3 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                      onClick={() => setIsAddAdmissionOpen(true)}
                      title="Add Admission"
                    >
                      <Plus />
                      <span className="hidden lg:inline">Add Admission</span>
                    </Button>
                  </div>
                </div>

                {/* Status Progress Bar moved above student details */}
                {!isLoading && statusSequence.length > 0 && (
                  <div className="mb-2">
                    <StatusProgressBar />
                  </div>
                )}

                {/* Personal Information Section */}
                <Card className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Personal Information</CardTitle>
                      <div className="flex items-center space-x-2">
                        {!isEditing ? (
                          <Button
                            variant="outline"
                            size="xs"
                            className="rounded-full px-2 [&_svg]:size-3"
                            onClick={() => setIsEditing(true)}
                            disabled={isLoading}
                            title="Edit"
                          >
                            <Edit />
                            <span className="hidden lg:inline">Edit</span>
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={handleSaveChanges}
                              disabled={updateStudentMutation.isPending}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save Changes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(false);
                                setEditData(student);
                              }}
                            >
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
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center space-x-2">
                          <UserIcon className="w-4 h-4" />
                          <span>Full Name</span>
                        </Label>
                        <Input
                          id="name"
                          value={isEditing ? (editData.name || '') : (student?.name || '')}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          disabled={!isEditing}
                          className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Email Address</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={isEditing ? (editData.email || '') : (student?.email || '')}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          disabled={!isEditing}
                          className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Phone Number</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={isEditing ? (editData.phone || '') : (student?.phone || '')}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          disabled={!isEditing}
                          className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Date of Birth</span>
                        </Label>
                        <DobPicker
                          id="dateOfBirth"
                          value={isEditing ? (editData.dateOfBirth || '') : (student?.dateOfBirth || '')}
                          onChange={(v) => setEditData({ ...editData, dateOfBirth: v })}
                          disabled={!isEditing}
                        />
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Address</span>
                        </Label>
                        <Input
                          id="address"
                          value={isEditing ? (editData.address || '') : (student?.address || '')}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                          disabled={!isEditing}
                          className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Nationality */}
                      <div className="space-y-2">
                        <Label htmlFor="nationality" className="flex items-center space-x-2">
                          <Globe className="w-4 h-4" />
                          <span>Nationality</span>
                        </Label>
                        <Input
                          id="nationality"
                          value={isEditing ? (editData.nationality || '') : (student?.nationality || '')}
                          onChange={(e) => setEditData({ ...editData, nationality: e.target.value })}
                          disabled={!isEditing}
                          className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Information Section */}
                <CollapsibleCard
                  persistKey={`student-details:${authUser?.id || 'anon'}:academic-information`}
                  header={
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <span>Academic Information</span>
                    </CardTitle>
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {/* Target Country */}
                    <div className="space-y-2">
                      <Label htmlFor="targetCountry" className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Target Country</span>
                      </Label>
                      <Input
                        id="targetCountry"
                        value={isEditing ? (editData.targetCountry || '') : (student?.targetCountry || '')}
                        onChange={(e) => setEditData({ ...editData, targetCountry: e.target.value })}
                        disabled={!isEditing}
                        className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Target Program */}
                    <div className="space-y-2">
                      <Label htmlFor="targetProgram" className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Target Program</span>
                      </Label>
                      <Input
                        id="targetProgram"
                        value={isEditing ? (editData.targetProgram || '') : (student?.targetProgram || '')}
                        onChange={(e) => setEditData({ ...editData, targetProgram: e.target.value })}
                        disabled={!isEditing}
                        className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Academic Background */}
                    <div className="space-y-2">
                      <Label htmlFor="academicBackground" className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>Academic Background</span>
                      </Label>
                      <Input
                        id="academicBackground"
                        value={isEditing ? (editData.academicBackground || '') : (student?.academicBackground || '')}
                        onChange={(e) => setEditData({ ...editData, academicBackground: e.target.value })}
                        disabled={!isEditing}
                        className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* English Proficiency */}
                    <div className="space-y-2">
                      <Label htmlFor="englishProficiency" className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>English Proficiency</span>
                      </Label>
                      <Input
                        id="englishProficiency"
                        value={isEditing ? (editData.englishProficiency || '') : (student?.englishProficiency || '')}
                        onChange={(e) => setEditData({ ...editData, englishProficiency: e.target.value })}
                        disabled={!isEditing}
                        className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Budget */}
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span>Budget</span>
                      </Label>
                      <Input
                        id="budget"
                        value={isEditing ? (editData.budget || '') : (student?.budget || '')}
                        onChange={(e) => setEditData({ ...editData, budget: e.target.value })}
                        disabled={!isEditing}
                        className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2 md:col-span-2 lg:col-span-3">
                      <Label htmlFor="notes" className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Notes</span>
                      </Label>
                      <Textarea
                        id="notes"
                        value={isEditing ? (editData.notes || '') : (student?.notes || '')}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                        className="text-xs transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </CollapsibleCard>

                {/* Applications Section */}
                <CollapsibleCard
                  persistKey={`student-details:${authUser?.id || 'anon'}:applications`}
                  header={
                    <CardTitle className="text-sm flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span>Applications ({applications?.length || 0})</span>
                      </div>
                      <Button
                        variant="outline"
                        size="xs"
                        className="rounded-full px-2 [&_svg]:size-3"
                        onClick={() => setIsAddApplicationOpen(true)}
                        title="Add Application"
                      >
                        <Plus />
                        <span className="hidden lg:inline">Add</span>
                      </Button>
                    </CardTitle>
                  }
                >
                  {applications && applications.length > 0 ? (
                    <div className="space-y-3">
                      {applications.map((application) => (
                        <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{application.university}</h3>
                              <p className="text-sm text-gray-600">{application.program}</p>
                            </div>
                            <Badge variant={application.appStatus === 'Closed' ? 'default' : 'secondary'}>
                              {application.appStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No applications yet</p>
                  )}
                </CollapsibleCard>

                {/* Admissions Section */}
                <CollapsibleCard
                  persistKey={`student-details:${authUser?.id || 'anon'}:admissions`}
                  header={
                    <CardTitle className="text-sm flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-primary" />
                        <span>Admissions ({admissions?.length || 0})</span>
                      </div>
                      <Button
                        variant="outline"
                        size="xs"
                        className="rounded-full px-2 [&_svg]:size-3"
                        onClick={() => setIsAddAdmissionOpen(true)}
                        title="Add Admission"
                      >
                        <Plus />
                        <span className="hidden lg:inline">Add</span>
                      </Button>
                    </CardTitle>
                  }
                >
                  {admissions && admissions.length > 0 ? (
                    <div className="space-y-3">
                      {admissions.map((admission) => (
                        <div key={admission.id} className="border rounded-lg p-4 hover:bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{admission.program}</h3>
                              <p className="text-sm text-gray-600">Decision: {admission.decisionDate}</p>
                            </div>
                            <Badge variant="default">
                              {admission.visaStatus || 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No admissions yet</p>
                  )}
                </CollapsibleCard>
              </div>

              {/* Activity Sidebar */}
              <div className="basis-[35%] max-w-[35%] flex-shrink-0 bg-white rounded-lg p-3 flex flex-col h-full min-h-0 border-l border-gray-200">
                <h3 className="text-sm font-semibold mb-2 flex items-center border-b border-gray-200 pb-2">
                  <Calendar className="w-5 h-5 mr-2" />
                  Activity Timeline
                </h3>

                {isLoading ? (
                  <div className="space-y-4 flex-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <ActivityTracker
                      entityType="student"
                      entityId={student.id}
                      entityName={student.name}
                      canAdd={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Application Modal */}
      <AddApplicationModal
        open={isAddApplicationOpen}
        onOpenChange={setIsAddApplicationOpen}
        studentId={student.id}
      />

      {/* Add Admission Modal */}
      <AddAdmissionModal
        open={isAddAdmissionOpen}
        onOpenChange={setIsAddAdmissionOpen}
        studentId={student.id}
      />
    </>
  );
}
