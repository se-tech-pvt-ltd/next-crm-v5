import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DobPicker } from '@/components/ui/dob-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
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
    type: '',
    name: '',
    phone: '',
    email: '',
    city: '',
    source: '',
    interestedCountry: '',
    studyLevel: '',
    studyPlan: '',
    admissionOfficer: '',
    counsellor: '',
    passport: '',
    dateOfBirth: '',
    address: '',
    eltTest: '',
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
    mutationFn: async () => {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        expectation: formData.expectation || undefined,
        status: formData.status || 'active',
        targetCountry: formData.interestedCountry || undefined,
        targetProgram: formData.studyPlan || undefined,
        passportNumber: formData.passport || undefined,
        englishProficiency: formData.eltTest || undefined,
        counselorId: formData.counsellor || undefined,
        consultancyFree: formData.consultancyFee === 'Yes',
        scholarship: formData.scholarship === 'Yes',
      };
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Create Student</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={formData.city} onChange={(e) => handleChange('city', e.target.value)} disabled={disabled} />
              </div>
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <DobPicker value={formData.dateOfBirth} onChange={(v) => handleChange('dateOfBirth', v)} disabled={disabled} />
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-1">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} disabled={disabled} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Lead Type</Label>
                <Select value={formData.type} onValueChange={(v) => handleChange('type', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {getList('Type').map((o: any) => (<SelectItem key={o.key} value={o.key}>{o.value}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Lead Source</Label>
                <Select value={formData.source} onValueChange={(v) => handleChange('source', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {getList('Source').map((o: any) => (<SelectItem key={o.key} value={o.key}>{o.value}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Study Level</Label>
                <Select value={formData.studyLevel} onValueChange={(v) => handleChange('studyLevel', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {getList('Study Level').map((o: any) => (<SelectItem key={o.key} value={o.key}>{o.value}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Study Plan</Label>
                <Select value={formData.studyPlan} onValueChange={(v) => handleChange('studyPlan', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {getList('Study Plan').map((o: any) => (<SelectItem key={o.key} value={o.key}>{o.value}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Interested Country</Label>
                <Select value={formData.interestedCountry} onValueChange={(v) => handleChange('interestedCountry', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {getList('Interested Country').map((o: any) => (<SelectItem key={o.key} value={o.key}>{o.value}</SelectItem>))}
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
              <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Student Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {getStudentList('Status').map((o: any) => (<SelectItem key={o.key || o.id || o.value} value={(o.key || o.id || o.value) as string}>{o.value}</SelectItem>))}
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
              <div className="space-y-1">
                <Label>ELT Test</Label>
                <Select value={formData.eltTest} onValueChange={(v) => handleChange('eltTest', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select ELT test" /></SelectTrigger>
                  <SelectContent>
                    {getStudentList('ELT Test').map((o: any) => (<SelectItem key={o.key || o.id || o.value} value={(o.key || o.id || o.value) as string}>{o.value}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Passport Number</Label>
                <Input value={formData.passport} onChange={(e) => handleChange('passport', e.target.value)} disabled={disabled} />
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
                <Label>Consultancy Fee Attachment</Label>
                <FileUpload value={formData.consultancyFeeAttachment} onChange={(v) => handleChange('consultancyFeeAttachment', v)} disabled={disabled} />
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
              <div className="space-y-1 md:col-span-2">
                <Label>Scholarship Attachment</Label>
                <FileUpload value={formData.scholarshipAttachment} onChange={(v) => handleChange('scholarshipAttachment', v)} disabled={disabled} />
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

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="px-4 h-8 text-xs">
              Cancel
            </Button>
            <Button onClick={() => createStudentMutation.mutate()} disabled={disabled} className="px-4 h-8 text-xs bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed" title={'Create Student'}>
              {disabled ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Create Student</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
