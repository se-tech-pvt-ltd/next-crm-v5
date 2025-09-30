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
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth() as any;
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = React.useState(false);

  // Data needed for selects
  const { data: users } = useQuery({ queryKey: ['/api/users'] });
  const { data: branchEmps = [] } = useQuery({ queryKey: ['/api/branch-emps'], queryFn: () => BranchEmpsService.listBranchEmps(), staleTime: 60_000 });
  const { data: regions = [] } = useQuery({ queryKey: ['/api/regions'], queryFn: () => RegionsService.listRegions(), staleTime: 60_000 });
  const { data: branches = [] } = useQuery({ queryKey: ['/api/branches'], queryFn: () => BranchesService.listBranches(), staleTime: 30_000 });
  const { data: leadDropdowns } = useQuery({ queryKey: ['/api/dropdowns/module/Leads'], queryFn: async () => DropdownsService.getModuleDropdowns('Leads') });
  const { data: studentDropdowns } = useQuery({ queryKey: ['/api/dropdowns/module/students'], queryFn: async () => DropdownsService.getModuleDropdowns('students') });

  const normalizeRole = (r?: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');


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
    notes: '',
    regionId: '',
    branchId: '',
  };

  type FormFieldKey = keyof typeof initialFormData;

  const [formData, setFormData] = React.useState(initialFormData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [autoRegionDisabled, setAutoRegionDisabled] = React.useState(false);
  const [autoBranchDisabled, setAutoBranchDisabled] = React.useState(false);

  const getNormalizedRole = () => {
    try {
      const rawRole = (user as any)?.role || (user as any)?.role_name || (user as any)?.roleName;
      if (rawRole) return normalizeRole(String(rawRole));
      const token = (() => { try { return localStorage.getItem('auth_token'); } catch { return null; } })();
      if (token) {
        const parts = String(token).split('.');
        if (parts.length >= 2) {
          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const pad = b64.length % 4;
          const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
          const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          const payload = JSON.parse(json) as any;
          const tokenRole = payload?.role_details?.role_name || payload?.role_name || payload?.role || '';
          return normalizeRole(String(tokenRole || ''));
        }
      }
    } catch {}
    return '';
  };

  // Without a lead context, allow choosing from all users by role (depends on formData)
  const counsellorList = React.useMemo(() => {
    const base = Array.isArray(users) ? users.filter((u: any) => {
      const role = normalizeRole(u.role || u.role_name || u.roleName);
      return role === 'counselor' || role === 'counsellor' || role === 'admin_staff';
    }) : [];
    const bid = String(formData.branchId || '');
    if (bid) {
      const links = Array.isArray(branchEmps) ? branchEmps : [];
      const allowed = new Set((links as any[]).filter((be: any) => String(be.branchId ?? be.branch_id) === bid).map((be: any) => String(be.userId ?? be.user_id)));
      return base.filter((u: any) => allowed.has(String(u.id)));
    }
    return [];
  }, [users, branchEmps, formData.branchId]);

  const admissionOfficerList = React.useMemo(() => {
    const base = Array.isArray(users) ? users.filter((u: any) => {
      const role = normalizeRole(u.role || u.role_name || u.roleName);
      return role === 'admission_officer' || role === 'admission officer' || role === 'admissionofficer';
    }) : [];
    const bid = String(formData.branchId || '');
    if (bid) {
      const links = Array.isArray(branchEmps) ? branchEmps : [];
      const allowed = new Set((links as any[]).filter((be: any) => String(be.branchId ?? be.branch_id) === bid).map((be: any) => String(be.userId ?? be.user_id)));
      return base.filter((u: any) => allowed.has(String(u.id)));
    }
    return [];
  }, [users, branchEmps, formData.branchId]);

  const handleChange = (key: FormFieldKey, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
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
      const message = error?.message || 'Failed to create student.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setErrors(prev => {
        if (!message) return prev;
        const lower = message.toLowerCase();
        const next = { ...prev };
        if (lower.includes('email')) next.email = message;
        if (lower.includes('phone')) next.phone = message;
        return next;
      });
    }
  });

  const handleCreate = async () => {
    const trimmedName = (formData.name || '').trim();
    const normalizedEmail = (formData.email || '').trim().toLowerCase();
    const normalizedPhone = (formData.phone || '').trim();
    const normalizedPhoneDigits = normalizedPhone.replace(/\D/g, '');
    const passportNumber = (formData.passport || '').trim();
    const dateOfBirth = (formData.dateOfBirth || '').trim();
    const address = (formData.address || '').trim();
    const englishProficiency = (formData.englishProficiency || '').trim();
    const expectation = (formData.expectation || '').trim();
    const status = (formData.status || '').trim();
    const counsellorId = (formData.counsellor || '').trim();
    const admissionOfficerId = (formData.admissionOfficer || '').trim();
    const notes = (formData.notes || '').trim();
    const regionId = (formData.regionId || '').trim();
    const branchId = (formData.branchId || '').trim();

    const validationErrors: Record<string, string> = {};

    if (!trimmedName) validationErrors.name = 'Full Name is required';
    if (!normalizedEmail) validationErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) validationErrors.email = 'Enter a valid email address';
    if (!normalizedPhone) validationErrors.phone = 'Phone is required';
    else if (normalizedPhoneDigits.length < 6) validationErrors.phone = 'Enter a valid phone number';
    if (!passportNumber) validationErrors.passport = 'Passport number is required';
    if (!dateOfBirth) validationErrors.dateOfBirth = 'Date of birth is required';
    if (!address) validationErrors.address = 'Address is required';
    if (!englishProficiency) validationErrors.englishProficiency = 'English proficiency is required';
    if (!expectation) validationErrors.expectation = 'Expectation is required';
    if (!status) validationErrors.status = 'Status is required';
    if (!Array.isArray(formData.targetCountries) || formData.targetCountries.length === 0) validationErrors.targetCountries = 'Select at least one target country';
    if (!counsellorId) validationErrors.counsellor = 'Counsellor is required';
    if (!admissionOfficerId) validationErrors.admissionOfficer = 'Admission officer is required';
    if (!formData.consultancyFee) validationErrors.consultancyFee = 'Consultancy fee selection is required';
    if (!formData.scholarship) validationErrors.scholarship = 'Scholarship selection is required';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({ title: 'Missing information', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    const normalizedTargetCountry = JSON.stringify(formData.targetCountries.map((value) => String(value)));

    const payload: any = {
      name: trimmedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      dateOfBirth,
      address,
      expectation,
      status,
      targetCountry: normalizedTargetCountry,
      passportNumber,
      englishProficiency,
      counsellorId,
      counselorId: counsellorId,
      admissionOfficerId,
      consultancyFree: formData.consultancyFee === 'Yes',
      scholarship: formData.scholarship === 'Yes',
    };

    if (notes) payload.notes = notes;
    if (regionId) payload.regionId = regionId;
    if (branchId) payload.branchId = branchId;

    try {
      const res = await StudentsService.getStudents();
      let list: any[] = [];
      if (Array.isArray(res)) list = res as any[];
      else if (res && typeof res === 'object') list = (res as any).data || [];

      if (normalizedEmail) {
        const duplicateEmail = list.find(s => s && s.email && String(s.email).trim().toLowerCase() === normalizedEmail);
        if (duplicateEmail) {
          const duplicateError = 'A student with this email already exists.';
          setErrors(prev => ({ ...prev, email: duplicateError }));
          toast({ title: 'Duplicate email', description: duplicateError, variant: 'destructive' });
          return;
        }
      }

      if (normalizedPhoneDigits) {
        const duplicatePhone = list.find(s => s && s.phone && String(s.phone).replace(/\D/g, '') === normalizedPhoneDigits);
        if (duplicatePhone) {
          const duplicateError = 'A student with this phone number already exists.';
          setErrors(prev => ({ ...prev, phone: duplicateError }));
          toast({ title: 'Duplicate phone', description: duplicateError, variant: 'destructive' });
          return;
        }
      }

      setErrors({});
      createStudentMutation.mutate(payload);
      return;
    } catch (err: any) {
      setErrors({});
      createStudentMutation.mutate(payload);
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

  // Auto-select region/branch based on role (mirrors /leads/new)
  React.useEffect(() => {
    try {
      const currentRegion = String(formData.regionId || '');
      const currentBranch = String(formData.branchId || '');
      if (currentRegion && currentBranch) return;

      const safeGetToken = () => { try { return localStorage.getItem('auth_token'); } catch { return null; } };
      const token = safeGetToken();
      let resolvedRegionId = '' as string;
      let resolvedBranchId = '' as string;

      if (token) {
        try {
          const parts = String(token).split('.');
          if (parts.length >= 2) {
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const pad = b64.length % 4;
            const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
            const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const payload = JSON.parse(json) as any;
            const rd = payload?.role_details || payload?.roleDetails || {};
            const candidateRegion = rd.region_id ?? rd.regionId ?? payload?.region_id ?? payload?.regionId ?? payload?.region?.id ?? payload?.user?.region_id ?? payload?.user?.regionId;
            const candidateBranch = rd.branch_id ?? rd.branchId ?? payload?.branch_id ?? payload?.branchId ?? payload?.branch?.id ?? payload?.user?.branch_id ?? payload?.user?.branchId;
            if (candidateRegion) resolvedRegionId = String(candidateRegion);
            if (candidateBranch) resolvedBranchId = String(candidateBranch);
          }
        } catch {}
      }

      const roleName = getNormalizedRole();

      if (!resolvedRegionId) {
        const userRegionId = String((user as any)?.regionId ?? (user as any)?.region_id ?? '');
        if (userRegionId) {
          resolvedRegionId = userRegionId;
        } else if (roleName === 'regional_manager' || roleName === 'regional_head') {
          const r = (Array.isArray(regions) ? regions : []).find((rr: any) => String(rr.regionHeadId ?? rr.region_head_id) === String((user as any)?.id));
          if (r?.id) resolvedRegionId = String(r.id);
        }
      }

      if (!resolvedBranchId && (roleName === 'branch_manager' || roleName === 'counselor' || roleName === 'counsellor' || roleName === 'admission_officer')) {
        const branchesArr = Array.isArray(branches) ? branches : [];
        const links = Array.isArray(branchEmps) ? branchEmps : [];
        let userBranchId = '' as string;
        const headBranch = branchesArr.find((b: any) => String(b.branchHeadId ?? b.branch_head_id) === String((user as any)?.id));
        if (headBranch) userBranchId = String(headBranch.id);
        if (!userBranchId) {
          const be = links.find((x: any) => String(x.userId ?? x.user_id) === String((user as any)?.id));
          if (be) userBranchId = String(be.branchId ?? be.branch_id);
        }
        if (userBranchId) {
          resolvedBranchId = userBranchId;
          if (!resolvedRegionId) {
            const b = branchesArr.find((bb: any) => String(bb.id) === String(userBranchId));
            if (b) resolvedRegionId = String(b.regionId ?? b.region_id ?? '');
          }
        }
      }

      if (resolvedRegionId) {
        setFormData(prev => ({ ...prev, regionId: resolvedRegionId }));
        const isRegional = roleName === 'regional_manager' || roleName === 'regional_head';
        setAutoRegionDisabled(isRegional ? true : !isRegional);
      }

      if (resolvedBranchId) {
        setFormData(prev => ({ ...prev, branchId: resolvedBranchId }));
        const isRegional = roleName === 'regional_manager' || roleName === 'regional_head';
        setAutoBranchDisabled(!isRegional);
      } else if (resolvedRegionId && !currentBranch) {
        setFormData(prev => ({ ...prev, branchId: '' }));
        setAutoBranchDisabled(false);
      }

      if (!(resolvedRegionId || resolvedBranchId)) {
        setAutoRegionDisabled(false);
        setAutoBranchDisabled(false);
      }
    } catch {}
  }, [user, regions, branches, branchEmps, open]);

  // Ensure region derives from selected branch if missing
  React.useEffect(() => {
    try {
      const rid = String(formData.regionId || '');
      const bid = String(formData.branchId || '');
      if (!rid && bid) {
        const branchesArr = Array.isArray(branches) ? branches : [];
        const b = branchesArr.find((x: any) => String(x.id) === String(bid));
        const regionFromBranch = String(b?.regionId ?? b?.region_id ?? '');
        if (regionFromBranch) {
          setFormData(prev => ({ ...prev, regionId: regionFromBranch }));
          const roleName = getNormalizedRole();
          const isRegional = roleName === 'regional_manager' || roleName === 'regional_head';
          setAutoRegionDisabled(isRegional ? true : !isRegional);
        }
      }
    } catch {}
  }, [branches, formData.branchId]);

  const regionOptions = React.useMemo(() => (Array.isArray(regions) ? regions : []).map((r: any) => ({ value: String(r.id), label: String(r.regionName || r.name || r.id), headId: String(r.regionHeadId || '') })), [regions]);
  const branchOptions = React.useMemo(() => (Array.isArray(branches) ? branches : [])
    .filter((b: any) => !formData.regionId || String(b.regionId ?? b.region_id ?? '') === String(formData.regionId))
    .map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.code || b.id), regionId: String(b.regionId ?? b.region_id ?? '') , headId: String(b.branchHeadId || b.managerId || '') })), [branches, formData.regionId]);


  React.useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [open]);

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
                {errors.name && <p className="text-[11px] text-red-600">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="Enter email address" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} disabled={disabled} />
                {errors.email && <p className="text-[11px] text-red-600">{errors.email}</p>}
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input type="tel" placeholder="Enter phone number" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} disabled={disabled} />
                {errors.phone && <p className="text-[11px] text-red-600">{errors.phone}</p>}
              </div>
              <div className="space-y-1">
                <Label>Passport Number</Label>
                <Input placeholder="Enter passport number" value={formData.passport} onChange={(e) => handleChange('passport', e.target.value)} disabled={disabled} />
                {errors.passport && <p className="text-[11px] text-red-600">{errors.passport}</p>}
              </div>
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <DobPicker value={formData.dateOfBirth} onChange={(v) => handleChange('dateOfBirth', v)} disabled={disabled} />
                {errors.dateOfBirth && <p className="text-[11px] text-red-600">{errors.dateOfBirth}</p>}
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
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {getStudentList('Status').map((o: any) => (<SelectItem key={o.key || o.id || o.value} value={(o.key || o.id || o.value) as string}>{o.value}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
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
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Access</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Region</Label>
                <Select value={formData.regionId} onValueChange={(v) => {
                  setFormData(prev => ({ ...prev, regionId: v, branchId: '', counsellor: '', admissionOfficer: '' }));
                  setAutoRegionDisabled(false);
                  setAutoBranchDisabled(false);
                }} disabled={disabled || autoRegionDisabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {regionOptions.map((r: any) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Branch</Label>
                <Select value={formData.branchId} onValueChange={(v) => {
                  const b = (branchOptions as any[]).find((x: any) => String(x.value) === String(v));
                  setFormData(prev => ({ ...prev, branchId: v, counsellor: '', admissionOfficer: '', regionId: prev.regionId || String(b?.regionId || '') }));
                  const roleName = getNormalizedRole();
                  const isRegional = roleName === 'regional_manager' || roleName === 'regional_head';
                  setAutoBranchDisabled(!isRegional);
                  setAutoRegionDisabled(isRegional ? true : !isRegional);
                }} disabled={disabled || autoBranchDisabled}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branchOptions.map((b: any) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Counsellor</Label>
                <Select value={formData.counsellor} onValueChange={(v) => handleChange('counsellor', v)} disabled={disabled || !formData.branchId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select counsellor" /></SelectTrigger>
                  <SelectContent>
                    {counsellorList.map((u: any) => (<SelectItem key={u.id} value={String(u.id)}>{[u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(' ') || u.email || u.id}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Admission Officer</Label>
                <Select value={formData.admissionOfficer} onValueChange={(v) => handleChange('admissionOfficer', v)} disabled={disabled || !formData.branchId}>
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
