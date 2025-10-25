import { useEffect, useMemo, useState } from 'react';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
console.log('[modal] loaded: frontend/src/components/student-details-modal.tsx');
import * as DropdownsService from '@/services/dropdowns';
import { STATUS_OPTIONS as STUDENT_STATUS_OPTIONS, EXPECTATION_OPTIONS as STUDENT_EXPECTATION_OPTIONS, ELT_TEST_OPTIONS as STUDENT_ELT_TEST_OPTIONS } from '@/constants/students-dropdowns';
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

  const dropdownData = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    const toItems = (opts: { value: string; label: string }[]) => (opts || []).map(o => ({ key: o.value, value: o.label }));
    map['Status'] = toItems(STUDENT_STATUS_OPTIONS);
    map['status'] = map['Status'];
    map['Expectation'] = toItems(STUDENT_EXPECTATION_OPTIONS);
    map['expectation'] = map['Expectation'];
    map['ELT Test'] = toItems(STUDENT_ELT_TEST_OPTIONS);
    map['ELTTest'] = map['ELT Test'];
    map['ELT_Test'] = map['ELT Test'];
    return map;
  }, []);

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
                  <Label htmlFor="phone" className="flex items-center space-x-2">
                    {!isEditing && String(editData.phone || student.phone || '').trim() !== '' ? (
                      <a
                        href={(() => {
                          try {
                            const raw = String(editData.phone || student.phone || '');
                            const digits = raw.replace(/[^0-9+]/g, '');
                            const cleaned = digits.replace(/^\+/, '');
                            return `https://web.whatsapp.com/send?phone=${encodeURIComponent(cleaned)}`;
                          } catch (e) { return '#'; }
                        })()}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center justify-center h-4 w-4 text-black"
                        title="Open WhatsApp chat"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                          <path d="M20.52 3.48A11.9 11.9 0 0012 1C6 1 1 5.92 1 12c0 2.11.55 4.09 1.6 5.86L1 23l5.42-1.42A11.94 11.94 0 0012 23c6 0 11-4.92 11-11 0-1.97-.54-3.81-1.48-5.52zM12 21c-1.9 0-3.74-.5-5.32-1.44l-.38-.23-3.22.84.86-3.14-.25-.4A9 9 0 113 12a8.93 8.93 0 0115.47-5.99A8.93 8.93 0 0121 12c0 4.97-4.03 9-9 9zm4.03-6.9c-.22-.11-1.3-.64-1.5-.71-.2-.07-.35-.11-.5.11-.15.23-.6.71-.73.86-.13.14-.26.16-.48.05-.22-.11-.93-.34-1.77-1.09-.65-.58-1.09-1.29-1.22-1.51-.13-.22-.01-.34.09-.45.09-.09.2-.22.3-.33.1-.11.13-.19.2-.32.07-.13.03-.24-.02-.35-.05-.11-.5-1.2-.68-1.64-.18-.43-.36-.37-.5-.37-.13 0-.28 0-.43 0-.15 0-.39.06-.59.28-.2.22-.78.76-.78 1.86s.8 2.16.91 2.31c.11.15 1.57 2.4 3.8 3.36 2.22.95 2.22.63 2.62.59.4-.04 1.3-.53 1.48-1.04.18-.51.18-.95.13-1.04-.05-.09-.18-.14-.4-.25z" />
                        </svg>
                      </a>
                    ) : (
                      <Phone className="w-4 h-4 text-gray-400" />
                    )}
                    <span>Phone Number</span>
                  </Label>
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
