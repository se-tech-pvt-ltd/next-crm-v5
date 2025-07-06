import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Student, Application, Admission } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ActivityTracker } from './activity-tracker';
import { format } from 'date-fns';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  GraduationCap,
  Edit, 
  Trophy,
  DollarSign,
  Plus,
  Save,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { AddApplicationModal } from './add-application-modal';
import { ApplicationDetailsModal } from './application-details-modal';
import { AdmissionDetailsModal } from './admission-details-modal';

interface StudentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number | null;
}

export function StudentProfileModal({ open, onOpenChange, studentId }: StudentProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Student>>({});
  const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isApplicationDetailsOpen, setIsApplicationDetailsOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isAdmissionDetailsOpen, setIsAdmissionDetailsOpen] = useState(false);

  const { data: student } = useQuery<Student>({
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

  React.useEffect(() => {
    if (student) {
      setCurrentStatus(student.status);
      setEditData(student);
    }
  }, [student]);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiRequest('PUT', `/api/students/${studentId}`, { status: newStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Status Updated",
        description: "Student status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update student status.",
        variant: "destructive",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (data: Partial<Student>) => {
      const response = await apiRequest('PUT', `/api/students/${studentId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Student profile updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update student profile.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  const handleSaveProfile = () => {
    updateStudentMutation.mutate(editData);
  };

  const handleCancelEdit = () => {
    setEditData(student || {});
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Not specified';
    return format(new Date(dateString), 'PPP');
  };

  if (!student) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8">
            <p>Loading student profile...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Student Profile</DialogTitle>
          
          {/* Header with Fixed Position */}
          <div className="absolute top-0 left-0 right-0 bg-white border-b p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{student.name}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label htmlFor="header-status" className="text-xs text-gray-500">Status</label>
                  <Select
                    value={currentStatus}
                    onValueChange={handleStatusChange}
                  >
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
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Application
                </Button>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleSaveProfile} disabled={updateStudentMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
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
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <h2 className="text-lg font-semibold flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Student Information
                        </h2>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{student.phone}</span>
                        </div>
                      )}
                      {student.dateOfBirth && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Born: {formatDate(student.dateOfBirth)}</span>
                        </div>
                      )}
                      {student.nationality && (
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Nationality: {student.nationality}</span>
                        </div>
                      )}
                      {student.passportNumber && (
                        <div className="flex items-center space-x-3">
                          <GraduationCap className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Passport: {student.passportNumber}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Academic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Academic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {student.targetCountry && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Target Country</span>
                          <p className="text-sm">{student.targetCountry}</p>
                        </div>
                      )}
                      {student.targetProgram && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Target Program</span>
                          <p className="text-sm">{student.targetProgram}</p>
                        </div>
                      )}
                      {student.englishProficiency && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">English Proficiency</span>
                          <p className="text-sm">{student.englishProficiency}</p>
                        </div>
                      )}
                      {student.budget && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Budget</span>
                          <p className="text-sm font-medium text-green-600">{student.budget}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Academic Background */}
                  {student.academicBackground && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Academic Background</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{student.academicBackground}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Status & Actions */}
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Badge className={`${
                        student.status === 'active' ? 'bg-green-100 text-green-800' :
                        student.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                        student.status === 'admitted' ? 'bg-purple-100 text-purple-800' :
                        student.status === 'enrolled' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {formatDate(student.createdAt)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Updated: {formatDate(student.updatedAt)}
                      </p>
                    </div>

                  </div>


                </div>

                {/* Right Column - Activity */}
                <div className="space-y-6">
                  <ActivityTracker 
                    entityType="student" 
                    entityId={student?.id || 0} 
                    entityName={student?.name}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Applications</h3>
              </div>
              
              {applications?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Create the first application for this student.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {applications?.map((application) => (
                    <Card 
                      key={application.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedApplication(application);
                        setIsApplicationDetailsOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{application.university}</h4>
                            <p className="text-sm text-gray-600">{application.program}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Degree: {application.degree || 'Not specified'}</span>
                              <span>Intake: {application.intakeSemester} {application.intakeYear}</span>
                            </div>
                          </div>
                          <Badge className={`${
                            application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status}
                          </Badge>
                        </div>
                        {application.submissionDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted: {formatDate(application.submissionDate)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="admissions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Admissions</h3>
              </div>
              
              {admissions?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No admissions yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Admissions will appear here when applications are processed.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {admissions?.map((admission) => (
                    <Card 
                      key={admission.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedAdmission(admission);
                        setIsAdmissionDetailsOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{admission.university}</h4>
                            <p className="text-sm text-gray-600">{admission.program}</p>
                            {admission.scholarshipAmount && (
                              <div className="flex items-center text-sm text-green-600 mt-1">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {admission.scholarshipAmount}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge className={`${
                              admission.decision === 'accepted' ? 'bg-green-100 text-green-800' :
                              admission.decision === 'rejected' ? 'bg-red-100 text-red-800' :
                              admission.decision === 'waitlisted' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {admission.decision}
                            </Badge>
                            {admission.visaStatus && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Visa: {admission.visaStatus}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        {admission.decisionDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Decision: {formatDate(admission.decisionDate)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Activity Timeline */}
            <div className="w-96 bg-gradient-to-br from-green-50 to-green-100 border-l overflow-hidden">
              <div className="px-4 py-5 border-b bg-gradient-to-r from-green-600 to-green-700 text-white">
                <h2 className="text-lg font-semibold">Activity Timeline</h2>
              </div>
              <div className="overflow-y-auto h-full pt-2">
                <ActivityTracker
                  entityType="student"
                  entityId={student.id}
                  entityName={student.name}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddApplicationModal 
        open={isAddApplicationOpen}
        onOpenChange={setIsAddApplicationOpen}
        studentId={studentId || undefined}
      />

      <ApplicationDetailsModal
        open={isApplicationDetailsOpen}
        onOpenChange={setIsApplicationDetailsOpen}
        application={selectedApplication}
      />

      <AdmissionDetailsModal
        open={isAdmissionDetailsOpen}
        onOpenChange={setIsAdmissionDetailsOpen}
        admission={selectedAdmission}
      />
    </>
  );
}