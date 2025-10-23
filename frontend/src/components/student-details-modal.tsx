import { useEffect, useMemo, useState } from 'react';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
console.log('[modal] loaded: frontend/src/components/student-details-modal.tsx');
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityTracker } from './activity-tracker';
import { CollapsibleCard } from '@/components/collapsible-card';
import { type Student, type User } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import * as StudentsService from '@/services/students';
import * as ActivitiesService from '@/services/activities';
import * as UsersService from '@/services/users';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Edit, Save, X, Plus, Mail, Phone, Calendar as CalendarIcon, MapPin, Award, BookOpen, Globe } from 'lucide-react';

interface StudentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onStudentUpdate?: (updated: Student) => void;
}

export function StudentDetailsModal({ open, onOpenChange, student, onStudentUpdate }: StudentDetailsModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Student>>({});
  const [currentStatus, setCurrentStatus] = useState('');

  useEffect(() => {
    if (student) {
      setEditData(student);
      setCurrentStatus(student.status || 'active');
    }
  }, [student]);

  const updateStudentMutation = useMutation({
    mutationFn: async (data: Partial<Student>) => StudentsService.updateStudent(student?.id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsEditing(false);
      setCurrentStatus(updated.status);
      onStudentUpdate?.(updated as Student);
      toast({ title: 'Success', description: 'Student updated successfully.' });
    },
    onError: (error: any) => {
      console.error('Update student error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update student. Please try again.', variant: 'destructive' });
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
  });

  // Hardcoded dropdowns are used; no API fetch needed
  const dropdownData = {};

  const getStatusDisplayName = (statusId: string) => {
    const list: any[] = (dropdownData as any)?.Status || [];
    const byId = list.find((o: any) => o.id === statusId);
    if (byId?.value) return byId.value;
    const byKey = list.find((o: any) => o.key === statusId);
    if (byKey?.value) return byKey.value;
    const byValue = list.find((o: any) => o.value === statusId);
    if (byValue?.value) return byValue.value;
    // fallback for known statuses
    const label = statusId?.charAt(0)?.toUpperCase() + statusId?.slice(1);
    return label || 'Status';
  };

  const statusSequence = useMemo<string[]>(() => {
    const list: any[] = (dropdownData as any)?.Status || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((o: any) => o.key || o.id || o.value).filter(Boolean);
    }
    return ['active','applied','admitted','enrolled','inactive'];
  }, [dropdownData]);

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => StudentsService.updateStudent(student?.id, { status }),
    onSuccess: async (updated, _variables, _context) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['/api/students'] });
        setCurrentStatus(updated.status);
        onStudentUpdate?.(updated as Student);
        toast({ title: 'Status updated', description: `Student status set to ${getStatusDisplayName(updated.status)}` });
      } catch (err) {
        console.error('Error handling status update success:', err);
      }
    },
    onError: (error: any) => {
      setCurrentStatus(student?.status || 'active');
      toast({ title: 'Error', description: error.message || 'Failed to update student status.', variant: 'destructive' });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    statusUpdateMutation.mutate(newStatus);
  };

  if (!student) return null;

  const handleSaveChanges = () => {
    if (!editData.name || !editData.email) {
      toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    updateStudentMutation.mutate({ ...editData });
  };

  return (
    <DetailsDialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Student Details"
      headerLeft={(
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold truncate">{student.name}</h1>
        </div>
      )}
      headerRight={(
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
              <Button variant="outline" size="xs" className="rounded-full px-2 [&_svg]:size-3" onClick={() => {
                try {
                  const { useModalManager } = require('@/contexts/ModalManagerContext');
                  const { openModal } = useModalManager();
                  openModal(() => setLocation(`/applications/add?studentId=${student.id}`));
                } catch {
                  setLocation(`/applications/add?studentId=${student.id}`);
                }
              }} title="Add Application">
                <Plus />
                <span className="hidden lg:inline">Add App</span>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )}
      statusBar={statusSequence.length > 0 ? (
        <div className="w-full bg-gray-100 rounded-md p-1.5">
          <div className="flex items-center justify-between relative">
            {statusSequence.map((statusId, index) => {
              const currentIndex = statusSequence.indexOf(currentStatus);
              const isCompleted = index <= currentIndex;
              const statusName = getStatusDisplayName(statusId);
              const handleClick = () => {
                if (statusUpdateMutation.isPending) return;
                if (currentStatus === statusId) return;
                statusUpdateMutation.mutate(statusId);
              };
              return (
                <div key={statusId} className="flex flex-col items-center relative flex-1 cursor-pointer select-none" onClick={handleClick} role="button" aria-label={`Set status to ${statusName}`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isCompleted ? 'bg-blue-600 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'}`}>
                    {isCompleted ? <div className="w-1.5 h-1.5 bg-white rounded-full" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                  </div>
                  <span className={`mt-1 text-xs font-medium text-center ${isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>{statusName}</span>
                  {index < statusSequence.length - 1 && (
                    <div className={`absolute top-2.5 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${index < currentIndex ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : undefined}
      leftContent={(
        <>
          <Card className="w-full shadow-md border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Full Name</span></Label>
                  <Input id="name" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} disabled={!isEditing || updateStudentMutation.isPending} className="h-8 text-xs shadow-sm border border-gray-300 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2"><Mail className="w-4 h-4" /><span>Email Address</span></Label>
                  <Input id="email" type="email" value={editData.email || ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} disabled={!isEditing || updateStudentMutation.isPending} className="h-8 text-xs shadow-sm border border-gray-300 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center space-x-2"><Phone className="w-4 h-4" /><span>Phone Number</span></Label>
                  <div className="relative">
                    <PhoneInput
                      value={String(editData.phone || student.phone || '')}
                      onChange={(val) => setEditData({ ...editData, phone: val })}
                      defaultCountry="in"
                      className="w-full"
                      inputClassName="w-full h-7 text-sm"
                      buttonClassName="h-7"
                      disabled={!isEditing || updateStudentMutation.isPending}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="flex items-center space-x-2"><CalendarIcon className="w-4 h-4" /><span>Date of Birth</span></Label>
                  <Input id="dateOfBirth" type="date" value={(editData.dateOfBirth as any) || ''} onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })} disabled={!isEditing || updateStudentMutation.isPending} className="h-8 text-xs shadow-sm border border-gray-300 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2"><span>Counsellor</span></Label>
                  <Select value={editData.counselorId || ''} onValueChange={(value) => setEditData({ ...editData, counselorId: value })} disabled={!isEditing || updateStudentMutation.isPending}>
                    <SelectTrigger className="h-8 text-xs shadow-sm border border-gray-300 bg-white"><SelectValue placeholder="Select counsellor" /></SelectTrigger>
                    <SelectContent>
                      {(users as any[]).map((u: User) => (
                        <SelectItem key={u.id} value={u.id}>{(u.firstName || '') + ' ' + (u.lastName || '')} ({u.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <CollapsibleCard persistKey={`student-details:modal:${student.id}:student-information`} header={<CardTitle className="text-sm flex items-center space-x-2"><Award className="w-5 h-5 text-primary" /><span>Student Information</span></CardTitle>} cardClassName="shadow-md border border-gray-200 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2"><Globe className="w-4 h-4" /><span>Target Country</span></Label>
                <Input value={(editData.targetCountry as any) || ''} onChange={(e) => setEditData({ ...editData, targetCountry: e.target.value })} disabled={!isEditing || updateStudentMutation.isPending} className="h-8 text-xs shadow-sm border border-gray-300 bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Target Program</span></Label>
                <Input value={(editData.targetProgram as any) || ''} onChange={(e) => setEditData({ ...editData, targetProgram: e.target.value })} disabled={!isEditing || updateStudentMutation.isPending} className="h-8 text-xs shadow-sm border border-gray-300 bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Address</span></Label>
                <Input value={(editData.address as any) || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} disabled={!isEditing || updateStudentMutation.isPending} className="h-8 text-xs shadow-sm border border-gray-300 bg-white" />
              </div>
            </div>
          </CollapsibleCard>
        </>
      )}
      rightContent={(
        <div className="pt-2">
          <ActivityTracker entityType="student" entityId={student.id} entityName={student.name} />
        </div>
      )}
      rightWidthClassName="w-[420px]"
    />
  );
}
