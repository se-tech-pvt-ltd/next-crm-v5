import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
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
  UserIcon
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Student Profile</DialogTitle>
          
          <div className="text-xs md:text-[12px]">
            <div className="flex gap-0 min-h-[calc(90vh-2rem)] w-full">
              {/* Main Content */}
              <div className="flex-1 flex flex-col space-y-4 min-w-0 w-full p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">{student.name}</h1>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <Label htmlFor="header-status" className="text-xs text-gray-500">Status</Label>
                      <Select value={currentStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="admitted">Admitted</SelectItem>
                          <SelectItem value="enrolled">Enrolled</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setIsAddApplicationOpen(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden lg:inline">Add Application</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setIsAddAdmissionOpen(true)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden lg:inline">Add Admission</span>
                    </Button>
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
                        size="sm" 
                        onClick={() => setIsAddApplicationOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Application
                      </Button>
                    </CardTitle>
                  }
                >
                  {applications && applications.length > 0 ? (
                    <div className="space-y-3">
                      {applications.map((application) => (
                        <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
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
                        size="sm" 
                        onClick={() => setIsAddAdmissionOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Admission
                      </Button>
                    </CardTitle>
                  }
                >
                  {admissions && admissions.length > 0 ? (
                    <div className="space-y-3">
                      {admissions.map((admission) => (
                        <div key={admission.id} className="border rounded-lg p-4 hover:bg-gray-50">
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
              <div className="w-[30rem] flex-shrink-0 bg-gray-50 rounded-lg p-3 flex flex-col min-h-full">
                <h3 className="text-sm font-semibold mb-2 flex items-center">
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
                  <div className="flex-1 overflow-y-auto">
                    <ActivityTracker
                      entityType="student"
                      entityId={student.id}
                      entityName={student.name}
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
