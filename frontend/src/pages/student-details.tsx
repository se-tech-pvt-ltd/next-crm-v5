import { useRoute, useLocation } from 'wouter';
import { useRoute, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleCard } from '@/components/collapsible-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivityTracker } from '@/components/activity-tracker';
import { AddApplicationModal } from '@/components/add-application-modal';
import { AddAdmissionModal } from '@/components/add-admission-modal';
import { Layout } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { type Student, type User, type Application } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User as UserIcon, Edit, Save, X, Plus, Mail, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function StudentDetails() {
  const [match, params] = useRoute('/students/:id');
  const { user: authUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Student>>({});
  const [currentStatus, setCurrentStatus] = useState('');
  const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false);
  const [isAddAdmissionOpen, setIsAddAdmissionOpen] = useState(false);

  const { data: student, isLoading, error } = useQuery<Student>({
    queryKey: ['/api/students', params?.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/students/${params?.id}`);
      return res.json();
    },
    enabled: !!params?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: applications, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: [`/api/applications/student/${params?.id}`],
    enabled: !!params?.id,
  });

  useEffect(() => {
    if (student) {
      setEditData(student);
      setCurrentStatus(student.status || 'active');
    }
  }, [student]);

  const mapStatusDbToUi = (s?: string | null) => {
    if (!s) return 'Open';
    if (s.toLowerCase() === 'active') return 'Open';
    if (s.toLowerCase() === 'inactive' || s.toLowerCase() === 'closed') return 'Closed';
    if (s.toLowerCase() === 'enrolled') return 'Enrolled';
    return s;
  };
  const mapStatusUiToDb = (s?: string | null) => {
    if (!s) return undefined;
    if (s === 'Open') return 'active';
    if (s === 'Closed') return 'inactive';
    if (s === 'Enrolled') return 'enrolled';
    return String(s).toLowerCase();
  };
  const boolToUi = (b?: boolean | null) => (b ? 'Yes' : 'No');
  const uiToBool = (s: string) => ['yes', 'true', '1', 'on'].includes(String(s).toLowerCase());
  const getCounselorName = (id?: string | null) => {
    const list = (users as any[]) || [];
    const u = list.find((u: User) => u.id === id);
    return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : 'Unassigned';
  };

  const updateStudentMutation = useMutation({
    mutationFn: async (data: Partial<Student>) => {
      const response = await apiRequest('PUT', `/api/students/${student?.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student');
      }
      return response.json();
    },
    onSuccess: (updated) => {
      toast({ title: 'Success', description: 'Student updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.setQueryData(['/api/students', params?.id], updated);
      setCurrentStatus(updated.status);
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to update student.', variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (uiStatus: string) => {
      const response = await apiRequest('PUT', `/api/students/${student?.id}`, { status: mapStatusUiToDb(uiStatus) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: (updated) => {
      setCurrentStatus(updated.status);
      queryClient.setQueryData(['/api/students', params?.id], updated);
      toast({ title: 'Status updated', description: `Student status set to ${mapStatusDbToUi(updated.status)}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to update status', variant: 'destructive' });
    },
  });

  const handleSaveChanges = () => {
    const payload: any = { ...editData };
    if (payload.status) payload.status = mapStatusUiToDb(payload.status as any);
    updateStudentMutation.mutate(payload);
  };

  if (!match) {
    return <div>Student not found</div>;
  }

  if (error) {
    return (
      <Layout title="Student Details">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error Loading Student</h3>
              <p className="text-sm text-gray-600 mt-2">
                {error instanceof Error ? error.message : 'Failed to load student details'}
              </p>
              <Button
                onClick={() => setLocation('/students')}
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Students
              </Button>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout
      title={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/students')}
          className="p-1 h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      }
      subtitle={undefined}
      helpText="View and manage student details."
    >
      <div className="text-xs md:text-[12px]">
        {!isLoading && (
          <div className="w-full bg-gray-100 rounded-md p-1.5 mb-3">
            <div className="flex items-center justify-between relative">
              {(['Open','Closed','Enrolled'] as const).map((label, index, arr) => {
                const currentLabel = mapStatusDbToUi(currentStatus || student?.status);
                const currentIndex = arr.indexOf(currentLabel as any);
                const isActive = label === currentLabel;
                const isCompleted = currentIndex >= 0 && index <= currentIndex;

                const handleClick = () => {
                  if (updateStatusMutation.isPending) return;
                  if (isActive) return;
                  updateStatusMutation.mutate(label);
                };

                return (
                  <div
                    key={label}
                    className="flex flex-col items-center relative flex-1 cursor-pointer select-none"
                    onClick={handleClick}
                    role="button"
                    aria-label={`Set status to ${label}`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'
                    }`}>
                      {isCompleted ? (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                      )}
                    </div>
                    <span className={`mt-1 text-xs font-medium text-center ${
                      isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                    }`}>
                      {label.toUpperCase()}
                    </span>
                    {index < arr.length - 1 && (
                      <div
                        className={`absolute top-2.5 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${
                          index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                        } ml-[0.625rem] w-[calc(100%-1.25rem)]`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex gap-0 min-h-[calc(100vh-12rem)] w-full">
          <div className="flex-1 flex flex-col space-y-4 min-w-0 w-full">
            <CollapsibleCard
              defaultOpen
              persistKey={`student-details:${authUser?.id || 'anon'}:student-information`}
              header={<CardTitle className="text-sm">Student Information</CardTitle>}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-end mb-2 space-x-2">
                    {!isEditing ? (
                      <>
                        {student?.leadId && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full px-2 md:px-3 [&_svg]:size-5"
                            onClick={() => setLocation(`/leads/${student.leadId}`)}
                            disabled={isLoading}
                            title="View Lead"
                          >
                            <UserIcon />
                            <span className="hidden lg:inline">View Lead</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full px-2 md:px-3 [&_svg]:size-5"
                          onClick={() => setIsEditing(true)}
                          disabled={isLoading}
                          title="Edit"
                        >
                          <Edit />
                          <span className="hidden lg:inline">Edit</span>
                        </Button>
                      </>
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
                            if (student) setEditData(student);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Date of Birth</span>
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={isEditing ? (editData.dateOfBirth || '') : (student?.dateOfBirth || '')}
                        onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                        disabled={!isEditing}
                        className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>Passport</span>
                      </Label>
                      <Input
                        value={isEditing ? (editData.passportNumber || '') : (student?.passportNumber || '')}
                        onChange={(e) => setEditData({ ...editData, passportNumber: e.target.value })}
                        disabled={!isEditing}
                        className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>Counsellor</span>
                      </Label>
                      {isEditing ? (
                        <Select
                          value={editData.counselorId || (student?.counselorId || '')}
                          onValueChange={(v) => setEditData({ ...editData, counselorId: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select counsellor" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(users) && (users as any[]).map((u: User) => (
                              <SelectItem key={u.id} value={u.id}>
                                {(u.firstName || '') + ' ' + (u.lastName || '')} ({u.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input disabled className="h-8 text-xs" value={getCounselorName(student?.counselorId)} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </CollapsibleCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CollapsibleCard
                defaultOpen
                cardClassName="w-full lg:col-span-2"
                persistKey={`student-details:${authUser?.id || 'anon'}:others`}
                header={<CardTitle className="text-sm">Others</CardTitle>}
              >
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>ELT Test</span>
                      </Label>
                      {isEditing ? (
                        <Select
                          value={(editData.eltTest as any) || student?.eltTest || ''}
                          onValueChange={(v) => setEditData({ ...editData, eltTest: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select test" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IELTS">IELTS</SelectItem>
                            <SelectItem value="PTE">PTE</SelectItem>
                            <SelectItem value="OIDI">OIDI</SelectItem>
                            <SelectItem value="Toefl">Toefl</SelectItem>
                            <SelectItem value="Passwords">Passwords</SelectItem>
                            <SelectItem value="No Test">No Test</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input disabled className="h-8 text-xs" value={student?.eltTest || student?.englishProficiency || ''} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>Consultancy Fee</span>
                      </Label>
                      {isEditing ? (
                        <Select
                          value={boolToUi(editData.consultancyFree ?? student?.consultancyFree ?? false)}
                          onValueChange={(v) => setEditData({ ...editData, consultancyFree: uiToBool(v) })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input disabled className="h-8 text-xs" value={boolToUi(student?.consultancyFree)} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>Scholarship</span>
                      </Label>
                      {isEditing ? (
                        <Select
                          value={boolToUi(editData.scholarship ?? student?.scholarship ?? false)}
                          onValueChange={(v) => setEditData({ ...editData, scholarship: uiToBool(v) })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input disabled className="h-8 text-xs" value={boolToUi(student?.scholarship)} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>Address</span>
                      </Label>
                      <Input
                        value={isEditing ? (editData.address || '') : (student?.address || '')}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        disabled={!isEditing}
                        className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <span>Expectation</span>
                      </Label>
                      {isEditing ? (
                        <Select
                          value={(editData.expectation as any) || student?.expectation || 'High'}
                          onValueChange={(v) => setEditData({ ...editData, expectation: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select expectation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Average">Average</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input disabled className="h-8 text-xs" value={student?.expectation || 'High'} />
                      )}
                    </div>
                  </div>
                )}
              </CollapsibleCard>
            </div>

            <CollapsibleCard
              defaultOpen
              persistKey={`student-details:${authUser?.id || 'anon'}:applications`}
              header={
                <div className="w-full flex items-center justify-between">
                  <CardTitle className="text-sm">Applications ({applications?.length || 0})</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-2 md:px-3 [&_svg]:size-5"
                    onClick={() => setIsAddApplicationOpen(true)}
                    disabled={isLoading}
                    title="Add Application"
                  >
                    <Plus />
                    <span className="hidden lg:inline">Add</span>
                  </Button>
                </div>
              }
            >
              {appsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              ) : (applications && applications.length > 0) ? (
                <div className="space-y-2">
                  {applications.map((application) => (
                    <div key={application.id} className="border rounded-md p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{application.university}</div>
                          <div className="text-xs text-gray-600">{application.program}{application.degree ? ` • ${application.degree}` : ''}</div>
                        </div>
                        <Badge className="capitalize">{application.status || 'draft'}</Badge>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        <span>{application.intakeSemester || ''} {application.intakeYear || ''}</span>
                        <span className="mx-2">•</span>
                        <span>Created {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">No applications yet</div>
              )}
            </CollapsibleCard>

          </div>

          <div className="w-[30rem] flex-shrink-0 bg-gray-50 rounded-lg p-3 flex flex-col min-h-full">
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
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
                  entityId={params?.id || ''}
                  initialInfoDate={student?.createdAt as any}
                  initialInfoUserName={(function() {
                    const creatorId = (student as any)?.counselorId || null;
                    const user = (users as any[])?.find?.((u: User) => u.id === creatorId);
                    const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : null;
                    return name || undefined;
                  })()}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <AddApplicationModal open={isAddApplicationOpen} onOpenChange={setIsAddApplicationOpen} studentId={student?.id || ''} />
      <AddAdmissionModal open={isAddAdmissionOpen} onOpenChange={setIsAddAdmissionOpen} studentId={student?.id || ''} />
    </Layout>
  );
}
