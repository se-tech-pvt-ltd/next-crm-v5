import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
console.log('[modal] loaded: frontend/src/components/student-profile-modal-new.tsx');
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleCard } from './collapsible-card';
import { Input } from '@/components/ui/input';
import { DobPicker } from '@/components/ui/dob-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelectV4 as MultiSelect } from '@/components/ui/multi-select-v4';
import { ActivityTracker } from './activity-tracker';
import { ApplicationDetailsModal } from '@/components/application-details-modal-new';
import { type Student, type Application } from '@/lib/types';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import * as StudentsService from '@/services/students';
import * as DropdownsService from '@/services/dropdowns';
import * as UsersService from '@/services/users';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
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
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  BookOpen,
  Target,
  Users,
  User as UserIcon,
  Globe
} from 'lucide-react';

interface StudentProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
  onOpenApplication?: (app: Application) => void;
  onOpenAddApplication?: (studentId?: string | null) => void;
  startInEdit?: boolean;
}

type StudentEditState = Partial<Student> & { targetCountry?: string[] | string | null };

export function StudentProfileModal({ open, onOpenChange, studentId, onOpenApplication, onOpenAddApplication, startInEdit }: StudentProfileModalProps) {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<StudentEditState>({});
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [location, setLocation] = useLocation();
  
  const { data: student, isLoading, isError } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: [`/api/applications/student/${studentId}`],
    enabled: !!studentId,
  });

  // If the studentId is provided but query returned no student (not found) or error, close modal and navigate back to students list
  useEffect(() => {
    if (studentId && !isLoading && (isError || !student)) {
      try { onOpenChange(false); } catch {}
      try { setLocation('/students'); } catch (e) { console.error('redirect to /students failed', e); }
    }
  }, [studentId, isLoading, isError, student, setLocation, onOpenChange]);


  // On mount, ensure any other registered modals are closed so this modal appears on top
  useEffect(() => {
    try {
      const { useModalManager } = require('@/contexts/ModalManagerContext');
      const { openModal } = useModalManager();
      // openModal closes all registered modals before running provided fn
      openModal(() => {});
    } catch (e) {
      // ignore if modal manager not available
    }
  }, []);

  // Get dropdown data for Students module
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/students'],
    queryFn: async () => DropdownsService.getModuleDropdowns('students'),
    enabled: open,
  });
  // Fallback to Leads module for target country options if needed
  const { data: leadsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Leads'),
    enabled: open,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    enabled: open,
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: async () => RegionsService.listRegions(),
    enabled: open,
    staleTime: 60_000,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: async () => BranchesService.listBranches(),
    enabled: open,
    staleTime: 60_000,
  });

  // Helpers to resolve dropdown-backed labels (case-insensitive field keys)
  const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const getFieldOptions = (fieldName: string): any[] => {
    const data = dropdownData as any;
    const leadsData = leadsDropdowns as any;
    const target = normalize(fieldName);
    const candidates = [target];
    if (target === 'englishproficiency') {
      candidates.push('elttest', 'elt', 'englishtest', 'english');
    }
    if (target === 'targetcountry') {
      candidates.push('targetcountry', 'interestedcountry', 'country');
    }
    const findIn = (obj: any) => {
      if (!obj || typeof obj !== 'object') return [] as any[];
      const entry = Object.entries(obj).find(([k]) => candidates.includes(normalize(String(k))));
      return (entry?.[1] as any[]) || [];
    };
    const opts = findIn(data);
    if (opts.length > 0) return opts;
    return findIn(leadsData);
  };
  const getDropdownLabel = (fieldName: string, value?: string | string[] | null) => {
    if (value == null) return '';
    const options = getFieldOptions(fieldName);

    const mapOne = (v: any) => {
      const hit = options.find((opt: any) => opt.id === v || opt.key === v || opt.value === v || String(opt.id) === String(v) || String(opt.key) === String(v) || String(opt.value) === String(v));
      return hit?.value || String(v);
    };

    // If already an array, map and join
    if (Array.isArray(value)) {
      const labels = value.map(mapOne).filter(Boolean);
      return labels.join(', ');
    }

    // If string, try to parse JSON array, else CSV, else single
    const s = String(value).trim();
    if (s.startsWith('[')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map(mapOne).filter(Boolean).join(', ');
      } catch {}
    }
    if (s.includes(',')) {
      const parts = s.split(',').map(p => p.trim()).filter(Boolean);
      return parts.map(mapOne).filter(Boolean).join(', ');
    }

    return mapOne(s);
  };

  // Map a stored raw value to the selectable option value (id/key/value) for a given field
  const mapToOptionValue = (fieldName: string, raw?: string | string[] | null) => {
    if (raw == null) return '';
    const options = getFieldOptions(fieldName);
    const mapOne = (v: any) => options.find((opt: any) => opt.id === v || opt.key === v || opt.value === v || String(opt.id) === String(v) || String(opt.key) === String(v) || String(opt.value) === String(v));

    // If already array, try first matching option
    if (Array.isArray(raw)) {
      for (const v of raw) {
        const found = mapOne(v);
        if (found) return (found.key || found.id || found.value) as string;
      }
      return String(raw[0] ?? '');
    }

    const s = String(raw).trim();
    if (s.startsWith('[')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) {
          for (const v of arr) {
            const found = mapOne(v);
            if (found) return (found.key || found.id || found.value) as string;
          }
          return String(arr[0] ?? '');
        }
      } catch {}
    }
    if (s.includes(',')) {
      const parts = s.split(',').map(p => p.trim()).filter(Boolean);
      for (const v of parts) {
        const found = mapOne(v);
        if (found) return (found.key || found.id || found.value) as string;
      }
      return String(parts[0] ?? '');
    }

    const found = mapOne(s);
    return (found && (found.key || found.id || found.value)) || s;
  };

  const mapToOptionValues = (fieldName: string, raw?: string | string[] | null): string[] => {
    if (raw == null) return [];
    const options = getFieldOptions(fieldName);
    const resolveValue = (input: any) => {
      const str = String(input ?? '').trim();
      if (!str) return null;
      const hit = options.find((opt: any) => (
        opt.id === input ||
        opt.key === input ||
        opt.value === input ||
        String(opt.id) === str ||
        String(opt.key) === str ||
        String(opt.value) === str
      ));
      const candidate = hit ? (hit.key ?? hit.id ?? hit.value) : str;
      return candidate ? String(candidate) : null;
    };

    const values: string[] = [];
    const pushValue = (value: any) => {
      const mapped = resolveValue(value);
      if (mapped) values.push(mapped);
    };

    if (Array.isArray(raw)) {
      raw.forEach(pushValue);
    } else {
      const text = String(raw).trim();
      if (!text) return [];
      if (text.startsWith('[')) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            parsed.forEach(pushValue);
          } else {
            pushValue(parsed);
          }
        } catch {
          pushValue(text);
        }
      } else if (text.includes(',')) {
        text.split(',').map(part => part.trim()).filter(Boolean).forEach(pushValue);
      } else {
        pushValue(text);
      }
    }

    return Array.from(new Set(values));
  };

  const buildEditState = (base?: Student | null): StudentEditState => {
    if (!base) return {};
    return {
      ...base,
      expectation: mapToOptionValue('expectation', base.expectation),
      englishProficiency: mapToOptionValue('englishProficiency', (base as any).englishProficiency),
      targetCountry: mapToOptionValues('targetCountry', (base as any).targetCountry),
    };
  };

  useEffect(() => {
    if (student) {
      setCurrentStatus(student.status);
      if (!isEditing) {
        setEditData(buildEditState(student));
      }
    }
  }, [student, dropdownData, leadsDropdowns, isEditing]);

  useEffect(() => {
    if (open && startInEdit) {
      setIsEditing(true);
    }
  }, [open, startInEdit, studentId]);

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

  const dropdownsForStudent = () => {
    const data = dropdownData as any;
    if (data && typeof data === 'object') {
      const entry = Object.entries(data).find(([k]) => normalize(String(k)).includes('counsel'));
      return (entry?.[1] as any[]) || [];
    }
    return [] as any[];
  };

  const counselorOptions = () => {
    const opts = dropdownsForStudent();
    if (opts.length > 0) return opts.map((o: any) => ({ id: o.key || o.id || o.value, value: o.value }));
    return (users as User[]).map((u) => ({ id: u.id, value: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User' }));
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
      try { setLocation(`/students/${student?.id}`); } catch {}
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student.",
        variant: "destructive",
      });
    },
  });

  const targetCountrySelection = useMemo(() => {
    if (Array.isArray(editData.targetCountry)) {
      return editData.targetCountry;
    }
    return mapToOptionValues('targetCountry', editData.targetCountry ?? null);
  }, [editData.targetCountry, dropdownData, leadsDropdowns]);

  const targetCountryOptions = useMemo(() => {
    const rawOptions = getFieldOptions('targetCountry');
    const seen = new Set<string>();
    const normalized = rawOptions.reduce<{ value: string; label: string }[]>((acc, opt: any) => {
      const value = String(opt.key ?? opt.id ?? opt.value ?? '').trim();
      if (!value || seen.has(value)) return acc;
      seen.add(value);
      const label = String(opt.value ?? opt.label ?? value);
      acc.push({ value, label });
      return acc;
    }, []);
    if (normalized.length === 0 && targetCountrySelection.length > 0) {
      targetCountrySelection.forEach((value) => {
        if (!seen.has(value)) {
          seen.add(value);
          normalized.push({ value, label: value });
        }
      });
    }
    return normalized;
  }, [dropdownData, leadsDropdowns, targetCountrySelection]);

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
    const tc = editData.targetCountry;
    const normalizedTargetCountry = Array.isArray(tc)
      ? (() => {
          const cleaned = tc.map((item) => String(item).trim()).filter(Boolean);
          return cleaned.length > 0 ? JSON.stringify(cleaned) : null;
        })()
      : (tc ?? null);

    const payload: Partial<Student> = {
      ...editData,
      targetCountry: normalizedTargetCountry,
    };

    updateStudentMutation.mutate(payload);
  };

  const StatusProgressBar = () => {
    const currentIndex = getCurrentStatusIndex();

    return (
      <div className="w-full bg-gray-100 rounded-md p-1.5">
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
              <div key={statusId} className="flex-1 flex flex-col items-center relative cursor-pointer select-none" onClick={handleClick} role="button" aria-label={`Set status to ${statusName}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                  {isCompleted ? <div className="w-1.5 h-1.5 bg-white rounded-full" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                </div>
                <span className={`mt-1 text-xs font-medium text-center ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>{statusName}</span>
                {index < statusSequence.length - 1 && (
                  <div className={`absolute top-2.5 left-1/2 w-full h-0.5 -translate-y-1/2 ${index < currentIndex ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
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
        <DialogContent hideClose className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Loading Student</DialogTitle>
          <div className="text-center py-8">
            <p>Loading student...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <>
      <DetailsDialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title="Student Profile"
        headerClassName="bg-[#223E7D] text-white"
        statusBarWrapperClassName="px-4 py-2 bg-[#223E7D] text-white -mt-px"
        headerLeft={(
          <div className="text-base sm:text-lg font-semibold leading-tight truncate max-w-[60vw]">{student?.name || 'Student'}</div>
        )}
        headerRight={(
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="xs"
                  className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                  onClick={() => {
                      if (typeof onOpenAddApplication === 'function') {
                        try { onOpenAddApplication(student?.id); } catch {}
                      }
                      try { setLocation(`/students/${student?.id}/application`); } catch {}
                      onOpenChange(false);
                    }}
                  title="Add Application"
                >
                  <Plus />
                  <span>Add Application</span>
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                  onClick={() => { setIsEditing(true); try { setLocation(`/students/${student?.id}/edit`); } catch {} }}
                  disabled={isLoading}
                  title="Edit"
                >
                  <Edit />
                  <span>Edit</span>
                </Button>
              </>
            ) : (
              <>
                <Button size="xs" onClick={handleSaveChanges} disabled={updateStudentMutation.isPending} title="Save Changes" className="bg-[#0071B0] hover:bg-[#00649D] text-white">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  <span>Save Changes</span>
                </Button>
                <Button variant="outline" size="xs" onClick={() => { setIsEditing(false); setEditData(buildEditState(student)); try { setLocation(`/students/${student?.id}`); } catch {} }} title="Cancel" className="bg-white text-[#223E7D] hover:bg-white/90 border border-white">
                  <X className="w-3.5 h-3.5 mr-1" />
                  <span>Cancel</span>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 bg-white text-[#223E7D] hover:bg-white/90" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        statusBar={statusSequence.length > 0 ? <StatusProgressBar /> : undefined}
        leftContent={(
          <>
            <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Student Information</CardTitle>
                  <div className="flex items-center space-x-2"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2"><span>Student ID</span></Label>
                    <Input value={isEditing ? (editData.student_id || '') : (student?.student_id || student?.id || 'N/A')} disabled={!isEditing} readOnly className="h-7 text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4" />
                      <span>Full Name</span>
                    </Label>
                    <Input id="name" value={isEditing ? (editData.name || '') : (student?.name || '')} onChange={(e) => setEditData({ ...editData, name: e.target.value })} disabled={!isEditing} className="h-7 text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passportNumber" className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4" />
                      <span>Passport Number</span>
                    </Label>
                    <Input id="passportNumber" value={isEditing ? (editData.passportNumber || '') : (student?.passportNumber || '')} onChange={(e) => setEditData({ ...editData, passportNumber: e.target.value })} disabled={!isEditing} className="h-7 text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </Label>
                    <Input id="email" type="email" value={isEditing ? (editData.email || '') : (student?.email || '')} onChange={(e) => setEditData({ ...editData, email: e.target.value })} disabled={!isEditing} className="h-7 text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone Number</span>
                    </Label>
                    <Input id="phone" type="tel" value={isEditing ? (editData.phone || '') : (student?.phone || '')} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} disabled={!isEditing} className="h-7 text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Date of Birth</span>
                    </Label>
                    <DobPicker id="dateOfBirth" value={isEditing ? (editData.dateOfBirth || '') : (student?.dateOfBirth || '')} onChange={(v) => setEditData({ ...editData, dateOfBirth: v })} disabled={!isEditing} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Address</span>
                    </Label>
                    <Textarea id="address" rows={3} value={isEditing ? (editData.address || '') : (student?.address || '')} onChange={(e) => setEditData({ ...editData, address: e.target.value })} disabled={!isEditing} className="text-[11px] transition-all focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <CollapsibleCard
              persistKey={`student-details:${authUser?.id || 'anon'}:student-access`}
              cardClassName="shadow-sm hover:shadow-md transition-shadow"
              header={<CardTitle className="flex items-center space-x-2"><Users className="w-4 h-4 text-primary" /><span>Student Access</span></CardTitle>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Region</span></Label>
                  <div className="text-xs px-2 py-1.5 rounded border bg-white">
                    {(() => {
                      const regionId = (student as any).regionId || (editData as any).regionId;
                      const r = Array.isArray(regions) ? (regions as any[]).find((x: any) => String(x.id) === String(regionId)) : null;
                      if (!r) return '—';
                      const regionName = (r as any).regionName || (r as any).name || (r as any).id;
                      const head = Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String((r as any).regionHeadId || '')) : null;
                      const headName = head ? ([head.firstName || head.first_name, head.lastName || head.last_name].filter(Boolean).join(' ').trim() || head.email || head.id) : '';
                      const headEmail = head?.email || '';
                      return (
                        <div>
                          <div className="font-medium text-xs">{`${regionName}${headName ? ` - Head: ${headName}` : ''}`}</div>
                          {headEmail ? <div className="text-[11px] text-muted-foreground">{headEmail}</div> : null}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Branch</span></Label>
                  <div className="text-xs px-2 py-1.5 rounded border bg-white">
                    {(() => {
                      const branchId = (student as any).branchId || (editData as any).branchId;
                      const b = Array.isArray(branches) ? (branches as any[]).find((x: any) => String(x.id) === String(branchId)) : null;
                      if (!b) return '—';
                      const branchName = (b as any).branchName || (b as any).name || (b as any).code || (b as any).id;
                      const headId = (b as any).branchHeadId || (b as any).managerId || null;
                      const head = headId && Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(headId)) : null;
                      const headName = head ? ([head.firstName || head.first_name, head.lastName || head.last_name].filter(Boolean).join(' ').trim() || head.email || head.id) : '';
                      const headEmail = head?.email || '';
                      return (
                        <div>
                          <div className="font-medium text-xs">{`${branchName}${headName ? ` - Head: ${headName}` : ''}`}</div>
                          {headEmail ? <div className="text-[11px] text-muted-foreground">{headEmail}</div> : null}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Admission Officer</span></Label>
                  <div className="text-xs px-2 py-1.5 rounded border bg-white">
                    {(() => {
                      const officerId = (student as any).admissionOfficerId || (student as any).admission_officer_id || (editData as any)?.admissionOfficerId || (editData as any)?.admission_officer_id || '';
                      const officer = officerId && Array.isArray(users)
                        ? (users as any[]).find((u: any) => String(u.id) === String(officerId))
                        : null;
                      if (!officer) return '—';
                      const fullName = [officer.firstName || officer.first_name, officer.lastName || officer.last_name].filter(Boolean).join(' ').trim();
                      const email = officer.email || '';
                      return (
                        <div>
                          <div className="font-medium text-xs">{fullName || email || officer.id}</div>
                          {email ? <div className="text-[11px] text-muted-foreground">{email}</div> : null}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Counselor</span></Label>
                  <div className="text-xs px-2 py-1.5 rounded border bg-white">
                    {(() => {
                      const cid = (student as any).counselorId || (student as any).counsellorId || (editData as any).counselorId || (editData as any).counsellorId;
                      const c = Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(cid)) : null;
                      if (!c) return '—';
                      const fullName = [c.firstName || c.first_name, c.lastName || c.last_name].filter(Boolean).join(' ').trim();
                      const email = c.email || '';
                      return (
                        <div>
                          <div className="font-medium text-xs">{fullName || email || c.id}</div>
                          {email ? <div className="text-[11px] text-muted-foreground">{email}</div> : null}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </CollapsibleCard>

            <CollapsibleCard persistKey={`student-details:${authUser?.id || 'anon'}:academic-information`} cardClassName="shadow-sm hover:shadow-md transition-shadow" header={<CardTitle className="flex items-center space-x-2"><GraduationCap className="w-4 h-4 text-primary" /><span>Academic Information</span></CardTitle>}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="englishProficiency" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>English Proficiency</span>
                  </Label>
                  {isEditing ? (
                    <Select value={editData.englishProficiency || ''} onValueChange={(v) => setEditData({ ...editData, englishProficiency: v })}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Select proficiency" /></SelectTrigger>
                      <SelectContent>
                        {getFieldOptions('englishProficiency').map((opt: any) => (
                          <SelectItem key={opt.key || opt.id || opt.value} value={(opt.key || opt.id || opt.value) as string}>
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="englishProficiency" value={getDropdownLabel('englishProficiency', student?.englishProficiency || '')} disabled readOnly className="h-7 text-[11px]" />
                  )}
                </div>


                <div className="space-y-2">
                  <Label className="flex items-center space-x-2"><span>Expectation</span></Label>
                  {isEditing ? (
                    <Select value={editData.expectation || ''} onValueChange={(v) => setEditData({ ...editData, expectation: v })}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Select expectation" /></SelectTrigger>
                      <SelectContent>
                        {getFieldOptions('expectation').map((opt: any) => (
                          <SelectItem key={opt.key || opt.id || opt.value} value={(opt.key || opt.id || opt.value) as string}>
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={getDropdownLabel('expectation', student?.expectation || '')} disabled readOnly className="h-7 text-[11px]" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2"><Globe className="w-4 h-4" /><span>Target Country</span></Label>
                  {isEditing ? (
                    <MultiSelect
                      value={targetCountrySelection}
                      onValueChange={(values) => setEditData({ ...editData, targetCountry: values })}
                      placeholder="Select countries"
                      searchPlaceholder="Search countries..."
                      options={targetCountryOptions}
                      emptyMessage="No countries found"
                      maxDisplayItems={3}
                      className="text-[11px] shadow-sm border border-gray-300 bg-white"
                      disabled={updateStudentMutation.isPending}
                    />
                  ) : (
                    <Input value={getDropdownLabel('targetCountry', (student as any)?.targetCountry || '')} disabled readOnly className="h-7 text-[11px]" />
                  )}
                </div>

                <div className="space-y-2">
                  {isEditing ? (
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-3">
                        <Checkbox checked={!!editData.consultancyFree} onCheckedChange={(v) => setEditData({ ...editData, consultancyFree: !!v })} />
                        <span className="text-sm">Consultancy Free</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox checked={!!editData.scholarship} onCheckedChange={(v) => setEditData({ ...editData, scholarship: !!v })} />
                        <span className="text-sm">Scholarship</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-[11px] text-gray-600">Consultancy Fee</div>
                        <div className="text-sm text-gray-700">{student?.consultancyFree ? 'Yes' : 'No'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-600">Scholarship</div>
                        <div className="text-sm text-gray-700">{student?.scholarship ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </CollapsibleCard>

            <CollapsibleCard
              persistKey={`student-details:${authUser?.id || 'anon'}:applications`}
              cardClassName="shadow-sm hover:shadow-md transition-shadow"
              header={
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Applications</span>
                    {Array.isArray(applications) && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">{applications.length}</Badge>
                    )}
                  </CardTitle>
                  <Button variant="outline" size="xs" className="rounded-full px-2 [&_svg]:size-3" onClick={() => { if (typeof onOpenAddApplication === 'function') { try { onOpenAddApplication(student?.id); } catch {} } try { setLocation(`/students/${student?.id}/application`); } catch {} onOpenChange(false); }}>
                    <Plus />
                    <span>Add Application</span>
                  </Button>
                </div>
              }
            >
              {(!applications || applications.length === 0) ? (
                <div className="text-xs text-gray-500">No applications yet.</div>
              ) : (
                <div className="divide-y">
                  {applications.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => { try { setLocation(`/applications/${app.id}`); } catch {} if (typeof onOpenApplication === 'function') { onOpenApplication(app); onOpenChange(false); } else { setSelectedApplication(app); try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAppDetailsOpen(true)); } catch { setIsAppDetailsOpen(true); } onOpenChange(false); } }}
                      className="w-full text-left flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{app.university} — {app.program}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {(app.country || '-')}{app.intake ? ` • ${app.intake}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{app.appStatus}</Badge>
                        {app.caseStatus && <Badge variant="secondary" className="text-[10px]">{app.caseStatus}</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CollapsibleCard>

          </>
        )}
        rightContent={(
          <div className="pt-1">
            <ActivityTracker entityType="student" entityId={student.id} entityName={student.name} />
          </div>
        )}
        rightWidthClassName="w-[420px]"
      />


      <ApplicationDetailsModal
        open={isAppDetailsOpen}
        onOpenChange={(open) => {
          setIsAppDetailsOpen(open);
          if (!open) {
            setSelectedApplication(null);
            try {
              if (location && location.startsWith('/applications/')) {
                setLocation(`/students/${student?.id}`);
              }
            } catch (e) {}
          }
        }}
        application={selectedApplication}
      />

    </>
  );
}
