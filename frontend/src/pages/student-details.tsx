import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ActivityTracker } from '@/components/activity-tracker';
import { AddApplicationModal } from '@/components/add-application-modal';
import { AddAdmissionModal } from '@/components/add-admission-modal';
import { Layout } from '@/components/layout';
import { type Student } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User, Edit, Save, X, Plus, Award } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StudentDetails() {
  const [match, params] = useRoute('/students/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Student>>({});
  const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false);
  const [isAddAdmissionOpen, setIsAddAdmissionOpen] = useState(false);

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: ['/api/students', params?.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/students/${params?.id}`);
      return res.json();
    },
    enabled: !!params?.id,
  });

  const { data: lead } = useQuery({
    queryKey: ['/api/leads', student?.leadId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/leads/${student?.leadId}`);
      return res.json();
    },
    enabled: !!student?.leadId,
  });

  useEffect(() => {
    if (student) {
      setEditData(student);
      setCurrentStatus(student.status || 'active');
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
      toast({ title: 'Success', description: 'Student updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/students', params?.id] });
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
      <Layout title="Student" subtitle="Loading profile">
        <div className="py-16 text-center">Loading...</div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout title="Student" subtitle="Profile not found">
        <div className="py-16 text-center">Student not found</div>
      </Layout>
    );
  }

  return (
    <Layout title="Student Details" subtitle="Profile and activity" helpText="View and manage student details.">
      <div className="flex h-[calc(100vh-140px)]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">{student.name}</h1>
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
              <Button size="sm" onClick={() => setIsAddApplicationOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add Application
              </Button>
              <Button size="sm" onClick={() => setIsAddAdmissionOpen(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4" /> Add Admission
              </Button>
              <Button variant="ghost" size="default" className="w-10 h-10 p-0 rounded-full bg-black hover:bg-gray-800 text-white ml-2" onClick={() => setLocation('/students')}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
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
                    <Input id="dateOfBirth" type="date" value={editData.dateOfBirth || ''} onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))} disabled={!isEditing} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" rows={3} value={editData.notes || ''} onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))} disabled={!isEditing} />
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
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Award className="w-5 h-5 mr-2" />Academic Information</CardTitle>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-96 bg-gradient-to-br from-green-50 to-green-100 border-l overflow-hidden">
          <div className="px-4 py-5 border-b bg-gradient-to-r from-green-600 to-green-700 text-white">
            <h2 className="text-lg font-semibold">Activity Timeline</h2>
          </div>
          <div className="overflow-y-auto h-full pt-2">
            <ActivityTracker entityType="student" entityId={student.id} entityName={student.name} />
          </div>
        </div>
      </div>

      <AddApplicationModal open={isAddApplicationOpen} onOpenChange={setIsAddApplicationOpen} studentId={student.id} />
      <AddAdmissionModal open={isAddAdmissionOpen} onOpenChange={setIsAddAdmissionOpen} studentId={student.id} />
    </Layout>
  );
}
