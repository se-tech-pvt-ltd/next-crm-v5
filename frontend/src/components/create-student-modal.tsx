import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DobPicker } from '@/components/ui/dob-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectV4 as MultiSelect } from '@/components/ui/multi-select-v4';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { type Student } from '@/lib/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as BranchEmpsService from '@/services/branchEmps';
import { queryClient } from '@/lib/queryClient';
import * as StudentsService from '@/services/students';
import * as DropdownsService from '@/services/dropdowns';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  FileText,
  Target,
  Globe,
  Users,
  Award,
  DollarSign,
  UserPlus
} from 'lucide-react';
import React from 'react';

interface CreateStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (student: Student) => void;
}

export function CreateStudentModal({ open, onOpenChange, onSuccess }: CreateStudentModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = React.useState(false);

  // Data needed for selects
  const { data: users } = useQuery({ queryKey: ['/api/users'] });
  const { data: branchEmps = [] } = useQuery({ queryKey: ['/api/branch-emps'], queryFn: () => BranchEmpsService.listBranchEmps(), staleTime: 60_000 });
  const { data: leadDropdowns } = useQuery({ queryKey: ['/api/dropdowns/module/Leads'], queryFn: async () => DropdownsService.getModuleDropdowns('Leads') });
  const { data: studentDropdowns } = useQuery({ queryKey: ['/api/dropdowns/module/students'], queryFn: async () => DropdownsService.getModuleDropdowns('students') });

  const normalizeRole = (r?: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');

  // Without a lead context, allow choosing from all users by role
  const counsellorList = React.useMemo(() => {
    const list = Array.isArray(users) ? users.filter((u: any) => {
      const role = normalizeRole(u.role || u.role_name || u.roleName);
      return role === 'counselor' || role === 'counsellor' || role === 'admin_staff';
    }) : [];
    return list;
  }, [users]);

  const admissionOfficerList = React.useMemo(() => {
    const list = Array.isArray(users) ? users.filter((u: any) => {
      const role = normalizeRole(u.role || u.role_name || u.roleName);
      return role === 'admission_officer' || role === 'admission officer' || role === 'admissionofficer';
    }) : [];
    return list;
  }, [users]);

  const initialFormData = {
    status: '',
    expectation: '',
    name: '',
    phone: '',
    email: '',
    admissionOfficer: '',
    counsellor: '',
    passport: '',
    dateOfBirth: '',
    address: '',
    englishProficiency: '',
    targetCountries: [] as string[],
    consultancyFee: 'No',
    consultancyFeeAttachment: '',
    scholarship: 'No',
    scholarshipAttachment: '',
  };

  const [formData, setFormData] = React.useState(initialFormData);

  const handleChange = (key: keyof typeof initialFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const createStudentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const student = await StudentsService.createStudent(payload);
      return student;
    },
    onSuccess: (student: Student) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({ title: 'Success', description: 'Student created successfully.' });
      onSuccess?.(student);
      try { setLocation(`/students?studentId=${(student as any).id}`); } catch {}
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message || 'Failed to create student.', variant: 'destructive' });
    }
  });

  const handleCreate = async () => {
    // Check duplicates for email and phone
    try {
      const res = await StudentsService.getStudents();
      let list: any[] = [];
      if (Array.isArray(res)) list = res as any[];
      else if (res && typeof res === 'object') list = (res as any).data || [];

      const email = (formData.email || '').trim().toLowerCase();
      const phone = String(formData.phone || '').replace(/\D/g, '');

      if (email) {
        const found = list.find(s => s && s.email && String(s.email).trim().toLowerCase() === email);
        if (found) {
          toast({ title: 'Duplicate email', description: 'A student with this email already exists.', variant: 'destructive' });
          return;
        }
      }

      if (phone) {
        const found = list.find(s => s && s.phone && String(s.phone).replace(/\D/g, '') === phone);
        if (found) {
          toast({ title: 'Duplicate phone', description: 'A student with this phone number already exists.', variant: 'destructive' });
          return;
        }
      }

      const normalizedTargetCountry = Array.isArray(formData.targetCountries) && formData.targetCountries.length > 0
        ? JSON.stringify(formData.targetCountries.map((v) => String(v)))
        : undefined;

      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        expectation: formData.expectation || undefined,
        status: formData.status || 'active',
        targetCountry: normalizedTargetCountry,
        passportNumber: formData.passport || undefined,
        englishProficiency: formData.englishProficiency || undefined,
        counsellorId: formData.counsellor || undefined,
        counselorId: formData.counsellor || undefined,
        admissionOfficerId: formData.admissionOfficer || undefined,
        consultancyFree: formData.consultancyFee === 'Yes',
        scholarship: formData.scholarship === 'Yes',
      };

      createStudentMutation.mutate(payload);
    } catch (err: any) {
      // If fetching list fails, still attempt to create but warn
      try { createStudentMutation.mutate({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        expectation: formData.expectation || undefined,
        status: formData.status || 'active',
        targetCountry: (Array.isArray(formData.targetCountries) && formData.targetCountries.length > 0) ? JSON.stringify(formData.targetCountries.map(String)) : undefined,
        passportNumber: formData.passport || undefined,
        englishProficiency: formData.englishProficiency || undefined,
        counsellorId: formData.counsellor || undefined,
        counselorId: formData.counsellor || undefined,
        admissionOfficerId: formData.admissionOfficer || undefined,
        consultancyFree: formData.consultancyFee === 'Yes',
        scholarship: formData.scholarship === 'Yes',
      } as any); } catch {}
    }
  };

  const getList = (name: string): any[] => {
    const d = leadDropdowns as any;
    if (!d) return [];
    const key = Object.keys(d).find(k => String(k).toLowerCase().replace(/[^a-z0-9]/g, '') === String(name).toLowerCase().replace(/[^a-z0-9]/g, ''));
    return key ? (d[key] as any[]) : [];
  };

  const getStudentList = (name: string): any[] => {
    const d = studentDropdowns as any;
    if (!d) return [];
    const key = Object.keys(d).find(k => String(k).toLowerCase().replace(/[^a-z0-9]/g, '') === String(name).toLowerCase().replace(/[^a-z0-9]/g, ''));
    return key ? (d[key] as any[]) : [];
  };

  const disabled = createStudentMutation.isPending;

  return (
    <DetailsDialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Add Student"
      headerClassName="bg-[#223E7D] text-white"
      contentClassName="no-not-allowed w-[65vw] max-w-7xl max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl"
      headerLeft={(
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-semibold leading-tight truncate">Add New Student</div>
            <div className="text-xs opacity-90 truncate">Create a new student profile to begin the application process</div>
          </div>
        </div>
      )}
      headerRight={(
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-3 h-8 text-xs bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={disabled}
            className="px-3 h-8 text-xs bg-[#0071B0] hover:bg-[#00649D] text-white rounded-md"
          >
            {disabled ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <span>Save</span>
            )}
          </Button>
        </div>
      )}
      leftContent={(
        <div className="space-y-3">
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input placeholder="Enter full name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="Enter email address" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input type="tel" placeholder="Enter phone number" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1">
                <Label>Passport Number</Label>
                <Input placeholder="Enter passport number" value={formData.passport} onChange={(e) => handleChange('passport', e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <DobPicker value={formData.dateOfBirth} onChange={(v) => handleChange('dateOfBirth', v)} disabled={disabled} />
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-1">
                <Label>Address</Label>
                <Input placeholder="Enter address" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} disabled={disabled} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>English Proficiency</Label>
                <Select value={formData.englishProficiency} onValueChange={(v) => handleChange('englishProficiency', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select proficiency" /></SelectTrigger>
                  <SelectContent>
                    {(getStudentList('English Proficiency').length ? getStudentList('English Proficiency') : getStudentList('ELT Test')).map((o: any) => (
                      <SelectItem key={o.key || o.id || o.value} value={(o.key || o.id || o.value) as string}>{o.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Expectation</Label>
                <Select value={formData.expectation} onValueChange={(v) => handleChange('expectation', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select expectation" /></SelectTrigger>
                  <SelectContent>
                    {getStudentList('Expectation').map((o: any) => (<SelectItem key={o.key || o.id || o.value} value={(o.key || o.id || o.value) as string}>{o.value}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Target Country</Label>
                <MultiSelect
                  value={formData.targetCountries}
                  onValueChange={(vals) => handleChange('targetCountries', vals)}
                  placeholder="Select countries"
                  searchPlaceholder="Search countries..."
                  options={(getStudentList('Target Country').length ? getStudentList('Target Country') : getList('Interested Country')).map((o: any) => ({ value: String(o.key || o.id || o.value), label: String(o.value) }))}
                  emptyMessage="No countries found"
                  maxDisplayItems={3}
                  className="text-[11px] shadow-sm border border-gray-300 bg-white"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {getStudentList('Status').map((o: any) => (<SelectItem key={o.key || o.id || o.value} value={(o.key || o.id || o.value) as string}>{o.value}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Roles</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Counsellor</Label>
                <Select value={formData.counsellor} onValueChange={(v) => handleChange('counsellor', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select counsellor" /></SelectTrigger>
                  <SelectContent>
                    {counsellorList.map((u: any) => (<SelectItem key={u.id} value={String(u.id)}>{[u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(' ') || u.email || u.id}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Admission Officer</Label>
                <Select value={formData.admissionOfficer} onValueChange={(v) => handleChange('admissionOfficer', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select officer" /></SelectTrigger>
                  <SelectContent>
                    {admissionOfficerList.map((u: any) => (<SelectItem key={u.id} value={String(u.id)}>{[u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(' ') || u.email || u.id}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2"><Award className="w-4 h-4" /> Fees & Scholarships</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Consultancy Fee</Label>
                <Select value={formData.consultancyFee} onValueChange={(v) => handleChange('consultancyFee', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select option" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Scholarship</Label>
                <Select value={formData.scholarship} onValueChange={(v) => handleChange('scholarship', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select option" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Additional notes..." value={(formData as any).notes || ''} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value as any }))} disabled={disabled} />
            </CardContent>
          </Card>
        </div>
      )}
    />
  );
}
