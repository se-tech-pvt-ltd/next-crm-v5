import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import * as RegService from '@/services/event-registrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SearchableSelectV2 as SearchableSelect } from '@/components/ui/searchable-select-v2';
import { SearchableComboboxV3 as SearchableCombobox } from '@/components/ui/searchable-combobox-v3';
import { MultiSelectV4 as MultiSelect } from '@/components/ui/multi-select-v4';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { insertLeadSchema } from '@/lib/types';
import { LEADS_DROPDOWNS, TYPE_OPTIONS, STATUS_OPTIONS, SOURCE_OPTIONS, INTERESTED_COUNTRY_OPTIONS, STUDY_LEVEL_OPTIONS, STUDY_PLAN_OPTIONS, keyFromLabel, labelFrom } from '@/constants/leads-dropdowns';
import * as LeadsService from '@/services/leads';
import * as EventsService from '@/services/events';
import * as StudentsService from '@/services/students';
import * as BranchesService from '@/services/branches';
import * as RegionsService from '@/services/regions';
import * as BranchEmpsService from '@/services/branchEmps';
import * as UsersService from '@/services/users';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Globe,
  FileText,
  Users,
  Target,
  BookOpen,
  ArrowLeft,
  Save,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { z } from 'zod';

const addLeadFormSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  status: z.string().min(1, 'Status is required'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().min(1, 'Email is required').email('Valid email is required'),
  city: z.string().min(1, 'City is required'),
  source: z.string().min(1, 'Source is required'),
  medium: z.string().optional(),
  country: z.array(z.string()).min(1, 'At least one country is required'),
  studyLevel: z.string().min(1, 'Study level is required'),
  studyPlan: z.string().min(1, 'Study plan is required'),
  elt: z.enum(['yes', 'no'], { required_error: 'English test selection is required' }),
  regionId: z.string().min(1, 'Region is required'),
  branchId: z.string().min(1, 'Branch is required'),
  counsellorId: z.string().min(1, 'Counsellor is required'),
  admissionOfficerId: z.string().min(1, 'Admission officer is required'),
  // legacy: keep for compatibility
  counselorId: z.string().optional(),
  notes: z.string().min(1, 'Notes are required'),
});

type AddLeadFormData = z.infer<typeof addLeadFormSchema>;

export interface AddLeadFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  showBackButton?: boolean;
  initialData?: Partial<any>;
  onRegisterSubmit?: (submit: () => void) => void;
}

