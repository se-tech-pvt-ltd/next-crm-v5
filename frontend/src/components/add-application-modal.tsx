import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
console.log('[modal] loaded: frontend/src/components/add-application-modal.tsx');
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as UniversitiesService from '@/services/universities';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertApplicationSchema, type Student } from '@/lib/types';
import * as ApplicationsService from '@/services/applications';
import * as StudentsService from '@/services/students';
import * as UsersService from '@/services/users';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { Check, ChevronsUpDown, PlusCircle, Link2, BookOpen, UserSquare, ExternalLink, StickyNote } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { StudentProfileModal } from './student-profile-modal-new';
import { ApplicationDetailsModal } from './application-details-modal-new';
import * as DropdownsService from '@/services/dropdowns';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import * as BranchEmpsService from '@/services/branchEmps';

interface AddApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string;
}

export function AddApplicationModal({ open, onOpenChange, studentId }: AddApplicationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [localProfileOpen, setLocalProfileOpen] = useState(false);
  const [localProfileId, setLocalProfileId] = useState<string | null>(null);
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [currentApplicationObj, setCurrentApplicationObj] = useState<any | null>(null);

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: open && !studentId,
  });

  const { data: presetStudent } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
    queryFn: async () => StudentsService.getStudent(studentId as string),
  });

  // Users for access selection
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const normalizeRole = (r: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');
  const getNormalizedRole = () => {
    try {
      const raw = (localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user') as string) : null) as any;
    } catch {};
    try {
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
          if (tokenRole) return normalizeRole(String(tokenRole));
        }
      }
    } catch (e) {}
    return '';
  };

  const { data: applicationsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Applications'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Applications'),
    enabled: open,
  });

  const makeOptions = (dd: any, candidates: string[]) => {
    if (!dd || typeof dd !== 'object') return [];
    const normalizeKey = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Build a map of normalized keys -> original key
    const keyMap: Record<string, string> = {};
    for (const k of Object.keys(dd || {})) {
      keyMap[normalizeKey(k)] = k;
    }

    let list: any[] = [];
    for (const raw of candidates) {
      const nk = normalizeKey(raw);
      const foundKey = keyMap[nk];
      if (foundKey && Array.isArray(dd[foundKey]) && dd[foundKey].length) {
        list = dd[foundKey];
        break;
      }
    }

    // Fallback: try to find any candidate by more relaxed matching
    if ((!Array.isArray(list) || list.length === 0)) {
      for (const k of Object.keys(dd || {})) {
        const nk = normalizeKey(k);
        for (const raw of candidates) {
          if (nk === normalizeKey(raw)) {
            if (Array.isArray(dd[k]) && dd[k].length) { list = dd[k]; break; }
          }
        }
        if (Array.isArray(list) && list.length) break;
      }
    }

    if (!Array.isArray(list)) list = [];
    const sorted = [...list].sort((a: any, b: any) => {
      const sa = Number(a.sequence ?? Infinity);
      const sb = Number(b.sequence ?? Infinity);
      if (sa !== sb) return sa - sb;
      const da = (a.isDefault || a.is_default) ? 0 : 1;
      const db = (b.isDefault || b.is_default) ? 0 : 1;
      return da - db;
    });
    return sorted.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
  };

  const appStatusOptions = makeOptions(applicationsDropdowns, ['Application Status','App Status','Status','AppStatus','status']);
  const caseStatusOptions = makeOptions(applicationsDropdowns, ['Case Status','caseStatus','CaseStatus','case_status']);
  const channelPartnerOptions = makeOptions(applicationsDropdowns, ['Channel Partner', 'ChannelPartners', 'channelPartner', 'channel_partners']);

  const form = useForm({
    resolver: zodResolver(insertApplicationSchema),
    mode: 'onChange',
    defaultValues: {
      studentId: studentId || '',
      university: '',
      universityId: '',
      program: '',
      courseId: '',
      courseType: '',
      appStatus: '',
      caseStatus: '',
      country: '',
      channelPartner: '',
      intake: '',
      intakeId: '',
      googleDriveLink: '',
      notes: '',
      counsellorId: '',
      admissionOfficerId: '',
      regionId: '',
      branchId: '',
      subPartnerId: '',
    },
  });

  const [subPartnerSearch, setSubPartnerSearch] = useState('');
  const { data: subPartners = [], isFetching: subPartnerLoading } = useQuery({ queryKey: ['/api/users/sub-partners', subPartnerSearch], queryFn: () => UsersService.getPartnerUsers(), enabled: open, staleTime: 60_000 });

  // local state to ensure combobox value updates immediately
  const [selectedSubPartnerLocal, setSelectedSubPartnerLocal] = useState<string>(() => (form.getValues('subPartnerId') as string) || '');
  useEffect(() => {
    if (open) setSelectedSubPartnerLocal((form.getValues('subPartnerId') as string) || '');
  }, [open]);

  // Auto-select partner/sub-partner when logged in as partner sub-user
  useEffect(() => {
    if (!open) return;
    try {
      const roleName = getNormalizedRole();
      const isPartnerSubUser = String(roleName || '').includes('partner') && String(roleName || '').includes('sub');
      if (isPartnerSubUser) {
        // Try auth_user first
        let authUser: any = null;
        try { authUser = localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user') as string) : null; } catch {}
        const subId = String(authUser?.id ?? authUser?.userId ?? authUser?.user_id ?? '') || '';
        let parentPartnerId = String(authUser?.partnerId ?? authUser?.partner_id ?? '') || '';
        if (!parentPartnerId) {
          try {
            const token = localStorage.getItem('auth_token');
            if (token) {
              const parts = String(token).split('.');
              if (parts.length >= 2) {
                const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const pad = b64.length % 4;
                const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
                const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const payload = JSON.parse(json) as any;
                parentPartnerId = String(payload?.role_details?.partner_id || payload?.roleDetails?.partnerId || payload?.partner_id || payload?.partnerId || payload?.id || '') || parentPartnerId;
              }
            }
          } catch {}
        }
        if (subId && !form.getValues('subPartnerId')) { form.setValue('subPartnerId', subId); setSelectedSubPartnerLocal(subId); }
        if (parentPartnerId && !form.getValues('partnerId')) form.setValue('partnerId', parentPartnerId);
      }
    } catch {}
  }, [open, subPartners, users]);

  // Regions/Branches for access auto-fill
  const { data: regions = [] } = useQuery({ queryKey: ['/api/regions'], queryFn: () => RegionsService.listRegions(), enabled: open, staleTime: 60_000 });
  const { data: branches = [] } = useQuery({ queryKey: ['/api/branches'], queryFn: () => BranchesService.listBranches(), enabled: open, staleTime: 60_000 });
  const { data: branchEmps = [] } = useQuery({ queryKey: ['/api/branch-emps'], queryFn: () => BranchEmpsService.listBranchEmps(), enabled: open, staleTime: 60_000 });

  const [autoRegionDisabled, setAutoRegionDisabled] = useState(false);
  const [autoBranchDisabled, setAutoBranchDisabled] = useState(false);

  // Universities-based dynamic data
  const { data: uniSummaries = [] } = useQuery({
    queryKey: ['/api/universities'],
    queryFn: UniversitiesService.listUniversities,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const uniCountries = useMemo(() => {
    const set = new Set<string>();
    (uniSummaries || []).forEach((u: any) => { if (u?.country) set.add(String(u.country)); });
    return Array.from(set).sort().map((c) => ({ label: c, value: c }));
  }, [uniSummaries]);

  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const selectedCountry = form.watch('country');
  const selectedCourseType = form.watch('courseType');

  const filteredUniversities = useMemo(() => {
    const sel = String(selectedCountry || '');
    if (!sel) return [];
    return (uniSummaries || []).filter((u: any) => String(u.country) === sel);
  }, [uniSummaries, selectedCountry]);

  const { data: uniDetail } = useQuery({
    queryKey: ['/api/universities', selectedUniversityId],
    queryFn: async () => selectedUniversityId ? UniversitiesService.getUniversity(selectedUniversityId) : undefined,
    enabled: !!selectedUniversityId,
    staleTime: 5 * 60 * 1000,
  });

  const uniCourseTypes = useMemo(() => {
    const set = new Set<string>();
    (uniDetail?.courses || []).forEach((c: any) => { if (c?.category) set.add(String(c.category)); });
    return Array.from(set).sort();
  }, [uniDetail]);

  const filteredCourses = useMemo(() => {
    if (!selectedUniversityId) return [];
    const courses = Array.isArray(uniDetail?.courses) ? (uniDetail?.courses as any[]) : [];
    if (!selectedCourseType) return [];
    return courses.filter((c: any) => String(c?.category || '') === String(selectedCourseType));
  }, [uniDetail, selectedCourseType, selectedUniversityId]);

  useEffect(() => {
    try {
      if (!form.getValues('appStatus')) {
        const def = appStatusOptions.find(o => o.isDefault);
        if (def) form.setValue('appStatus', def.value as any);
      }
    } catch {}
    try {
      if (!form.getValues('caseStatus')) {
        const def = caseStatusOptions.find(o => o.isDefault);
        if (def) form.setValue('caseStatus', def.value as any);
      }
    } catch {}
    try {
      if (!form.getValues('channelPartner')) {
        const def = channelPartnerOptions.find(o => o.isDefault);
        if (def) form.setValue('channelPartner', def.value as any);
      }
    } catch {}
  }, [applicationsDropdowns]);


  // Determine selected student's branch (depends on form)
  const selectedStudentId = form.watch('studentId');
  const selectedStudent = (Array.isArray(students) ? students.find((s) => s.id === selectedStudentId) : null) || presetStudent;
  const selectedBranchId = (selectedStudent as any)?.branchId ?? (selectedStudent as any)?.branch_id ?? null;

  // Resolve assigned counsellor/officer from student record (support legacy keys)
  const studentCounsellorId = useMemo(() => {
    const s: any = selectedStudent || {};
    const id = s.counsellorId ?? s.counselorId ?? s.counsellor ?? s.counselor ?? '';
    return id ? String(id) : '';
  }, [selectedStudent]);
  const studentAdmissionOfficerId = useMemo(() => {
    const s: any = selectedStudent || {};
    const id = s.admissionOfficerId ?? s.admission_officer_id ?? s.admissionOfficer ?? s.admission_officer ?? '';
    return id ? String(id) : '';
  }, [selectedStudent]);

  // Reset and auto-fill access selections when branch context changes
  useEffect(() => {
    form.setValue('counsellorId', studentCounsellorId || '');
    form.setValue('admissionOfficerId', studentAdmissionOfficerId || '');
    try {
      const s: any = selectedStudent || {};
      const rid = String(s.regionId ?? s.region_id ?? '') || '';
      const bid = String(s.branchId ?? s.branch_id ?? '') || '';
      if (rid) form.setValue('regionId', rid);
      if (bid) form.setValue('branchId', bid);
    } catch {}
  }, [selectedBranchId, studentCounsellorId, studentAdmissionOfficerId, selectedStudent]);

  // Also auto-fill once when student changes if fields are empty
  useEffect(() => {
    const curC = String(form.getValues('counsellorId') || '');
    const curA = String(form.getValues('admissionOfficerId') || '');
    if (!curC && studentCounsellorId) form.setValue('counsellorId', studentCounsellorId);
    if (!curA && studentAdmissionOfficerId) form.setValue('admissionOfficerId', studentAdmissionOfficerId);
    const curR = String(form.getValues('regionId') || '');
    const curB = String(form.getValues('branchId') || '');
    const s: any = selectedStudent || {};
    const rid = String(s.regionId ?? s.region_id ?? '') || '';
    const bid = String(s.branchId ?? s.branch_id ?? '') || '';
    if (!curR && rid) form.setValue('regionId', rid);
    if (!curB && bid) form.setValue('branchId', bid);
  }, [studentCounsellorId, studentAdmissionOfficerId, selectedStudent]);

  const counsellorOptions = Array.isArray(users) && selectedBranchId
    ? users
        .filter((u: any) => {
          const role = normalizeRole(u.role || u.role_name || u.roleName);
          return (
            (role === 'counselor' || role === 'counsellor' || role === 'admin_staff') &&
            String(u.branchId || '') === String(selectedBranchId || '')
          );
        })
        .map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown' }))
    : [];
  const officerOptions = Array.isArray(users) && selectedBranchId
    ? users
        .filter((u: any) => {
          const role = normalizeRole(u.role || u.role_name || u.roleName);
          return (
            (role === 'admission_officer' || role === 'admission' || role === 'admissionofficer' || role === 'admission officer') &&
            String(u.branchId || '') === String(selectedBranchId || '')
          );
        })
        .map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown' }))
    : [];

  // Ensure options include student's assigned users even if filtered out
  const counsellorOptionsRender = useMemo(() => {
    let list = Array.isArray(counsellorOptions) ? counsellorOptions.slice() : [];
    const sel = studentCounsellorId;
    if (sel && !list.some((o) => String(o.value) === sel) && Array.isArray(users)) {
      const u = (users as any[]).find((x: any) => String(x.id) === sel);
      if (u) list = [{ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown' }, ...list];
    }
    return list;
  }, [counsellorOptions, users, studentCounsellorId]);

  const officerOptionsRender = useMemo(() => {
    let list = Array.isArray(officerOptions) ? officerOptions.slice() : [];
    const sel = studentAdmissionOfficerId;
    if (sel && !list.some((o) => String(o.value) === sel) && Array.isArray(users)) {
      const u = (users as any[]).find((x: any) => String(x.id) === sel);
      if (u) list = [{ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown' }, ...list];
    }
    return list;
  }, [officerOptions, users, studentAdmissionOfficerId]);

  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => ApplicationsService.createApplication(data),
    onSuccess: (application: any) => {
      const sid = application?.studentId || form.getValues('studentId') || studentId;
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      if (sid) {
        queryClient.invalidateQueries({ queryKey: [`/api/applications/student/${sid}`] });
      }
      toast({
        title: "Success",
        description: "Application has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
      if (sid) {
        setTimeout(() => openStudentProfile(sid), 240);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    try {
      // map subPartnerId -> subPartner for backend compatibility
      try { if (data?.subPartnerId && !data.subPartner) data.subPartner = data.subPartnerId; } catch {}

      const roleName = getNormalizedRole();
      const isPartnerRole = roleName === 'partner' || (String(roleName || '').includes('partner') && String(roleName || '').includes('sub'));
      if (isPartnerRole) {
        const selectedSubPartner = data?.subPartner ?? data?.subPartnerId ?? form.getValues('subPartnerId') ?? form.getValues('subPartner');
        console.log('[AddApplicationModal] onSubmit selectedSubPartner:', selectedSubPartner, 'data.subPartnerId=', data?.subPartnerId, 'form.getValues(subPartnerId)=', form.getValues('subPartnerId'));
        if (!selectedSubPartner || String(selectedSubPartner).trim() === '') {
          form.setError('subPartnerId', { type: 'required', message: 'Sub partner is required for partner users' });
          toast({ title: 'Validation error', description: 'Sub partner is required for partner users', variant: 'destructive' });
          return;
        }
        // ensure backend key exists
        if (!data.subPartner) data.subPartner = selectedSubPartner;
      } else {
        const missing: string[] = [];
        if (!data?.regionId || String(data.regionId).trim() === '') { form.setError('regionId', { type: 'required', message: 'Region is required' }); missing.push('Region'); }
        if (!data?.branchId || String(data.branchId).trim() === '') { form.setError('branchId', { type: 'required', message: 'Branch is required' }); missing.push('Branch'); }
        if (!data?.counsellorId || String(data.counsellorId).trim() === '') { form.setError('counsellorId', { type: 'required', message: 'Counsellor is required' }); missing.push('Counsellor'); }
        if (!data?.admissionOfficerId || String(data.admissionOfficerId).trim() === '') { form.setError('admissionOfficerId', { type: 'required', message: 'Admission officer is required' }); missing.push('Admission officer'); }
        if (missing.length) { toast({ title: 'Validation error', description: `${missing.join('; ')} are required`, variant: 'destructive' }); return; }
      }
    } catch (e) {
      // fallback to existing validation flow
    }

    createApplicationMutation.mutate(data);
  };


  useEffect(() => {
    if (studentId) {
      form.setValue('studentId', studentId);
    }
    if (presetStudent && presetStudent.id) {
      form.setValue('studentId', presetStudent.id);
    }
  }, [studentId, presetStudent]);

  // Auto-select region/branch based on current user role/token (mirrors /students/new logic)
  useEffect(() => {
    try {
      if (!open) return;
      const currentRegion = String(form.getValues('regionId') || '');
      const currentBranch = String(form.getValues('branchId') || '');
      if (currentRegion && currentBranch) return;

      const safeGetToken = () => { try { return localStorage.getItem('auth_token'); } catch { return null; } };
      const token = safeGetToken();
      let resolvedRegionId = '';
      let resolvedBranchId = '';

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
        let authUser: any = null;
        try { authUser = localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user') as string) : null; } catch {}
        const userRegionId = String(authUser?.regionId ?? authUser?.region_id ?? '');
        if (userRegionId) {
          resolvedRegionId = userRegionId;
        } else if (roleName === 'regional_manager' || roleName === 'regional_head') {
          const r = (Array.isArray(regions) ? regions : []).find((rr: any) => String(rr.regionHeadId ?? rr.region_head_id) === String(authUser?.id));
          if (r?.id) resolvedRegionId = String(r.id);
        }
      }

      if (!resolvedBranchId && (roleName === 'branch_manager' || roleName === 'counselor' || roleName === 'counsellor' || roleName === 'admission_officer')) {
        const branchesArr = Array.isArray(branches) ? branches : [];
        const links = Array.isArray(branchEmps) ? branchEmps : [];
        let userBranchId = '';
        let authUser: any = null;
        try { authUser = localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user') as string) : null; } catch {}
        const headBranch = branchesArr.find((b: any) => String(b.branchHeadId ?? b.branch_head_id) === String(authUser?.id));
        if (headBranch) userBranchId = String(headBranch.id);
        if (!userBranchId) {
          const be = links.find((x: any) => String(x.userId ?? x.user_id) === String(authUser?.id));
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
        form.setValue('regionId', resolvedRegionId);
        const isRegional = roleName === 'regional_manager' || roleName === 'regional_head';
        setAutoRegionDisabled(isRegional ? true : !isRegional);
      }

      if (resolvedBranchId) {
        form.setValue('branchId', resolvedBranchId);
        const isRegional = roleName === 'regional_manager' || roleName === 'regional_head';
        setAutoBranchDisabled(!isRegional);
      } else if (resolvedRegionId && !currentBranch) {
        form.setValue('branchId', '');
        setAutoBranchDisabled(false);
      }

      if (!(resolvedRegionId || resolvedBranchId)) {
        setAutoRegionDisabled(false);
        setAutoBranchDisabled(false);
      }
    } catch {}
  }, [open]);

  const openStudentProfile = (sid?: string) => {
    if (!sid) return;
    onOpenChange(false);
    setTimeout(() => {
      try {
        // Open local StudentProfileModal to avoid relying on global routing/events
        setLocalProfileId(sid);
        setLocalProfileOpen(true);
      } catch (e) {
        // fallback to existing approach
        try { window.dispatchEvent(new CustomEvent('open-student-profile', { detail: { id: sid } })); } catch {}
        try { setLocation(`/students?studentId=${sid}`); } catch {}
      }
    }, 240);
  };

  return (<>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="no-not-allowed w-[62.5vw] max-w-7xl max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl" style={{ touchAction: 'pan-y' }}>
        <DialogTitle className="sr-only">Add Application</DialogTitle>
        <div className="flex flex-col h-[90vh] min-h-0 bg-[#EDEDED]">
        <DialogHeader>
          <div className="px-4 py-3 flex items-center justify-between bg-[#223E7D] text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Add New Application</h2>
                <p className="text-xs text-gray-500">Create a university application for a student</p>
              </div>
            </div>
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
                onClick={() => form.handleSubmit(onSubmit, (errors) => {
                  try {
                    const extract = (obj:any, out:string[] = []) => {
                      if (!obj || typeof obj !== 'object') return out;
                      for (const k of Object.keys(obj)) {
                        const v = obj[k];
                        if (!v) continue;
                        if (typeof v === 'string') out.push(v);
                        else if (Array.isArray(v)) out.push(...v.map(String));
                        else if (v?.message) out.push(String(v.message));
                        else if (typeof v === 'object') extract(v, out);
                      }
                      return out;
                    };
                    const msgs = extract(errors).filter(Boolean);
                    if (msgs.length) {
                      toast({ title: 'Validation error', description: msgs.join('; '), variant: 'destructive' });
                    } else {
                      toast({ title: 'Validation error', description: 'Please fill required fields', variant: 'destructive' });
                    }
                  } catch (e) {
                    toast({ title: 'Validation error', description: 'Please check the form fields', variant: 'destructive' });
                  }
                })() }
                disabled={createApplicationMutation.isPending}
                className="px-3 h-8 text-xs bg-[#0071B0] hover:bg-[#00649D] text-white rounded-md"
              >
                {createApplicationMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="p-6 pt-2">
                  <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center"><Link2 className="w-4 h-4 mr-2" />Linked Entities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-xs">
                      <div className="text-[11px] text-gray-500">Student ID</div>
                      <div className="font-medium">
                        {presetStudent?.student_id || selectedStudent?.student_id || selectedStudent?.id ? (
                          <Button type="button" variant="link" className="p-0 h-6" onClick={() => openStudentProfile(presetStudent?.id || selectedStudent?.id)}>
                            {presetStudent?.student_id || selectedStudent?.student_id || selectedStudent?.id}
                          </Button>
                        ) : (
                          '-'
                        )}
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="text-[11px] text-gray-500">Student Name</div>
                    <div className="font-medium mt-1">{presetStudent?.name || selectedStudent?.name || '-'}</div>
                    </div>
                    <div className="text-xs">
                      <div className="text-[11px] text-gray-500">Email</div>
                    <div className="font-medium mt-1">{presetStudent?.email || selectedStudent?.email || '-'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center"><BookOpen className="w-4 h-4 mr-2" />Program Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="hidden" {...form.register('studentId')} />
                  <input type="hidden" {...form.register('regionId')} />
                  <input type="hidden" {...form.register('branchId')} />
                  <input type="hidden" {...form.register('universityId')} />

                  {/* Country (derived from universities table) */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country <span className="text-red-600">*</span></FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              // reset dependent selections when country changes
                              setSelectedUniversityId(null);
                              form.setValue('university', '');
                              form.setValue('universityId', '');
                              form.setValue('program', '');
                              form.setValue('courseId', '');
                              form.setValue('courseType', '');
                              form.setValue('intake', '');
                              form.setValue('intakeId', '');
                            }}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(uniCountries || []).map((c: any) => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* University (filtered by country) */}
                  <FormField
                    control={form.control}
                    name="university"
                    render={() => (
                      <FormItem>
                        <FormLabel>University *</FormLabel>
                        <FormControl>
                          <Select
                            disabled={!selectedCountry}
                            value={selectedUniversityId || ''}
                            onValueChange={(val) => {
                              setSelectedUniversityId(val || null);
                              const uni = (uniSummaries || []).find((u: any) => String(u.id) === String(val));
                              form.setValue('university', uni ? (uni.name || '') : '');
                              form.setValue('universityId', val || '');
                              // reset program/course/intake
                              form.setValue('courseType', '');
                              form.setValue('program', '');
                              form.setValue('courseId', '');
                              form.setValue('intake', '');
                              form.setValue('intakeId', '');
                            }}
                          >
                            <FormControl>
                              <SelectTrigger disabled={!selectedCountry}>
                                <SelectValue placeholder={selectedCountry ? (selectedUniversityId ? 'Selected university' : 'Select university') : 'Select country first'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(filteredUniversities || []).map((u: any) => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Course Type (derived from selected university courses categories) */}
                  <FormField
                    control={form.control}
                    name="courseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Type <span className="text-red-600">*</span></FormLabel>
                        <FormControl>
                          <Select
                            disabled={!selectedUniversityId}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue('program', '');
                              form.setValue('courseId', '');
                            }}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={!selectedUniversityId}>
                                <SelectValue placeholder={selectedUniversityId ? 'Select course type' : 'Select university first'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(uniCourseTypes || []).map((t: any) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Program (populated from selected university and course type) */}
                  <FormField
                    control={form.control}
                    name="program"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program *</FormLabel>
                        <FormControl>
                          <Select
                            disabled={!selectedUniversityId || !selectedCourseType}
                            onValueChange={(val) => {
                              field.onChange(val);
                              try {
                                const course = filteredCourses.find((c: any) => String(c.name) === String(val));
                                if (course && course.id) {
                                  form.setValue('courseId', String(course.id));
                                } else {
                                  form.setValue('courseId', '');
                                }
                              } catch {
                                form.setValue('courseId', '');
                              }
                            }}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={!selectedUniversityId || !selectedCourseType}>
                                <SelectValue
                                  placeholder={!selectedUniversityId
                                    ? 'Select university first'
                                    : !selectedCourseType
                                      ? 'Select course type first'
                                      : 'Select program'}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredCourses.map((c: any) => (
                                <SelectItem key={c.id ?? c.name} value={c.name}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Intake (from university detail) */}
                  <FormField
                    control={form.control}
                    name="intake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intake <span className="text-red-600">*</span></FormLabel>
                        <FormControl>
                          <Select
                            disabled={!selectedUniversityId}
                            onValueChange={(val) => {
                              field.onChange(val);
                              try {
                                const withIds = ((uniDetail?.admissionRequirements as any)?.intakesWithIds || []) as any[];
                                const match = Array.isArray(withIds) ? withIds.find((i) => String(i.intakeLabel) === String(val)) : null;
                                if (match && match.id) {
                                  form.setValue('intakeId', String(match.id));
                                } else {
                                  form.setValue('intakeId', '');
                                }
                              } catch {
                                form.setValue('intakeId', '');
                              }
                            }}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger disabled={!selectedUniversityId}>
                                <SelectValue placeholder={selectedUniversityId ? 'Select intake' : 'Select university first'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(((uniDetail?.admissionRequirements as any)?.intakesWithIds as any[]) || [])?.length
                                ? (((uniDetail?.admissionRequirements as any)?.intakesWithIds as any[]) || []).map((i: any) => (
                                    <SelectItem key={i.id} value={i.intakeLabel}>{i.intakeLabel}</SelectItem>
                                  ))
                                : ((uniDetail?.admissionRequirements?.intakes || []) as string[]).map((i) => (
                                    <SelectItem key={i} value={i}>{i}</SelectItem>
                                  ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Channel Partner */}
                  <FormField
                    control={form.control}
                    name="channelPartner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel Partner <span className="text-red-600">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select channel partner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {channelPartnerOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Access */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center"><UserSquare className="w-4 h-4 mr-2" />Access</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                  const roleName = getNormalizedRole();
                  const isPartnerRole = roleName === 'partner' || (String(roleName || '').includes('partner') && String(roleName || '').includes('sub'));
                  if (isPartnerRole) {
                    // Show Partner (read-only) and Sub partner selection side-by-side
                    const pidCandidates: string[] = [];
                    try {
                      const token = localStorage.getItem('auth_token');
                      if (token) {
                        const parts = String(token).split('.');
                        if (parts.length >= 2) {
                          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                          const pad = b64.length % 4;
                          const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
                          const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                          const payload = JSON.parse(json) as any;
                          const tokPid = payload?.role_details?.partner_id || payload?.roleDetails?.partnerId || payload?.partner_id || payload?.partnerId || payload?.id;
                          if (tokPid) pidCandidates.push(String(tokPid));
                        }
                      }
                    } catch {}
                    try {
                      const s: any = selectedStudent || presetStudent || {};
                      const sid = s.partner || s.partnerId || s.partner_id;
                      if (sid) pidCandidates.push(String(sid));
                    } catch {}
                    const partnerId = pidCandidates.find(v => String(v || '').trim()) || '';
                    const partnerUser = partnerId ? (Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(partnerId)) : null) : null;

                    return (
                      <>
                        <div className="space-y-1.5">
                          <FormLabel className="flex items-center space-x-2"><UserSquare className="w-4 h-4" /><span>Partner</span></FormLabel>
                          <div className="text-xs px-2 py-1.5 rounded border bg-white">
                            {partnerUser ? (
                              <div>
                                <div className="font-medium text-xs">{[partnerUser.firstName || (partnerUser as any).first_name, partnerUser.lastName || (partnerUser as any).last_name].filter(Boolean).join(' ').trim() || partnerUser.email || partnerUser.id}</div>
                                {partnerUser.email ? <div className="text-[11px] text-muted-foreground">{partnerUser.email}</div> : null}
                              </div>
                            ) : (partnerId || '—')}
                          </div>
                        </div>

                        <FormField control={form.control} name="subPartnerId" render={() => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2"><UserSquare className="w-4 h-4" /><span>Sub partner</span></FormLabel>
                            <FormControl>
                              <SearchableCombobox
                                value={selectedSubPartnerLocal || ''}
                                onValueChange={(v) => { form.setValue('subPartnerId', v, { shouldDirty: true, shouldValidate: true }); setSelectedSubPartnerLocal(v); }}
                                placeholder="Select sub partner"
                                searchPlaceholder="Search sub partners..."
                                onSearch={setSubPartnerSearch}
                                options={(Array.isArray(subPartners) ? subPartners : []).map((u:any)=>({ value: String(u.id), label: [u.firstName||u.first_name, u.lastName||u.last_name].filter(Boolean).join(' ') || 'Unknown' }))}
                                loading={subPartnerLoading}
                                className="h-12 text-sm bg-white border rounded"
                                showAvatar={false}
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                      </>
                    );
                  }

                  return (
                    <>
                      <FormField
                        control={form.control}
                        name="counsellorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Counsellor <span className="text-red-600">*</span></FormLabel>
                            <FormControl>
                              <Select value={field.value || ''} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={selectedBranchId ? 'Select counsellor' : 'No branch linked to student'} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {counsellorOptionsRender.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="admissionOfficerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admission Officer <span className="text-red-600">*</span></FormLabel>
                            <FormControl>
                              <Select value={field.value || ''} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={selectedBranchId ? 'Select admission officer' : 'No branch linked to student'} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {officerOptionsRender.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  );
                })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center"><ExternalLink className="w-4 h-4 mr-2" />Status & Links</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="appStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Status <span className="text-red-600">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {appStatusOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="caseStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Status <span className="text-red-600">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select case status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {caseStatusOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <FormField
                    control={form.control}
                    name="googleDriveLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Drive Link <span className="text-red-600">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="https://drive.google.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center"><StickyNote className="w-4 h-4 mr-2" />Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes <span className="text-red-600">*</span></FormLabel>
                        <FormControl>
                          <Textarea rows={4} placeholder="Any additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

                  </div>
                </div>
                              </form>
            </Form>
        </div>
      </div>
      </DialogContent>
    </Dialog>
    <StudentProfileModal
      open={localProfileOpen}
      onOpenChange={(o) => {
        setLocalProfileOpen(o);
        if (!o) setLocalProfileId(null);
      }}
      studentId={localProfileId}
      onOpenAddApplication={(sid) => {
        // Close profile modal and reopen this AddApplicationModal for the given student id
        try {
          setLocalProfileOpen(false);
          // Ensure parent AddApplicationModal is reopened
          setTimeout(() => {
            try {
              // set the form studentId and emit open
              form.setValue('studentId', sid || '');
            } catch {}
            try { onOpenChange(true); } catch {}
          }, 120);
        } catch (e) {
          console.error('failed to reopen add application from profile', e);
        }
      }}
      onOpenApplication={(app) => {
        setCurrentApplicationObj(app);
        try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAppDetailsOpen(true)); } catch { setIsAppDetailsOpen(true); }
      }}
    />

    <ApplicationDetailsModal
      open={isAppDetailsOpen}
      onOpenChange={(open) => { setIsAppDetailsOpen(open); if (!open) setCurrentApplicationObj(null); }}
      application={currentApplicationObj}
    />
    </>
  );
}
