import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Student, Application, Admission } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ActivityTracker } from './activity-tracker';
import { format } from 'date-fns';
import { 
  User, 
  Edit, 
  Plus,
  Save,
  X,
  FileText,
  Award
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
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

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: [`/api/applications/student/${studentId}`],
    enabled: !!studentId,
  });

  const { data: admissions = [] } = useQuery<Admission[]>({
    queryKey: [`/api/admissions/student/${studentId}`],
    enabled: !!studentId,
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (data: Partial<Student>) => {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Student profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update student profile",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    updateStudentMutation.mutate({ status: newStatus });
  };

  const handleSaveProfile = () => {
    updateStudentMutation.mutate(editData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  useEffect(() => {
    if (student) {
      setCurrentStatus(student.status || '');
      setEditData(student);
    }
  }, [student]);

  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  if (isLoading) {
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

  if (!student) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
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
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Student Profile</DialogTitle>
          
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-white border-b p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{student.name}</h1>
                  <h2 className="text-sm text-gray-600">{student.email}</h2>
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

          <div className="flex h-[90vh] pt-20">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mx-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="applications">Applications ({applications?.length || 0})</TabsTrigger>
                <TabsTrigger value="admissions">Admissions ({admissions?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <div className="flex h-[75vh]">
                  {/* Left Column - Student Information */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          <h2 className="text-lg font-semibold flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Student Information
                          </h2>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={editData.name || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              value={editData.email || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={editData.phone || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input
                              id="dateOfBirth"
                              type="date"
                              value={editData.dateOfBirth ? editData.dateOfBirth.toString().split('T')[0] : ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
              </TabsContent>

              <TabsContent value="applications" className="space-y-4">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Applications ({applications?.length || 0})
                    </h2>
                  </div>
                  {applications?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No applications yet</p>
                  ) : (
                    <div className="space-y-3">
                      {applications?.map((application) => (
                        <Card 
                          key={application.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsApplicationDetailsOpen(true);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{application.university}</h4>
                                <p className="text-sm text-gray-600">{application.program}</p>
                                <Badge 
                                  variant={application.status === 'accepted' ? 'default' : 'secondary'}
                                  className="mt-2"
                                >
                                  {application.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="admissions" className="space-y-4">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Admissions ({admissions?.length || 0})
                    </h2>
                  </div>
                  {admissions?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No admissions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {admissions?.map((admission) => (
                        <Card 
                          key={admission.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedAdmission(admission);
                            setIsAdmissionDetailsOpen(true);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{admission.university}</h4>
                                <p className="text-sm text-gray-600">{admission.program}</p>
                                <Badge 
                                  variant={admission.decision === 'accepted' ? 'default' : 'secondary'}
                                  className="mt-2"
                                >
                                  {admission.decision}
                                </Badge>
                                {admission.decisionDate && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Decision: {formatDate(admission.decisionDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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