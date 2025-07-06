import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student, Application, Admission } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  FileText, 
  GraduationCap, 
  Trophy,
  DollarSign,
  Edit,
  Plus
} from 'lucide-react';
import { useState } from 'react';
import { AddApplicationModal } from './add-application-modal';

interface StudentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number | null;
}

export function StudentProfileModal({ open, onOpenChange, studentId }: StudentProfileModalProps) {
  const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: student } = useQuery<Student>({
    queryKey: ['/api/students', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const response = await fetch(`/api/students/${studentId}`);
      return response.json();
    },
    enabled: !!studentId,
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ['/api/applications', 'student', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await fetch(`/api/applications/student/${studentId}`);
      return response.json();
    },
    enabled: !!studentId,
  });

  const { data: admissions } = useQuery<Admission[]>({
    queryKey: ['/api/admissions', 'student', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await fetch(`/api/admissions/student/${studentId}`);
      return response.json();
    },
    enabled: !!studentId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!studentId) return;
      const response = await apiRequest('PUT', `/api/students/${studentId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId] });
      toast({
        title: "Success",
        description: "Student status updated successfully.",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'admitted':
        return 'bg-purple-100 text-purple-800';
      case 'enrolled':
        return 'bg-emerald-100 text-emerald-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (!student) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{student.name} - Student Profile</DialogTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(student.status || 'active')}>
                  {student.status || 'active'}
                </Badge>
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="applications">Applications ({applications?.length || 0})</TabsTrigger>
              <TabsTrigger value="admissions">Admissions ({admissions?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Personal Information
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
                        <span className="text-sm">{student.dateOfBirth}</span>
                      </div>
                    )}
                    {student.nationality && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{student.nationality}</span>
                      </div>
                    )}
                    {student.passportNumber && (
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-500" />
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
                        <label className="text-sm font-medium text-gray-500">Target Country</label>
                        <p className="text-sm">{student.targetCountry}</p>
                      </div>
                    )}
                    {student.targetProgram && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Target Program</label>
                        <p className="text-sm">{student.targetProgram}</p>
                      </div>
                    )}
                    {student.englishProficiency && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">English Proficiency</label>
                        <p className="text-sm">{student.englishProficiency}</p>
                      </div>
                    )}
                    {student.budget && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Budget</label>
                        <p className="text-sm">{student.budget}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

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

              {/* Notes */}
              {student.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{student.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="flex space-x-2">
                <Button onClick={() => updateStatusMutation.mutate('active')} disabled={updateStatusMutation.isPending}>
                  Mark Active
                </Button>
                <Button onClick={() => updateStatusMutation.mutate('applied')} disabled={updateStatusMutation.isPending}>
                  Mark Applied
                </Button>
                <Button onClick={() => updateStatusMutation.mutate('admitted')} disabled={updateStatusMutation.isPending}>
                  Mark Admitted
                </Button>
                <Button onClick={() => setIsAddApplicationOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Application
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Applications</h3>
                <Button onClick={() => setIsAddApplicationOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Application
                </Button>
              </div>
              
              {applications?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Create the first application for this student.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {applications?.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{application.university}</h4>
                            <p className="text-sm text-gray-600">{application.program}</p>
                            <p className="text-xs text-gray-500">
                              {application.intakeSemester} {application.intakeYear}
                            </p>
                          </div>
                          <Badge className={`${
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
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
              <h3 className="text-lg font-medium">Admissions</h3>
              
              {admissions?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No admissions yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Admission records will appear here when universities make decisions.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {admissions?.map((admission) => (
                    <Card key={admission.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{admission.university}</h4>
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
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AddApplicationModal 
        open={isAddApplicationOpen}
        onOpenChange={setIsAddApplicationOpen}
        studentId={studentId || undefined}
      />
    </>
  );
}