export default function AddLeadForm({ onCancel, onSuccess, showBackButton = false, initialData, onRegisterSubmit }: AddLeadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [counselorSearchQuery, setCounselorSearchQuery] = useState('');
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [searchingCounselors, setSearchingCounselors] = useState(false);

  const [emailDuplicateStatus, setEmailDuplicateStatus] = useState<{
    isDuplicate: boolean;
    type?: 'lead' | 'student';
    message?: string;
  }>({ isDuplicate: false });
  const [phoneDuplicateStatus, setPhoneDuplicateStatus] = useState<{
    isDuplicate: boolean;
    type?: 'lead' | 'student';
    message?: string;
  }>({ isDuplicate: false });
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [autoRegionDisabled, setAutoRegionDisabled] = useState(false);
  const [autoBranchDisabled, setAutoBranchDisabled] = useState(false);

  const dropdownData = null as any;

  const { data: existingLeads } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: async () => LeadsService.getLeads()
  });

  const { data: existingStudents } = useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => StudentsService.getStudents()
  });

  const { user } = useAuth();

  const { data: usersList, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => UsersService.getUsers(),
  });

  const { data: regionsList = [] } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: () => RegionsService.listRegions(),
    staleTime: 60000,
  });

  const { data: branchEmps = [] } = useQuery({
    queryKey: ['/api/branch-emps'],
    queryFn: () => BranchEmpsService.listBranchEmps(),
    staleTime: 60000,
  });

  const { data: branchesList = [] } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: () => BranchesService.listBranches(),
    staleTime: 30000,
  });

  const formRef = useRef<HTMLFormElement | null>(null);

  const submitForm = useCallback(() => {
    try {
      const el = formRef.current;
      if (!el) return;
      if (typeof (el as any).requestSubmit === 'function') {
        (el as any).requestSubmit();
      } else {
        const btn = el.querySelector('#add-lead-form-submit') as HTMLButtonElement | null;
        if (btn) btn.click();
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (onRegisterSubmit) onRegisterSubmit(submitForm);
    } catch {}
  }, [onRegisterSubmit, submitForm]);

  const form = useForm<AddLeadFormData>({
    resolver: zodResolver(addLeadFormSchema),
    defaultValues: {
      type: '',
      status: '',
      name: '',
      phone: '',
      email: '',
      city: '',
      source: '',
      medium: '',
      country: [],
      studyLevel: '',
      studyPlan: '',
      elt: '',
      regionId: '',
      branchId: '',
      counsellorId: '',
      admissionOfficerId: '',
      counselorId: '',
      notes: '',
    },
  });

  const selectedRegionId = (form?.watch?.('regionId') || '') as string;
  const selectedBranchId = (form?.watch?.('branchId') || '') as string;
  const selectedSourceKey = (form?.watch?.('source') || '') as string;

  const { data: eventsListRaw } = useQuery({
    queryKey: ['/api/events'],
    queryFn: () => EventsService.getEvents(),
    staleTime: 60000,
  });

  const resolveSourceLabel = useCallback((key: string) => {
    const val = labelFrom('source', String(key));
    return String(val || key || '').toLowerCase();
  }, []);

  const mediumOptions = useMemo(() => {
    const label = resolveSourceLabel(selectedSourceKey);
    const eventsList = Array.isArray(eventsListRaw) ? eventsListRaw : (eventsListRaw as any)?.data;
    if (label.includes('paid')) {
      return [
        { label: 'Meta', value: 'meta' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'Google Ads', value: 'google ads' },
      ];
    }
    if (label.includes('social')) {
      return [
        { label: 'Facebook', value: 'facebook' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'YouTube', value: 'youtube' },
      ];
    }
    if (label.includes('event')) {
      const names = (Array.isArray(eventsList) ? eventsList : []).map((e: any) => String(e.name || e.eventName || e.title || '')).filter((s) => s);
      return names.map((n) => ({ label: n, value: n }));
    }
    if (label.includes('outdoor')) {
      return [
        { label: 'Billboard', value: 'billboard' },
        { label: 'Streamers', value: 'streamers' },
      ];
    }
    return [] as { label: string; value: string }[];
  }, [selectedSourceKey, resolveSourceLabel, eventsListRaw]);

  useEffect(() => {
    // Clear medium and its validation errors when source changes
    try { form.setValue('medium', ''); form.clearErrors('medium'); } catch {}
  }, [selectedSourceKey]);

  const normalizeRole = (r?: string) => String(r || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
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

  const isBranchManager = (() => {
    try {
      const rn = getNormalizedRole();
      return rn === 'branch_manager' || rn === 'branchmanager' || rn === 'branch-manager';
    } catch { return false; }
  })();

  const isAdmissionOfficer = (() => {
    try {
      const rn = getNormalizedRole();
      return rn === 'admission_officer' || rn === 'admission officer' || rn === 'admissionofficer';
    } catch { return false; }
  })();

  const isCounsellor = (() => {
    try {
      const rn = getNormalizedRole();
      return rn === 'counselor' || rn === 'counsellor' || rn === 'counsellor';
    } catch { return false; }
  })();

  const regionOptions = (Array.isArray(regionsList) ? regionsList : []).map((r: any) => ({
    label: String(r.regionName || r.name || 'Unknown'),
    value: String(r.id),
  }));

  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkEmailDuplicate = useCallback(
    (email: string) => {
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
      if (!email || !email.includes('@')) {
        setEmailDuplicateStatus({ isDuplicate: false });
        setCheckingEmail(false);
        return;
      }
      setCheckingEmail(true);
      emailTimeoutRef.current = setTimeout(async () => {
        try {
          const leadsData = Array.isArray(existingLeads) ? existingLeads : existingLeads?.data;
          if (Array.isArray(leadsData)) {
            const duplicateLead = leadsData.find(
              (lead: any) => lead.email?.toLowerCase() === email.toLowerCase()
            );
            if (duplicateLead) {
              setEmailDuplicateStatus({
                isDuplicate: true,
                type: 'lead',
                message: 'This email already exists as a lead'
              });
              setCheckingEmail(false);
              return;
            }
          }

          const studentsData = Array.isArray(existingStudents) ? existingStudents : existingStudents?.data;
          if (Array.isArray(studentsData)) {
            const duplicateStudent = studentsData.find(
              (student: any) => student.email?.toLowerCase() === email.toLowerCase()
            );
            if (duplicateStudent) {
              setEmailDuplicateStatus({
                isDuplicate: true,
                type: 'student',
                message: 'This contact is already registered as a student'
              });
              setCheckingEmail(false);
              return;
            }
          }

          setEmailDuplicateStatus({ isDuplicate: false });
          setCheckingEmail(false);
        } catch (error) {
          console.error('Error checking email duplicate:', error);
          setEmailDuplicateStatus({ isDuplicate: false });
          setCheckingEmail(false);
        }
      }, 300);
    },
    [existingLeads, existingStudents]
  );

  const phoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkPhoneDuplicate = useCallback(
    (phone: string) => {
      if (phoneTimeoutRef.current) clearTimeout(phoneTimeoutRef.current);
      if (!phone || phone.length < 3) {
        setPhoneDuplicateStatus({ isDuplicate: false });
        setCheckingPhone(false);
        return;
      }
      setCheckingPhone(true);
      phoneTimeoutRef.current = setTimeout(async () => {
        try {
          const leadsData = Array.isArray(existingLeads) ? existingLeads : existingLeads?.data;
          if (Array.isArray(leadsData)) {
            const duplicateLead = leadsData.find((lead: any) => lead.phone === phone);
            if (duplicateLead) {
              setPhoneDuplicateStatus({
                isDuplicate: true,
                type: 'lead',
                message: 'This phone number already exists as a lead'
              });
              setCheckingPhone(false);
              return;
            }
          }

          const studentsData = Array.isArray(existingStudents) ? existingStudents : existingStudents?.data;
          if (Array.isArray(studentsData)) {
            const duplicateStudent = studentsData.find((student: any) => student.phone === phone);
            if (duplicateStudent) {
              setPhoneDuplicateStatus({
                isDuplicate: true,
                type: 'student',
                message: 'This phone number is already registered to a student'
              });
              setCheckingPhone(false);
              return;
            }
          }

          setPhoneDuplicateStatus({ isDuplicate: false });
          setCheckingPhone(false);
        } catch (error) {
          console.error('Error checking phone duplicate:', error);
          setPhoneDuplicateStatus({ isDuplicate: false });
          setCheckingPhone(false);
        }
      }, 300);
    },
    [existingLeads, existingStudents]
  );


  const branchOptions = (Array.isArray(branchesList) ? branchesList : [])
    .filter((b: any) => !selectedRegionId || String(b.regionId ?? b.region_id ?? '') === String(selectedRegionId))
    .filter((b: any) => {
      const q = branchSearchQuery.trim().toLowerCase();
      if (!q) return true;
      const name = String(b.branchName || b.name || '').toLowerCase();
      const city = String(b.city || '').toLowerCase();
      const country = String(b.country || '').toLowerCase();
      return name.includes(q) || city.includes(q) || country.includes(q);
    })
    .map((b: any) => ({
      label: String(b.branchName || b.name || 'Unknown'),
      value: String(b.id),
      subtitle: [b.city, b.country].filter(Boolean).join(', ') || undefined,
    }));

  const counselorOptions = Array.isArray(usersList)
    ? usersList
        .filter((u: any) => {
          const r = normalizeRole(u.role || u.role_name || u.roleName);
          return r === 'counselor' || r === 'counsellor';
        })
        .filter((u: any) => {
          // Only include counselors when a branch is selected
          if (!selectedBranchId) return false;
          const links = Array.isArray(branchEmps) ? branchEmps : [];
          return links.some((be: any) => String(be.userId ?? be.user_id) === String(u.id) && String(be.branchId ?? be.branch_id) === String(selectedBranchId));
        })
        .filter((u: any) =>
          counselorSearchQuery === '' ||
          String((u.firstName || '') + ' ' + (u.lastName || '')).toLowerCase().includes(counselorSearchQuery.toLowerCase())
        )
        .map((u: any) => {
          const displayName = (`${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim()) || String(u.full_name || u.fullName || u.name || '');
          return {
            label: displayName,
            value: String(u.id),
          };
        })
    : [];

  const admissionOfficerOptions = Array.isArray(usersList)
    ? usersList
        .filter((u: any) => {
          const r = normalizeRole(u.role || u.role_name || u.roleName);
          return r === 'admission_officer' || r === 'admission officer' || r === 'admissionofficer';
        })
        .filter((u: any) => {
          // Include the current user when no branch is selected so admission officer sees themselves
          if (!selectedBranchId) {
            try {
              const myRole = getNormalizedRole();
              if ((myRole === 'admission_officer' || myRole === 'admission officer' || myRole === 'admissionofficer') && String((user as any)?.id) === String(u.id)) return true;
            } catch {}
            return false;
          }
          const links = Array.isArray(branchEmps) ? branchEmps : [];
          return links.some((be: any) => String(be.userId ?? be.user_id) === String(u.id) && String(be.branchId ?? be.branch_id) === String(selectedBranchId));
        })
        .map((u: any) => {
          const displayName = (`${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim()) || String(u.full_name || u.fullName || u.name || '');
          return {
            label: displayName,
            value: String(u.id),
          };
        })
    : [];

  const handleCounselorSearch = useCallback((query: string) => {
    setCounselorSearchQuery(query);
    if (query.length > 0) {
      setSearchingCounselors(true);
      setTimeout(() => setSearchingCounselors(false), 300);
    } else {
      setSearchingCounselors(false);
    }
  }, []);

  const handleBranchSearch = useCallback((query: string) => {
    setBranchSearchQuery(query);
  }, []);


  const createLeadMutation = useMutation({
    mutationFn: async (data: AddLeadFormData) => LeadsService.createLead(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/stats'] });
      toast({
        title: 'Success! 🎉',
        description: 'Lead has been created successfully and added to your pipeline.',
      });

      // If opened from an event registration, mark registration converted
      try {
        if (initialData && (initialData as any).eventRegId) {
          await RegService.updateRegistration((initialData as any).eventRegId, { isConverted: 1, is_converted: 1 });
          queryClient.invalidateQueries({ queryKey: ['/api/event-registrations'] });
        }
      } catch (e) {
        // ignore
      }

      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create lead. Please check your connection and try again.',
        variant: 'destructive',
      });
    },
  });

  // Reset form values when initialData provided
  useEffect(() => {
    const hasInitial = Boolean(initialData && Object.keys(initialData || {}).length > 0);
    const isFromEvent = Boolean(initialData && (initialData as any).eventRegId);

    if (hasInitial) {
      const mapLabelToKeyHardcoded = (section: 'type' | 'status' | 'source' | 'interested_country' | 'study_level' | 'study_plan', label?: string) => {
        if (!label) return '';
        const key = keyFromLabel(section, label);
        return key || label;
      };

      const defaultTypeLabel = (initialData as any).eventRegId ? 'Direct' : undefined;
      let defaultStatusKey: string | undefined = undefined;
      if ((initialData as any).eventRegId && !((initialData as any).status)) {
        defaultStatusKey = 'raw';
      }
      const defaultSourceLabel = (initialData as any).eventRegId ? 'Events' : undefined;

      const mapLabelToKeyRobust = (section: 'type' | 'status' | 'source' | 'interested_country' | 'study_level' | 'study_plan', label?: string) => {
        const mapped = mapLabelToKeyHardcoded(section, label);
        if (mapped && mapped !== label) return mapped;
        return label || '';
      };

      const values: any = {
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        city: initialData.city || '',
        source: mapLabelToKeyRobust('source', initialData.source || defaultSourceLabel),
        // If this is from an event registration, force status to 'raw' regardless of incoming value
        status: (initialData && (initialData as any).eventRegId) ? 'raw' : (initialData.status ? mapLabelToKeyRobust('status', initialData.status) : defaultStatusKey),
        counselorId: initialData.counselorId || initialData.counsellorId || '',
        country: Array.isArray(initialData.country) ? initialData.country : (initialData.country ? [initialData.country] : []),
        program: initialData.program || '',
        type: mapLabelToKeyRobust('type', initialData.type || defaultTypeLabel),
        // populate region/branch/counsellor/admission defaults when provided (usually from an event)
        regionId: initialData.regionId || initialData.region_id || '',
        branchId: initialData.branchId || initialData.branch_id || '',
        counsellorId: initialData.counsellorId || initialData.counselorId || initialData.counsellor_id || initialData.counselor_id || '',
        admissionOfficerId: initialData.admissionOfficerId || initialData.admission_officer_id || '',
      };
      form.reset(values);

      // If this is from an event registration, try to auto-select the event name as medium
      try {
        if (initialData && (initialData as any).eventRegId) {
          const evtId = (initialData as any).eventId || (initialData as any).event_id;
          const eventsList = Array.isArray(eventsListRaw) ? eventsListRaw : (eventsListRaw as any)?.data || [];
          let eventName: string | undefined = undefined;
          if (evtId) {
            const found = (eventsList || []).find((e: any) => String(e.id) === String(evtId));
            if (found) eventName = String(found.name || found.eventName || found.title || '');
          }
          // fallback: if registration has an event name directly
          if (!eventName && ((initialData as any).eventName || (initialData as any).event_name)) {
            eventName = String((initialData as any).eventName || (initialData as any).event_name);
          }
          if (eventName) {
            try { form.setValue('medium', eventName); } catch {}
          }
        }
      } catch {}
      // If initial data provides region/branch defaults (from an event), ensure selects are enabled so values show
      try {
        const hasRegion = Boolean(values.regionId);
        const hasBranch = Boolean(values.branchId);
        if (hasRegion) setAutoRegionDisabled(false);
        if (hasBranch) setAutoBranchDisabled(false);
        // ensure counsellor/admission values are applied (in case options are available)
        if (values.counsellorId) form.setValue('counsellorId', values.counsellorId);
        if (values.admissionOfficerId) form.setValue('admissionOfficerId', values.admissionOfficerId);

        // If a counsellor is provided but branch is not, attempt to resolve branch from branchEmps and set it
        try {
          if (values.counsellorId && !values.branchId) {
            const links = Array.isArray(branchEmps) ? branchEmps : [];
            const match = links.find((x: any) => String(x.userId ?? x.user_id) === String(values.counsellorId));
            if (match) {
              const bid = String(match.branchId ?? match.branch_id ?? '');
              if (bid) {
                form.setValue('branchId', bid);
                // also try to set region from branchesList
                const b = (Array.isArray(branchesList) ? branchesList : []).find((bb: any) => String(bb.id) === bid);
                if (b) form.setValue('regionId', String(b.regionId ?? b.region_id ?? ''), { shouldDirty: true, shouldValidate: true });
              }
            }
          }
        } catch {}
      } catch {}

      // If this initial data is from an event registration and no explicit status/type provided, ensure defaults
      if (isFromEvent) {
        try { if (!form.getValues('status')) form.setValue('status', 'raw'); } catch {}
        try { if (!form.getValues('type')) form.setValue('type', 'direct'); } catch {}
      }
    } else {
      // Creation flow (/leads/new) - hide fields and set defaults
      try {
        form.setValue('status', 'raw');
        form.setValue('type', 'direct');
      } catch {}
    }
  }, [initialData, dropdownData]);

  // Auto-select region/branch based on JWT and assignments
  useEffect(() => {
    try {
      if (initialData && (initialData.regionId || initialData.region_id || initialData.branchId || initialData.branch_id)) return;

      const currentRegion = String(form.getValues('regionId') || '');
      const currentBranch = String(form.getValues('branchId') || '');
      if (currentRegion && currentBranch) return;

      const existingCounsellorIdRaw = form.getValues('counsellorId');
      const existingAdmissionOfficerIdRaw = form.getValues('admissionOfficerId');
      const existingCounsellorId = existingCounsellorIdRaw ? String(existingCounsellorIdRaw) : '';
      const existingAdmissionOfficerId = existingAdmissionOfficerIdRaw ? String(existingAdmissionOfficerIdRaw) : '';

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
        } else if (roleName === 'regional_manager') {
          const r = (Array.isArray(regionsList) ? regionsList : []).find((rr: any) => String(rr.regionHeadId ?? rr.region_head_id) === String((user as any)?.id));
          if (r?.id) resolvedRegionId = String(r.id);
        }
      }

      if (!resolvedBranchId && (roleName === 'branch_manager' || roleName === 'counselor' || roleName === 'counsellor' || roleName === 'admission_officer')) {
        const branches = Array.isArray(branchesList) ? branchesList : [];
        const links = Array.isArray(branchEmps) ? branchEmps : [];
        let userBranchId = '' as string;
        const headBranch = branches.find((b: any) => String(b.branchHeadId ?? b.branch_head_id) === String((user as any)?.id));
        if (headBranch) userBranchId = String(headBranch.id);
        if (!userBranchId) {
          const be = links.find((x: any) => String(x.userId ?? x.user_id) === String((user as any)?.id));
          if (be) userBranchId = String(be.branchId ?? be.branch_id);
        }
        if (userBranchId) {
          resolvedBranchId = userBranchId;
          if (!resolvedRegionId) {
            const b = (Array.isArray(branchesList) ? branchesList : []).find((bb: any) => String(bb.id) === String(userBranchId));
            if (b) resolvedRegionId = String(b.regionId ?? b.region_id ?? '');
          }
        }
      }

      if (resolvedRegionId) {
        form.setValue('regionId', resolvedRegionId, { shouldDirty: true, shouldValidate: true });
        const roleDerived = getNormalizedRole();
        const isRegional = roleDerived === 'regional_manager' || roleDerived === 'regional_head';
        setAutoRegionDisabled(isRegional ? true : !isRegional);
      }

      if (resolvedBranchId) {
        form.setValue('branchId', resolvedBranchId, { shouldDirty: true, shouldValidate: true });
        const roleDerived = getNormalizedRole();
        const isRegional = roleDerived === 'regional_manager' || roleDerived === 'regional_head';
        setAutoBranchDisabled(!isRegional);
      } else if (resolvedRegionId && !currentBranch) {
        form.setValue('branchId', '');
        setAutoBranchDisabled(false);
      }

      if (resolvedRegionId || resolvedBranchId) {
        if (!existingCounsellorId) form.setValue('counsellorId', '');
        if (!existingAdmissionOfficerId) form.setValue('admissionOfficerId', '');
      } else {
        setAutoRegionDisabled(false);
        setAutoBranchDisabled(false);
      }

      const myId = String((user as any)?.id ?? '');
      const branchForAssignmentRaw = form.getValues('branchId') || resolvedBranchId;
      const branchForAssignment = branchForAssignmentRaw ? String(branchForAssignmentRaw) : '';
      const isAdmissionOfficerRole = roleName === 'admission_officer' || roleName === 'admission officer' || roleName === 'admissionofficer';
      if (!existingAdmissionOfficerId && isAdmissionOfficerRole && myId) {
        let canAssign = true;
        if (branchForAssignment) {
          const links = Array.isArray(branchEmps) ? branchEmps : [];
          canAssign = links.some((be: any) => String(be.userId ?? be.user_id) === myId && String(be.branchId ?? be.branch_id) === branchForAssignment);
        }
        if (canAssign) {
          form.setValue('admissionOfficerId', myId, { shouldDirty: false, shouldValidate: true });
        }
      }
    } catch {}
  }, [user, regionsList, branchesList, branchEmps, initialData, selectedBranchId]);

  // Ensure region is derived from selected branch if missing
  useEffect(() => {
    try {
      const rid = String(form.getValues('regionId') || '');
      const bid = String(form.getValues('branchId') || '');
      if (!rid && bid) {
        const branches = Array.isArray(branchesList) ? branchesList : [];
        const b = branches.find((x: any) => String(x.id) === String(bid));
        const regionFromBranch = String(b?.regionId ?? b?.region_id ?? '');
        if (regionFromBranch) {
          form.setValue('regionId', regionFromBranch, { shouldDirty: true, shouldValidate: true });
          const roleName = getNormalizedRole();
          const isRegional = roleName === 'regional_manager' || roleName === 'regional_head';
          setAutoRegionDisabled(isRegional ? true : !isRegional);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchesList, selectedBranchId]);

  const onSubmit = (data: AddLeadFormData) => {
    if (emailDuplicateStatus.isDuplicate) {
      toast({
        title: 'Duplicate Email',
        description: emailDuplicateStatus.message || 'This email already exists in the system.',
        variant: 'destructive',
      });
      return;
    }

    if (phoneDuplicateStatus.isDuplicate) {
      toast({
        title: 'Duplicate Phone',
        description: phoneDuplicateStatus.message || 'This phone number already exists in the system.',
        variant: 'destructive',
      });
      return;
    }

    const needsMedium = (() => {
      const lbl = resolveSourceLabel(data.source);
      return lbl.includes('paid') || lbl.includes('social') || lbl.includes('event') || lbl.includes('outdoor');
    })();
    if (needsMedium && !data.medium) {
      try { form.setError('medium' as any, { type: 'required', message: 'Lead Medium is required' }); } catch {}
      toast({ title: 'Lead Medium required', description: 'Please select a Lead Medium for the chosen Lead Source.', variant: 'destructive' });
      return;
    }

    const payload: any = { ...data };
    // If medium is not required/visible, explicitly send null so backend doesn't receive empty string
    if (!needsMedium) {
      payload.medium = null;
    }
    if (initialData && (initialData as any).eventRegId) {
      payload.eventRegId = (initialData as any).eventRegId;
    }

    // Normalize British/American spelling for backend schema
    if (!payload.counselorId && (payload as any).counsellorId) {
      payload.counselorId = (payload as any).counsellorId;
    }
    delete (payload as any).counsellorId;

    createLeadMutation.mutate(payload);
  };

  return (
    <div className="w-full max-w-none sm:max-w-4xl mx-auto px-2 sm:px-0">
      {showBackButton && (
        <div className="mb-4">
          <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" onClick={onCancel} className="flex items-center justify-center space-x-2 w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Leads</span>
            </Button>
          </motion.div>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          ref={(el) => { formRef.current = el; }}
        >

          <Card className="shadow-md border border-gray-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="w-5 h-5 text-primary" />
                <span>Personal Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Full Name *</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter full name"
                        className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20"
                        value={field.value}
                        onChange={(e) => {
                          let s = e.target.value.replace(/[^A-Za-z ]+/g, ' ');
                          s = s.replace(/\s+/g, ' ').replace(/^\s+/, '');
                          s = s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
                          field.onChange(s);
                        }}
                        onBlur={(e) => {
                          let s = (e.target.value || '').replace(/\s+/g, ' ').trim();
                          s = s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
                          field.onChange(s);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>City *</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter city"
                        className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20"
                        value={field.value}
                        onChange={(e) => {
                          let s = e.target.value.replace(/[^A-Za-z ]+/g, ' ');
                          s = s.replace(/\s+/g, ' ').replace(/^\s+/, '');
                          s = s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
                          field.onChange(s);
                        }}
                        onBlur={(e) => {
                          let s = (e.target.value || '').replace(/\s+/g, ' ').trim();
                          s = s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
                          field.onChange(s);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address *</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="name1@example.com"
                          className={`transition-all focus:ring-2 focus:ring-primary/20 ${emailDuplicateStatus.isDuplicate ? 'border-amber-500 focus:ring-amber-200' : ''}`}
                          value={field.value}
                          onKeyDown={(e) => { if (e.key === ' ' || e.code === 'Space' || (e as any).keyCode === 32) { e.preventDefault(); } }}
                          onChange={(e) => {
                            let s = (e.target.value || '').replace(/\s+/g, '');
                            // remove leading non-alphanumeric chars so it starts with a letter or number
                            s = s.replace(/^[^A-Za-z0-9]+/, '');
                            field.onChange(s);
                            checkEmailDuplicate(s);
                          }}
                          onBlur={(e) => {
                            let s = (e.target.value || '').replace(/\s+/g, '');
                            s = s.replace(/^[^A-Za-z0-9]+/, '');
                            field.onChange(s);
                          }}
                        />
                        {checkingEmail && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <div className="h-6 overflow-hidden">
                      {!emailDuplicateStatus.isDuplicate && <FormMessage />}
                      {emailDuplicateStatus.isDuplicate && (
                        <div className="flex items-center space-x-2 text-amber-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="truncate">{emailDuplicateStatus.message}</span>
                        </div>
                      )}
                    </div>
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone Number *</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <PhoneInput
                          value={field.value || ''}
                          onChange={(val) => { field.onChange(val); checkPhoneDuplicate(val); }}
                          defaultCountry="pk"
                          className="w-full"
                          inputClassName={`w-full h-7 text-sm ${phoneDuplicateStatus.isDuplicate ? 'ring-1 ring-amber-500 rounded-md' : ''}`}
                          buttonClassName="h-7"
                        />
                        {checkingPhone && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <div className="h-6 overflow-hidden">
                      {!phoneDuplicateStatus.isDuplicate && <FormMessage />}
                      {phoneDuplicateStatus.isDuplicate && (
                        <div className="flex items-center space-x-2 text-amber-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="truncate">{phoneDuplicateStatus.message}</span>
                        </div>
                      )}
                    </div>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-gray-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Academic Interests</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Interested Countries *</span>
                    </FormLabel>
                    <FormControl>
                      <MultiSelect value={field.value || []} onValueChange={field.onChange} placeholder="Select countries" searchPlaceholder="Search countries..." options={INTERESTED_COUNTRY_OPTIONS} emptyMessage="No countries found" maxDisplayItems={2} className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="studyLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Study Level *</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onValueChange={field.onChange} placeholder="Select study level" searchPlaceholder="Search study levels..." options={STUDY_LEVEL_OPTIONS} emptyMessage="No study levels found" className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />


                <FormField control={form.control} name="elt" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>English Language Test Completed *</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-row space-x-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="elt-yes" />
                          <Label htmlFor="elt-yes" className="text-sm font-normal cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="elt-no" />
                          <Label htmlFor="elt-no" className="text-sm font-normal cursor-pointer">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="studyPlan" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Study Plan *</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onValueChange={field.onChange} placeholder="Select study plan" searchPlaceholder="Search study plans..." options={STUDY_PLAN_OPTIONS} emptyMessage="No study plans found" className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-gray-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Lead Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem className={mediumOptions.length === 0 ? 'md:col-span-2' : ''}>
                      <FormLabel className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>Lead Source *</span>
                      </FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); try { form.setValue('medium', ''); } catch {} }} value={field.value} disabled={Boolean(initialData && (initialData as any).eventRegId)}>
                        <FormControl>
                          <SelectTrigger className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="How did they find us?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mediumOptions.length > 0 && (
                  <FormField
                    control={form.control}
                    name="medium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Lead Medium</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select medium" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mediumOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                              {/* Hide Status and Type when creating a new lead or converting from an event registration */}
                {(() => {
                  const hasInitial = Boolean(initialData && Object.keys(initialData || {}).length > 0);
                  const isFromEvent = Boolean(initialData && (initialData as any).eventRegId);
                  const shouldDisable = isFromEvent;
                  return (
                    <>
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Target className="w-4 h-4" />
                              <span>Status *</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={shouldDisable}>
                              <FormControl>
                                <SelectTrigger className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Lead Type *</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={shouldDisable}>
                              <FormControl>
                                <SelectTrigger className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-gray-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Record Access</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <FormField control={form.control} name="regionId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Region *</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue('branchId', ''); form.setValue('counsellorId', ''); form.setValue('admissionOfficerId', ''); setAutoRegionDisabled(false); setAutoBranchDisabled(false); }} placeholder="Select region" searchPlaceholder="Search regions..." options={regionOptions} emptyMessage="No regions found" className="h-10 text-sm leading-5 shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20" disabled={autoRegionDisabled || isBranchManager || isAdmissionOfficer} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="branchId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Branch *</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableCombobox value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue('counsellorId', ''); form.setValue('admissionOfficerId', ''); const rn = getNormalizedRole(); const isRegional = rn === 'regional_manager' || rn === 'regional_head'; setAutoBranchDisabled(!isRegional); setAutoRegionDisabled(isRegional ? true : !isRegional); }} onSearch={handleBranchSearch} options={branchOptions} loading={false} placeholder="Select branch" searchPlaceholder="Search branches..." emptyMessage={branchSearchQuery ? 'No branches found.' : 'Start typing to search branches...'} className="h-10 text-sm leading-5 shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20" disabled={autoBranchDisabled || isBranchManager || isAdmissionOfficer} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="counsellorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Counsellor *</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableCombobox value={field.value} onValueChange={field.onChange} onSearch={handleCounselorSearch} options={counselorOptions} loading={searchingCounselors || usersLoading} placeholder="Search and select counsellor..." searchPlaceholder="Type to search counsellors..." emptyMessage={counselorSearchQuery ? 'No counsellors found.' : 'Start typing to search counsellors...'} className="h-10 text-sm leading-5 shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20" disabled={isCounsellor && String(form.getValues('counsellorId') || form.getValues('counselorId') || '') === String((user as any)?.id || '')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="admissionOfficerId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Admission Officer *</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableCombobox value={field.value} onValueChange={field.onChange} onSearch={handleCounselorSearch} options={admissionOfficerOptions} loading={usersLoading} placeholder="Search and select officer..." searchPlaceholder="Type to search officers..." emptyMessage={counselorSearchQuery ? 'No officers found.' : 'Start typing to search officers...'} className="h-10 text-sm leading-5 shadow-sm border border-gray-300 bg-white focus:ring-2 focus:ring-primary/20" disabled={isAdmissionOfficer} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-gray-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Additional Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Notes & Comments *</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information about this lead, their goals, preferences, or special requirements..."
                      className="min-h-20 transition-all focus:ring-2 focus:ring-primary/20"
                      value={field.value}
                      onChange={(e) => {
                        let s = e.target.value || '';
                        if (s.length > 0) s = s.charAt(0).toUpperCase() + s.slice(1);
                        field.onChange(s);
                      }}
                      onBlur={(e) => {
                        let s = e.target.value || '';
                        if (s.length > 0) s = s.charAt(0).toUpperCase() + s.slice(1);
                        field.onChange(s);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="sr-only">
            <button type="submit" id="add-lead-form-submit" aria-hidden="true" tabIndex={-1}>Submit</button>
          </div>
        </form>
      </Form>
    </div>
  );
}
