import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ActivityTracker } from './activity-tracker';
import { AddApplicationModal } from './add-application-modal';
import { AddAdmissionModal } from './add-admission-modal';
import { type Student, type Application, type Admission } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User, Edit, Save, X, Plus, FileText, Award, Calendar, Phone, Mail } from 'lucide-react';

interface StudentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number | null;
}

export function StudentProfileModal({ open, onOpenChange, studentId }: StudentProfileModalProps) {
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
    mutationFn: async (data: Partial<Student>) => {
      const response = await apiRequest('PUT', `/api/students/${student?.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student');
      }
      return response.json();
    },
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
        <DialogContent>
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
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
                  Add Application
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setIsAddAdmissionOpen(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Admission
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
          </div>

          <div className="flex h-[90vh]">
            {/* Main Content - Left Side */}
            <div className="flex-1 overflow-y-auto p-6 pt-28">
              <div className="space-y-6">
                {/* Student Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Student Information</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                          value={editData.dateOfBirth || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={editData.notes || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                          disabled={!isEditing}
                          rows={3}
                        />
                      </div>
                    </div>
                    {isEditing && (
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveChanges}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Applications Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Applications ({applications?.length || 0})
                      </h2>
                      <Button 
                        size="sm" 
                        onClick={() => setIsAddApplicationOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Application
                      </Button>
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
                              <Badge variant={application.status === 'accepted' ? 'default' : 'secondary'}>
                                {application.status}
                              </Badge>
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
                      <h2 className="text-lg font-semibold flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Admissions ({admissions?.length || 0})
                      </h2>
                      <Button 
                        size="sm" 
                        onClick={() => setIsAddAdmissionOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Admission
                      </Button>
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
                  </CardContent>
                </Card>
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