import React, { useEffect, useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
console.log('[modal] loaded: frontend/src/components/add-admission-modal.tsx');
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { insertAdmissionSchema, type InsertAdmission, type Student, type Application } from '@/lib/types';
import * as AdmissionsService from '@/services/admissions';
import * as ApplicationsService from '@/services/applications';
import * as StudentsService from '@/services/students';
import * as UsersService from '@/services/users';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import * as BranchEmpsService from '@/services/branchEmps';
import * as DropdownsService from '@/services/dropdowns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Check, ChevronsUpDown, PlusCircle, Users } from 'lucide-react';
import { ApplicationDetailsModal } from './application-details-modal-new';
import { StudentProfileModal } from './student-profile-modal-new';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AddAdmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId?: string | number | null;
  studentId?: string | null;
}

export function AddAdmissionModal({ open, onOpenChange, applicationId, studentId }: AddAdmissionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [applicationDropdownOpen, setApplicationDropdownOpen] = useState(false);

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: open && !studentId
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    enabled: open && !applicationId
  });

  const { data: linkedApp } = useQuery<Application | null>({
    queryKey: ['/api/applications', String(applicationId)],
    queryFn: async () => {
      if (!applicationId) return null;
      const res = await ApplicationsService.getApplication(String(applicationId));
      return res as Application;
    },
    enabled: !!applicationId
  });

  const { user } = useAuth() as any;
  const [autoRegionDisabled, setAutoRegionDisabled] = useState(false);
  const [autoBranchDisabled, setAutoBranchDisabled] = useState(false);

  const { data: branchEmps = [], isFetched: branchEmpsFetched = false } = useQuery({ queryKey: ['/api/branch-emps'], queryFn: () => BranchEmpsService.listBranchEmps(), enabled: open, staleTime: 60_000 });

  const form = useForm<any>({
    resolver: zodResolver(insertAdmissionSchema as any),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      applicationId: applicationId || '',
      studentId: studentId || '',
      university: '',
      program: '',
      decision: 'pending',
      decisionDate: undefined,
      scholarshipAmount: '',
      conditions: '',
      depositRequired: false,
      depositAmount: '',
      depositDeadline: undefined,
      visaStatus: 'pending',
      status: '',
      caseStatus: '',
      fullTuitionFee: '',
      netTuitionFee: '',
      initialDeposit: '',
      depositDate: undefined,
      visaDate: undefined,
      googleDriveLink: '',
      notes: '',
      counsellorId: '',
      admissionOfficerId: '',
      regionId: '',
      branchId: '',
    }
  });

  // Trigger validation when modal opens to compute initial validity
  useEffect(() => {
    if (!open) return;
    // small timeout to let default values propagate
    const t = setTimeout(() => {
      try { form.trigger(); } catch {};
    }, 50);
    return () => clearTimeout(t);
  }, [open]);

  const watchedFull = form.watch('fullTuitionFee');
  const watchedScholarship = form.watch('scholarshipAmount');
  const watchedAppId = form.watch('applicationId');
  const branchId = form.watch('branchId');
  const regionId = form.watch('regionId');

  useEffect(() => {
    const full = Number(watchedFull) || 0;
    const scholarship = Number(watchedScholarship) || 0;
    const net = full > 0 ? Math.max(full - scholarship, 0) : 0;
    if (!Number.isNaN(net)) {
      const curr = form.getValues('netTuitionFee');
      if (String(curr) !== String(net)) form.setValue('netTuitionFee', String(net));
    }
  }, [watchedFull, watchedScholarship]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('[AddAdmissionModal] mutationFn called with data:', data);
      const payload: InsertAdmission = {
        applicationId: String(data.applicationId),
        studentId: data.studentId,
        university: data.university,
        program: data.program,
        decision: data.decision || 'pending',
        decisionDate: data.decisionDate ? new Date(data.decisionDate) : undefined,
        // Map UI fields to ORM fields
        status: data.status || null,
        caseStatus: data.caseStatus || null,
        fullTuitionFee: data.fullTuitionFee || null,
        scholarshipAmount: data.scholarshipAmount || null,
        netTuitionFee: data.netTuitionFee || null,
        depositRequired: Boolean(data.depositRequired) || false,
        // Persist initialDeposit (frontend field) into DB column initial_deposit
        initialDeposit: data.initialDeposit ?? data.depositAmount ?? undefined,
        // keep depositAmount for compatibility but not required
        depositAmount: data.depositAmount ?? undefined,
        depositDate: data.depositDate ? new Date(data.depositDate) : undefined,
        depositDeadline: data.depositDeadline ? new Date(data.depositDeadline) : undefined,
        visaDate: data.visaDate ? new Date(data.visaDate) : undefined,
        visaStatus: data.visaStatus || 'pending',
        googleDriveLink: data.googleDriveLink || null,
        branchId: data.branchId || undefined,
        regionId: data.regionId || undefined,
        counsellorId: data.counsellorId || undefined,
        admissionOfficerId: data.admissionOfficerId || undefined,
      } as any;
      console.log('[AddAdmissionModal] payload prepared:', payload);
      // Remove undefined fields (especially optional dates) so backend doesn't receive null/undefined
      Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete (payload as any)[k]; });
      try {
        const created = await AdmissionsService.createAdmission(payload as any);
        try {
          if (data.caseStatus && data.applicationId) {
            await ApplicationsService.updateApplication(String(data.applicationId), { caseStatus: data.caseStatus });
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
          }
          if (data.googleDriveLink && data.applicationId) {
            await ApplicationsService.updateApplication(String(data.applicationId), { googleDriveLink: data.googleDriveLink });
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
          }
        } catch (e) { console.warn('[AddAdmissionModal] failed to update application:', e); }
        return created;
      } catch (err) {
        console.error('[AddAdmissionModal] createAdmission error:', err);
        throw err;
      }
    },
    onSuccess: (created) => {
      console.log('[AddAdmissionModal] create success:', created);
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      toast({ title: 'Success', description: 'Admission created.' });
      onOpenChange(false);
      form.reset();
    },
    onError: (err: any) => {
      console.error('[AddAdmissionModal] create error:', err);
      toast({ title: 'Error', description: err?.message || 'Failed to create admission.', variant: 'destructive' });
    }
  });

  const onSubmit = (data: any) => {
    console.log('[AddAdmissionModal] onSubmit called with', data);
    createMutation.mutate(data);
  };

  useEffect(() => {
    if (applicationId) {
      const idStr = String(applicationId);
      if (form.getValues('applicationId') !== idStr) form.setValue('applicationId', idStr);
    }
    if (studentId && !form.getValues('studentId')) form.setValue('studentId', studentId);

    // If we have a linked application (when modal opened with applicationId), populate university and program
    if (linkedApp) {
      const linkedIdStr = String(linkedApp.id);
      if (form.getValues('applicationId') !== linkedIdStr) form.setValue('applicationId', linkedIdStr);
      if (form.getValues('studentId') !== (linkedApp.studentId || '')) form.setValue('studentId', linkedApp.studentId || '');
      if (form.getValues('university') !== (linkedApp.university || '')) form.setValue('university', linkedApp.university || '');
      if (form.getValues('program') !== (linkedApp.program || '')) form.setValue('program', linkedApp.program || '');
      try {
        const anyApp: any = linkedApp as any;
        // Auto-fill region and branch first (so branch-based dropdowns can react)
        if (anyApp.regionId && !form.getValues('regionId')) form.setValue('regionId', String(anyApp.regionId));
        if (anyApp.branchId && !form.getValues('branchId')) form.setValue('branchId', String(anyApp.branchId));
        const resolveUserIdFromApp = (appId:any) => {
          if (!appId) return undefined;
          const idStr = String(appId);
          const u = (users || []).find((x:any) => String(x.id) === idStr);
          if (u) return String(u.id);
          const be = (branchEmps || []).find((b:any) => String(b.id) === idStr || String(b.userId ?? b.user_id) === idStr);
          if (be) return String(be.userId ?? be.user_id);
          return undefined;
        };
        {
          // Clear to avoid showing stale values while async lookups complete
          form.setValue('counsellorId', '');
          form.setValue('admissionOfficerId', '');
          const sourceCounsellor = anyApp.counsellorId ?? anyApp.counselorId ?? anyApp.counsellor_id ?? anyApp.counselor_id;
          const resolvedC = resolveUserIdFromApp(sourceCounsellor);
          console.log('[AddAdmissionModal] linkedApp counsellor source:', { sourceCounsellor, resolvedC, usersCount: Array.isArray(users) ? users.length : 0, branchEmpsCount: Array.isArray(branchEmps) ? branchEmps.length : 0 });
          if (resolvedC) {
            form.setValue('counsellorId', resolvedC);
            console.log('[AddAdmissionModal] set counsellorId to', resolvedC);
          }
        }
        {
          const sourceOfficer = anyApp.admissionOfficerId ?? anyApp.admission_officer_id ?? anyApp.officerId ?? anyApp.officer_id;
          const resolvedO = resolveUserIdFromApp(sourceOfficer);
          console.log('[AddAdmissionModal] linkedApp admissionOfficer source:', { sourceOfficer, resolvedO });
          if (resolvedO) {
            form.setValue('admissionOfficerId', resolvedO);
            console.log('[AddAdmissionModal] set admissionOfficerId to', resolvedO);
          }
        }
        // If application has a caseStatus or status, prefill admission's caseStatus where appropriate
        const localCaseStatusOptions = getOptions('Case Status', ['Admissions','Applications']);
        const localStatusOptions = getOptions('Status', ['Admissions','Applications']);
        if (!form.getValues('caseStatus') && (anyApp.caseStatus || anyApp.case_status)) {
          const raw = String(anyApp.caseStatus ?? anyApp.case_status);
          // Try to map to caseStatusOptions value (match by label or value)
          const match = (localCaseStatusOptions || []).find((o: any) => String(o.value) === raw || String(o.label).toLowerCase() === raw.toLowerCase());
          if (match) form.setValue('caseStatus', match.value);
          else form.setValue('caseStatus', raw);
        }
        if (!form.getValues('status') && (anyApp.status || anyApp.appStatus || anyApp.app_status)) {
          const raw = String(anyApp.status ?? anyApp.appStatus ?? anyApp.app_status);
          const match = (localStatusOptions || []).find((o: any) => String(o.value) === raw || String(o.label).toLowerCase() === raw.toLowerCase());
          if (match) form.setValue('status', match.value);
          else form.setValue('status', raw);
        }
      } catch {}
    }
  }, [applicationId, studentId, linkedApp]);

  const { data: admissionDropdowns } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/dropdowns/module/Admissions'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Admissions'),
    enabled: open,
  });

  const { data: applicationsDropdowns } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/dropdowns/module/Applications'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Applications'),
    enabled: open,
  });

  const getOptions = (name: string, preferredModules: ('Admissions'|'Applications')[] = ['Admissions','Applications']) => {
  // Debug: inspect loaded dropdown payloads when modal open
  try { if (open) { console.log('[AddAdmissionModal] admissionDropdowns =', admissionDropdowns); console.log('[AddAdmissionModal] applicationsDropdowns =', applicationsDropdowns); } } catch {}
    const normalize = (s: string) => String(s || '').toLowerCase().trim();
    const variants = (n: string) => [n, n.toLowerCase(), n.replace(/\s+/g, ''), n.replace(/\s+/g, '').toLowerCase(), n.replace(/\s+/g, '_'), n.replace(/\s+/g, '').replace(/_/g,'')];

    const moduleMap: Record<string, Record<string, any[]>|undefined> = {
      'Admissions': admissionDropdowns as any,
      'Applications': applicationsDropdowns as any,
    };

    for (const mod of preferredModules) {
      const dd = moduleMap[mod];
      if (!dd || typeof dd !== 'object') continue;
      // try exact key matches with variants
      for (const v of variants(name)) {
        if (Object.prototype.hasOwnProperty.call(dd, v)) {
          const list = Array.isArray((dd as any)[v]) ? [...(dd as any)[v]] : [];
          return list.sort((a: any,b:any)=>Number(a.sequence??0)-Number(b.sequence??0)).map((o:any)=>({ label: o.value, value: o.id||o.key||o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
        }
      }
      // try case-insensitive match on keys
      const foundKey = Object.keys(dd).find(k => normalize(k) === normalize(name) || normalize(k).replace(/\s+/g,'') === normalize(name).replace(/\s+/g,''));
      if (foundKey) {
        const list = Array.isArray((dd as any)[foundKey]) ? [...(dd as any)[foundKey]] : [];
        return list.sort((a: any,b:any)=>Number(a.sequence??0)-Number(b.sequence??0)).map((o:any)=>({ label: o.value, value: o.id||o.key||o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
      }
    }

    return [] as {label:string;value:string}[];
  };

  const statusOptions = getOptions('Status', ['Admissions','Applications']);
  const caseStatusOptions = getOptions('Case Status', ['Admissions','Applications']);

  useEffect(() => {
    if (!open) return;
    try {
      if ((!form.getValues('status') || form.getValues('status') === '') && Array.isArray(statusOptions) && statusOptions.length > 0) {
        const def = statusOptions.find((o:any) => o.isDefault || o.is_default || o.default) || statusOptions[0];
        if (def) form.setValue('status', def.value as any);
      }
    } catch {}
    try {
      if ((!form.getValues('caseStatus') || form.getValues('caseStatus') === '') && Array.isArray(caseStatusOptions) && caseStatusOptions.length > 0) {
        const def = (caseStatusOptions as any).find((o:any) => o.isDefault || o.is_default || o.default) || (caseStatusOptions as any)[0];
        if (def) form.setValue('caseStatus', def.value as any);
      }
    } catch {}
  }, [open, statusOptions, caseStatusOptions]);

  // Users for access assignment
  const { data: users = [], isFetched: usersFetched = false } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // When modal is opened for a specific application, only populate access fields after users & branch mappings are fetched
  useEffect(() => {
    if (!open) return;
    if (!linkedApp) return;
    if (!usersFetched || !branchEmpsFetched) return;
    try {
      // reset to avoid stale values
      form.setValue('counsellorId', '');
      form.setValue('admissionOfficerId', '');
      if (linkedApp.regionId) form.setValue('regionId', String(linkedApp.regionId));
      if (linkedApp.branchId) form.setValue('branchId', String(linkedApp.branchId));

      const resolveUserIdFromApp = (appId:any) => {
        if (!appId) return undefined;
        const idStr = String(appId);
        const u = (users || []).find((x:any) => String(x.id) === idStr);
        if (u) return String(u.id);
        const be = (branchEmps || []).find((b:any) => String(b.id) === idStr || String(b.userId ?? b.user_id) === idStr);
        if (be) return String(be.userId ?? be.user_id);
        return undefined;
      };

      const sourceCounsellor = (linkedApp as any).counsellorId ?? (linkedApp as any).counselorId ?? (linkedApp as any).counsellor_id ?? (linkedApp as any).counselor_id;
      const sourceOfficer = (linkedApp as any).admissionOfficerId ?? (linkedApp as any).admission_officer_id ?? (linkedApp as any).officerId ?? (linkedApp as any).officer_id;
      const resolvedC = resolveUserIdFromApp(sourceCounsellor);
      const resolvedO = resolveUserIdFromApp(sourceOfficer);

      // set after a tick so Select options that depend on branchId recompute first
      setTimeout(() => {
        if (resolvedC) form.setValue('counsellorId', resolvedC);
        if (resolvedO) form.setValue('admissionOfficerId', resolvedO);
      }, 20);

    } catch (e) {
      console.error('[AddAdmissionModal] linkedApp sync error', e);
    }
  }, [open, linkedApp, usersFetched, branchEmpsFetched, users, branchEmps]);
  const normalizeRole = (r: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');
  const counsellorOptions = React.useMemo(() => {
    const bid = String(form.getValues('branchId') || '');
    if (!bid) return [];
    const base = Array.isArray(users) ? users.filter((u: any) => {
      const role = normalizeRole(u.role || u.role_name || u.roleName);
      return role === 'counselor' || role === 'counsellor' || role === 'admin_staff';
    }) : [];
    const links = Array.isArray(branchEmps) ? branchEmps : [];
    const allowed = new Set((links as any[]).filter((be: any) => String(be.branchId ?? be.branch_id) === bid).map((be: any) => String(be.userId ?? be.user_id)));
    const opts = base.filter((u: any) => allowed.has(String(u.id))).map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'User') }));
    // Ensure selected value is present in options so Select shows correct label
    try {
      const sel = String(form.getValues('counsellorId') || '');
      if (sel && !opts.some((o:any) => String(o.value) === sel) && Array.isArray(users)) {
        const su = users.find((x:any) => String(x.id) === sel);
        if (su) opts.unshift({ value: String(su.id), label: `${su.firstName || ''} ${su.lastName || ''}`.trim() || (su.email || 'User') });
      }
    } catch {}
    return opts;
  }, [users, branchEmps, branchId]);

  const officerOptions = React.useMemo(() => {
    const bid = String(form.getValues('branchId') || '');
    if (!bid) return [];
    const base = Array.isArray(users) ? users.filter((u: any) => {
      const role = normalizeRole(u.role || u.role_name || u.roleName);
      return role === 'admission_officer' || role === 'admission' || role === 'admissionofficer' || role === 'admission officer';
    }) : [];
    const links = Array.isArray(branchEmps) ? branchEmps : [];
    const allowed = new Set((links as any[]).filter((be: any) => String(be.branchId ?? be.branch_id) === bid).map((be: any) => String(be.userId ?? be.user_id)));
    const opts = base.filter((u: any) => allowed.has(String(u.id))).map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'User') }));
    try {
      const sel = String(form.getValues('admissionOfficerId') || '');
      if (sel && !opts.some((o:any) => String(o.value) === sel) && Array.isArray(users)) {
        const su = users.find((x:any) => String(x.id) === sel);
        if (su) opts.unshift({ value: String(su.id), label: `${su.firstName || ''} ${su.lastName || ''}`.trim() || (su.email || 'User') });
      }
    } catch {}
    return opts;
  }, [users, branchEmps, branchId]);

  // Regions & branches for Access panel (copied behavior from create-student-modal / add-lead-form)
  const { data: regions = [] } = useQuery({ queryKey: ['/api/regions'], queryFn: () => (RegionsService.listRegions ? RegionsService.listRegions() : RegionsService.getRegions ? RegionsService.getRegions() : Promise.resolve([])), enabled: open });
  const { data: branches = [] } = useQuery({ queryKey: ['/api/branches'], queryFn: () => (BranchesService.listBranches ? BranchesService.listBranches() : BranchesService.getBranches ? BranchesService.getBranches() : Promise.resolve([])), enabled: open });

  const regionOptions = Array.isArray(regions) ? regions.map((r: any) => ({ value: String(r.id), label: String(r.regionName || r.name || r.id) })) : [];
  const branchOptions = React.useMemo(() => (Array.isArray(branches) ? branches : [])
    .filter((b: any) => !regionId || String(b.regionId ?? b.region_id ?? '') === String(regionId))
    .map((b: any) => ({ value: String(b.id), label: String(b.branchName || b.name || b.code || b.id), regionId: String(b.regionId ?? b.region_id ?? '') })), [branches, regionId]);

  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [currentApplicationObj, setCurrentApplicationObj] = useState<Application | null>(null);
  const [currentStudentIdLocal, setCurrentStudentIdLocal] = useState<string | null>(null);

  const getNormalizedRole = () => {
    try {
      const rawRole = (user as any)?.role || (user as any)?.role_name || (user as any)?.roleName;
      if (rawRole) return String(rawRole).trim().toLowerCase().replace(/\s+/g, '_');
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
          return String(tokenRole).trim().toLowerCase().replace(/\s+/g, '_');
        }
      }
    } catch {}
    return '';
  };

  // Auto-select region/branch based on role
  React.useEffect(() => {
    try {
      if (!open) return;
      const currentRegion = String(form.getValues('regionId') || '');
      const currentBranch = String(form.getValues('branchId') || '');
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
      const shouldDisableRegion = ['regional_manager','regional_head','branch_manager','counselor','counsellor','admission_officer'].includes(roleName);

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

      // Only set values if different to avoid triggering re-renders unnecessarily
      const currRegion = form.getValues('regionId');
      if (resolvedRegionId && String(currRegion) !== String(resolvedRegionId)) {
        form.setValue('regionId', resolvedRegionId as any);
        if (autoRegionDisabled !== shouldDisableRegion) setAutoRegionDisabled(shouldDisableRegion);
      } else if (!resolvedRegionId) {
        if (autoRegionDisabled !== false) setAutoRegionDisabled(false);
      }

      const currBranch = form.getValues('branchId');
      if (resolvedBranchId && String(currBranch) !== String(resolvedBranchId)) {
        form.setValue('branchId', resolvedBranchId as any);
        if (autoBranchDisabled !== !shouldDisableRegion) setAutoBranchDisabled(!shouldDisableRegion);

        // populate counsellor/admission officer based on branch employees
        try {
          const links = Array.isArray(branchEmps) ? branchEmps : [];
          const userIds = (links as any[]).filter((be: any) => String(be.branchId ?? be.branch_id) === String(resolvedBranchId)).map((be:any)=>String(be.userId ?? be.user_id));
          if (userIds.length > 0) {
            const counsellor = (users || []).find((u:any)=>userIds.includes(String(u.id)) && String(u.role || u.role_name || u.roleName).toLowerCase().includes('counsel'));
            const officer = (users || []).find((u:any)=>userIds.includes(String(u.id)) && String(u.role || u.role_name || u.roleName).toLowerCase().includes('admission'));
            if (counsellor && !form.getValues('counsellorId')) form.setValue('counsellorId', String(counsellor.id));
            if (officer && !form.getValues('admissionOfficerId')) form.setValue('admissionOfficerId', String(officer.id));
          }
        } catch {}
      } else if (!resolvedBranchId && resolvedRegionId && !form.getValues('branchId')) {
        if (form.getValues('branchId') !== '') form.setValue('branchId', '');
        if (autoBranchDisabled !== false) setAutoBranchDisabled(false);
      }

      if (!(resolvedRegionId || resolvedBranchId)) {
        if (autoRegionDisabled !== false) setAutoRegionDisabled(false);
        if (autoBranchDisabled !== false) setAutoBranchDisabled(false);
      }
    } catch {}
  }, [open, (user as any)?.id, (user as any)?.role, regions, branches, branchEmps, users]);

  const handleApplicationChange = (appId: string) => {
    const selectedApp = applications?.find(app => String(app.id) === String(appId));
    if (selectedApp) {
      form.setValue('applicationId', String(selectedApp.id));
      form.setValue('studentId', selectedApp.studentId);
      form.setValue('university', selectedApp.university || '');
      form.setValue('program', selectedApp.program || '');
      try {
        const anyApp: any = selectedApp as any;
        if (anyApp.regionId) form.setValue('regionId', String(anyApp.regionId));
        if (anyApp.branchId) form.setValue('branchId', String(anyApp.branchId));
        const resolveUserIdFromApp = (appId:any) => {
          if (!appId) return undefined;
          const idStr = String(appId);
          const u = (users || []).find((x:any) => String(x.id) === idStr);
          if (u) return String(u.id);
          const be = (branchEmps || []).find((b:any) => String(b.id) === idStr || String(b.userId ?? b.user_id) === idStr);
          if (be) return String(be.userId ?? be.user_id);
          return undefined;
        };
        // Clear to avoid stale selections while lookups happen
        form.setValue('counsellorId', '');
        form.setValue('admissionOfficerId', '');
        const sourceCounsellor = anyApp.counsellorId ?? anyApp.counselorId ?? anyApp.counsellor_id ?? anyApp.counselor_id;
        const resolvedC = resolveUserIdFromApp(sourceCounsellor);
        console.log('[AddAdmissionModal] handleApplicationChange counsellor source:', { sourceCounsellor, resolvedC });
        if (resolvedC) { form.setValue('counsellorId', resolvedC); console.log('[AddAdmissionModal] handleApplicationChange set counsellorId to', resolvedC); }
        const sourceOfficer = anyApp.admissionOfficerId ?? anyApp.admission_officer_id ?? anyApp.officerId ?? anyApp.officer_id;
        const resolvedO = resolveUserIdFromApp(sourceOfficer);
        console.log('[AddAdmissionModal] handleApplicationChange officer source:', { sourceOfficer, resolvedO });
        if (resolvedO) { form.setValue('admissionOfficerId', resolvedO); console.log('[AddAdmissionModal] handleApplicationChange set admissionOfficerId to', resolvedO); }
      } catch {}
    }
  };

  const openApplicationDetails = (app: Application) => {
    setCurrentApplicationObj(app);
    try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAppDetailsOpen(true)); } catch { setIsAppDetailsOpen(true); }
  };

  const openStudentProfile = (sid: string) => {
    setCurrentStudentIdLocal(sid);
    try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsStudentProfileOpen(true)); } catch { setIsStudentProfileOpen(true); }
  };

  // Populate counsellor/admission officer only after branch is selected
  React.useEffect(() => {
    try {
      const bid = String(form.getValues('branchId') || '');
      if (!bid) {
        // clear selections when branch cleared
        if (form.getValues('counsellorId') !== '') form.setValue('counsellorId', '');
        if (form.getValues('admissionOfficerId') !== '') form.setValue('admissionOfficerId', '');
        return;
      }
      const links = Array.isArray(branchEmps) ? branchEmps : [];
      const userIds = (links as any[]).filter((be:any)=>String(be.branchId ?? be.branch_id) === bid).map((be:any)=>String(be.userId ?? be.user_id));
      if (userIds.length === 0) return;
      const counsellor = (users || []).find((u:any)=>userIds.includes(String(u.id)) && normalizeRole(u.role||u.role_name||u.roleName).includes('counsel'));
      const officer = (users || []).find((u:any)=>userIds.includes(String(u.id)) && normalizeRole(u.role||u.role_name||u.roleName).includes('admission'));
      if (counsellor && !form.getValues('counsellorId')) form.setValue('counsellorId', String(counsellor.id));
      if (officer && !form.getValues('admissionOfficerId')) form.setValue('admissionOfficerId', String(officer.id));
    } catch {}
  }, [branchId, branchEmps, users]);

  const handleSubmitClick = () => {
    try {
      form.handleSubmit((data) => {
        console.log('[AddAdmissionModal] onSubmit called with', data);
        createMutation.mutate(data);
      }, (errors) => {
        const missing = Object.keys(errors || {});
        console.error('[AddAdmissionModal] Missing required fields:', missing);
        try { toast({ title: 'Validation', description: `Missing fields: ${missing.join(', ')}`, variant: 'destructive' }); } catch {}
      })();
    } catch (e) {
      console.error('[AddAdmissionModal] handleSubmitClick error:', e);
    }
  };

  return (
    <>
      <DetailsDialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title="Add Admission"
        headerClassName="bg-[#223E7D] text-white"
        contentClassName="no-not-allowed w-[65vw] max-w-7xl max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl"
        headerLeft={(
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-semibold leading-tight truncate">Add New Admission</div>
              <div className="text-xs opacity-90 truncate">Create a university admission record for a student</div>
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
            <div className="flex flex-col items-end">
              <Button
                type="button"
                onClick={() => { handleSubmitClick(); }}
                disabled={createMutation.isPending}
                className="px-3 h-8 text-xs bg-[#0071B0] hover:bg-[#00649D] text-white rounded-md disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <span>Save</span>
                )}
              </Button>
            </div>
          </div>
        )}
        leftContent={(
          <div className="flex h-full">
            <div className="flex-1 overflow-y-auto p-6 pt-2">
              <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit, (errors) => { console.warn('[AddAdmissionModal] validation errors on form submit:', errors); })(); }} className="space-y-6">
                  {/* Linked Entities Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Linked Entities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <FormLabel>Student</FormLabel>
                          <div className="mt-1">
                            {studentId || form.getValues('studentId') ? (
                              <Button type="button" variant="link" className="p-0 h-8" onClick={() => { const sid = studentId || form.getValues('studentId'); if (sid) openStudentProfile(sid); }}>
                                {(() => {
                                  const sid = studentId || form.getValues('studentId');
                                  const s = students?.find((x) => x.id === sid);
                                  return s?.name || sid || 'Student';
                                })()}
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">Select application to link student</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <FormLabel>Application</FormLabel>
                          <div className="mt-1">
                            {(() => {
                              const aid = String(form.watch('applicationId') || applicationId || '');
                              if (!aid) return (
                                <Popover open={applicationDropdownOpen} onOpenChange={setApplicationDropdownOpen}>
                                  <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" className={cn(!form.getValues('applicationId') && 'text-muted-foreground')}>Select application <ChevronsUpDown className="ml-2 h-4 w-4" /></Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Search by student name, email, or university..." />
                                      <CommandList>
                                        <CommandEmpty>No applications found.</CommandEmpty>
                                        <CommandGroup>
                                          {applications?.map((app) => {
                                            const student = students?.find((s) => s.id === app.studentId);
                                            return (
                                              <CommandItem key={String(app.id)} onSelect={() => { handleApplicationChange(String(app.id)); setApplicationDropdownOpen(false); }}>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">{student?.name}</span>
                                                  <span className="text-sm text-gray-500">{student?.email}</span>
                                                  <span className="text-sm text-blue-600">{app.university} - {app.program}</span>
                                                </div>
                                              </CommandItem>
                                            );
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              );

                              const selectedApp = applications?.find((a) => String(a.id) === aid);
                              if (!selectedApp) return <div className="text-sm text-gray-700">{aid}</div>;
                              return (
                                <Button type="button" variant="link" className="p-0 h-8 text-sm" onClick={() => openApplicationDetails(selectedApp)}>
                                  {selectedApp.applicationCode || `${selectedApp.university} — ${selectedApp.program}`}
                                </Button>
                              );
                            })()}
                          </div>
                        </div>

                        <div>
                          <FormLabel>University</FormLabel>
                          <Input value={form.watch('university') || ''} disabled placeholder="Select application" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overview Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Status</FormLabel>
                          <Select value={form.watch('status') || ''} onValueChange={(v) => form.setValue('status', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions?.map((opt: any) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label || opt.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <FormLabel>Case Status</FormLabel>
                          <Select value={form.watch('caseStatus') || ''} onValueChange={(v) => form.setValue('caseStatus', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                            <SelectContent>
                              {caseStatusOptions?.map((opt: any) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label || opt.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Access Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Region</FormLabel>
                          <Select value={form.watch('regionId') || ''} onValueChange={(v) => { form.setValue('regionId', v); form.setValue('branchId', ''); form.setValue('counsellorId', ''); form.setValue('admissionOfficerId', ''); }} disabled={autoRegionDisabled || ['regional_manager','branch_manager','counselor','counsellor','admission_officer'].includes(getNormalizedRole())}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              {regionOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <FormLabel>Branch</FormLabel>
                          <Select value={form.watch('branchId') || ''} onValueChange={(v) => {
                            const b = (branchOptions as any[]).find((x: any) => String(x.value) === String(v));
                            form.setValue('branchId', v);
                            form.setValue('counsellorId', '');
                            form.setValue('admissionOfficerId', '');
                            if (!form.getValues('regionId') && b) form.setValue('regionId', String(b.regionId || ''));
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                            <SelectContent>
                              {branchOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <FormLabel>Counsellor</FormLabel>
                          <Select value={form.watch('counsellorId') || ''} onValueChange={(v) => form.setValue('counsellorId', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select counsellor" />
                            </SelectTrigger>
                            <SelectContent>
                              {counsellorOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <FormLabel>Admission Officer</FormLabel>
                          <Select value={form.watch('admissionOfficerId') || ''} onValueChange={(v) => form.setValue('admissionOfficerId', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select admission officer" />
                            </SelectTrigger>
                            <SelectContent>
                              {officerOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financials & Dates Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Financials & Dates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <FormLabel>Full Tuition Fee</FormLabel>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={form.watch('fullTuitionFee') || ''}
                            onChange={(e) => form.setValue('fullTuitionFee', String(e.target.value).replace(/[^0-9.]/g, ''))}
                            placeholder="e.g., 20000"
                          />
                        </div>

                        <div>
                          <FormLabel>Scholarship</FormLabel>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={form.watch('scholarshipAmount') || ''}
                            onChange={(e) => form.setValue('scholarshipAmount', String(e.target.value).replace(/[^0-9.]/g, ''))}
                            placeholder="e.g., 5000"
                          />
                        </div>

                        <div>
                          <FormLabel>Net Tuition</FormLabel>
                          <Input value={form.watch('netTuitionFee') || ''} disabled />
                        </div>

                        <div>
                          <FormLabel>Initial Deposit</FormLabel>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={form.watch('initialDeposit') || ''}
                            onChange={(e) => form.setValue('initialDeposit', String(e.target.value).replace(/[^0-9.]/g, ''))}
                            placeholder="e.g., 500"
                          />
                        </div>

                        <div>
                          <FormLabel>Deposit Date</FormLabel>
                          <Input type="date" value={form.watch('depositDate') ? new Date(form.watch('depositDate')).toISOString().split('T')[0] : ''} onChange={(e) => form.setValue('depositDate', e.target.value)} />
                        </div>

                        <div>
                          <FormLabel>Visa Date</FormLabel>
                          <Input type="date" value={form.watch('visaDate') ? new Date(form.watch('visaDate')).toISOString().split('T')[0] : ''} onChange={(e) => form.setValue('visaDate', e.target.value)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Others Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Others</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <FormLabel>Google Drive Link</FormLabel>
                        <Input value={form.watch('googleDriveLink') || ''} onChange={(e) => form.setValue('googleDriveLink', e.target.value)} placeholder="https://drive.google.com/..." />
                      </div>
                    </CardContent>
                  </Card>

                </form>
              </Form>
            </div>

          </div>
        )}
      />

      {/* Details Modals */}
      <ApplicationDetailsModal open={isAppDetailsOpen} onOpenChange={setIsAppDetailsOpen} application={currentApplicationObj} onOpenStudentProfile={(sid) => openStudentProfile(sid)} />
      <StudentProfileModal open={isStudentProfileOpen} onOpenChange={setIsStudentProfileOpen} studentId={currentStudentIdLocal} onOpenApplication={(app) => { setCurrentApplicationObj(app); try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAppDetailsOpen(true)); } catch { setIsAppDetailsOpen(true); } }} />
    </>
  );
}
