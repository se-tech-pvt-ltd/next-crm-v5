import { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import * as RegService from '@/services/event-registrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SearchableSelectV2 as SearchableSelect } from '@/components/ui/searchable-select-v2';
import { SearchableComboboxV3 as SearchableCombobox } from '@/components/ui/searchable-combobox-v3';
import { MultiSelectV4 as MultiSelect } from '@/components/ui/multi-select-v4';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { insertLeadSchema } from '@/lib/types';
import * as DropdownsService from '@/services/dropdowns';
import * as LeadsService from '@/services/leads';
import * as StudentsService from '@/services/students';
import * as BranchesService from '@/services/branches';
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
  type: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required'),
  city: z.string().optional(),
  source: z.string().optional(),
  country: z.array(z.string()).optional(),
  studyLevel: z.string().optional(),
  studyPlan: z.string().optional(),
  elt: z.string().optional(),
  counselorId: z.string().optional(),
  branchId: z.string().optional(),
  notes: z.string().optional(),
});

type AddLeadFormData = z.infer<typeof addLeadFormSchema>;

export interface AddLeadFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  showBackButton?: boolean;
  initialData?: Partial<any>;
}

export default function AddLeadForm({ onCancel, onSuccess, showBackButton = false, initialData }: AddLeadFormProps) {
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

  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Leads')
  });

  const { data: existingLeads } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: async () => LeadsService.getLeads()
  });

  const { data: existingStudents } = useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => StudentsService.getStudents()
  });

  const { data: counselors, isLoading: counselorsLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: branchesList = [] } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: () => BranchesService.listBranches(),
    staleTime: 30000,
  });

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

  const counselorOptions = counselors 
    ? counselors
        .filter((user: any) => 
          counselorSearchQuery === '' || 
          user.name?.toLowerCase().includes(counselorSearchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(counselorSearchQuery.toLowerCase())
        )
        .map((user: any) => ({
          label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          value: user.id,
          subtitle: user.email !== user.name ? user.email : undefined
        }))
    : [];

  const branchOptions = (Array.isArray(branchesList) ? branchesList : [])
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
      country: [],
      studyLevel: '',
      studyPlan: '',
      elt: '',
      counselorId: '',
      branchId: '',
      notes: '',
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: AddLeadFormData) => LeadsService.createLead(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
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
    if (initialData) {
      // helper to map display label to dropdown key
      const mapLabelToKey = (group: string, label?: string) => {
        if (!label) return '';
        const list = (dropdownData && (dropdownData as any)[group]) || [];
        const found = list.find((opt: any) => {
          if (!opt) return false;
          const val = String(opt.value || opt.label || '').toLowerCase();
          const key = String(opt.key || opt.id || '').toLowerCase();
          return val === String(label).toLowerCase() || key === String(label).toLowerCase();
        });
        return found ? (found.key || found.id || found.value) : label;
      };

      // If opened from an event registration, prefer the specified defaults
      const defaultTypeLabel = (initialData as any).eventRegId ? 'Direct' : undefined;
      const defaultStatusLabel = (initialData as any).eventRegId ? 'Raw' : undefined;
      const defaultSourceLabel = (initialData as any).eventRegId ? 'Events' : undefined;

      const mapLabelToKeyRobust = (group: string, label?: string) => {
        const mapped = mapLabelToKey(group, label);
        if (mapped && mapped !== label) return mapped;
        // try case-insensitive contains match
        if (!dropdownData) return label || '';
        const list = (dropdownData as any)[group] || [];
        const lname = (label || '').toLowerCase();
        // first exact match on value or key
        for (const opt of list) {
          const val = String(opt.value || opt.label || '').toLowerCase();
          const key = String(opt.key || opt.id || '').toLowerCase();
          if (val === lname || key === lname) return opt.key || opt.id || opt.value;
        }
        // then contains
        for (const opt of list) {
          const val = String(opt.value || opt.label || '').toLowerCase();
          const key = String(opt.key || opt.id || '').toLowerCase();
          if (val.includes(lname) || key.includes(lname)) return opt.key || opt.id || opt.value;
        }
        return label || '';
      };

      const values: any = {
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        city: initialData.city || '',
        source: mapLabelToKeyRobust('Source', initialData.source || defaultSourceLabel),
        status: mapLabelToKeyRobust('Status', initialData.status || defaultStatusLabel),
        counselorId: initialData.counselorId || '',
        country: Array.isArray(initialData.country) ? initialData.country : (initialData.country ? [initialData.country] : []),
        program: initialData.program || '',
        type: mapLabelToKeyRobust('Type', initialData.type || defaultTypeLabel),
      };
      form.reset(values);
    } else if (dropdownData) {
      // No initial data: apply default selections from dropdownData if present
      try {
        const statusList = (dropdownData as any).Status || [];
        const defaultStatus = statusList.find((s: any) => Boolean(s.isDefault || s.is_default));
        if (defaultStatus && !form.getValues('status')) {
          form.setValue('status', defaultStatus.key || defaultStatus.id || defaultStatus.value);
        }
      } catch {}

      try {
        const sourceList = (dropdownData as any).Source || [];
        const defaultSource = sourceList.find((s: any) => Boolean(s.isDefault || s.is_default));
        if (defaultSource && !form.getValues('source')) {
          form.setValue('source', defaultSource.key || defaultSource.id || defaultSource.value);
        }
      } catch {}

      try {
        const typeList = (dropdownData as any).Type || [];
        const defaultType = typeList.find((s: any) => Boolean(s.isDefault || s.is_default));
        if (defaultType && !form.getValues('type')) {
          form.setValue('type', defaultType.key || defaultType.id || defaultType.value);
        }
      } catch {}
    }
  }, [initialData, dropdownData]);

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

    const payload: any = { ...data };
    if (initialData && (initialData as any).eventRegId) {
      payload.eventRegId = (initialData as any).eventRegId;
    }

    createLeadMutation.mutate(payload);
  };

  return (
    <div className="w-full max-w-none sm:max-w-4xl mx-auto px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
          {showBackButton && (
            <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }} className="sm:order-first">
              <Button variant="outline" onClick={onCancel} className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Leads</span>
              </Button>
            </motion.div>
          )}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Add New Lead</h1>
              <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">Capture lead information to start the student journey</p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="w-5 h-5 text-primary" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Full Name *</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" className="transition-all focus:ring-2 focus:ring-primary/20" {...field} />
                    </FormControl>
                    <div className="h-6">
                      <FormMessage />
                    </div>
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
                        <Input type="email" placeholder="name@example.com" className={`transition-all focus:ring-2 focus:ring-primary/20 ${emailDuplicateStatus.isDuplicate ? 'border-amber-500 focus:ring-amber-200' : ''}`} {...field} onChange={(e) => { field.onChange(e); checkEmailDuplicate(e.target.value); }} />
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
                      <span>Phone Number</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="tel" placeholder="+1 (555) 123-4567" className={`transition-all focus:ring-2 focus:ring-primary/20 ${phoneDuplicateStatus.isDuplicate ? 'border-amber-500 focus:ring-amber-200' : ''}`} {...field} onChange={(e) => { field.onChange(e); checkPhoneDuplicate(e.target.value); }} />
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

                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>City</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" className="transition-all focus:ring-2 focus:ring-primary/20" {...field} />
                    </FormControl>
                    <div className="h-6">
                      <FormMessage />
                    </div>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Lead Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Lead Type</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onValueChange={field.onChange} placeholder="Select type" searchPlaceholder="Search types..." options={dropdownData?.Type?.map((option: any) => ({ value: option.key, label: option.value })) || []} emptyMessage="No types found" className="transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Lead Status *</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onValueChange={field.onChange} placeholder="Select lead status" searchPlaceholder="Search statuses..." options={dropdownData?.Status?.map((option: any) => ({ value: option.key, label: option.value })) || []} emptyMessage="No statuses found" className="transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="source" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Lead Source</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onValueChange={field.onChange} placeholder="Select source" searchPlaceholder="Search sources..." options={dropdownData?.Source?.map((option: any) => ({ value: option.key, label: option.value })) || []} emptyMessage="No sources found" className="transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="counselorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Admission Officer</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableCombobox value={field.value} onValueChange={field.onChange} onSearch={handleCounselorSearch} options={counselorOptions} loading={searchingCounselors || counselorsLoading} placeholder="Search and select officer..." searchPlaceholder="Type to search officers..." emptyMessage={counselorSearchQuery ? 'No officers found matching your search.' : 'Start typing to search officers...'} className="transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="branchId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Branch</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        onSearch={handleBranchSearch}
                        options={branchOptions}
                        loading={false}
                        placeholder="Select branch"
                        searchPlaceholder="Search branches..."
                        emptyMessage={branchSearchQuery ? 'No branches found.' : 'Start typing to search branches...'}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Academic Interests</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Interested Countries</span>
                    </FormLabel>
                    <FormControl>
                      <MultiSelect value={field.value || []} onValueChange={field.onChange} placeholder="Select countries" searchPlaceholder="Search countries..." options={dropdownData?.['Interested Country']?.map((option: any) => ({ value: option.key, label: option.value })) || []} emptyMessage="No countries found" maxDisplayItems={2} className="transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="studyLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Study Level</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onValueChange={field.onChange} placeholder="Select study level" searchPlaceholder="Search study levels..." options={dropdownData?.['Study Level']?.map((option: any) => ({ value: option.key, label: option.value })) || []} emptyMessage="No study levels found" className="transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="studyPlan" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Study Plan</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect value={field.value} onValueChange={field.onChange} placeholder="Select study plan" searchPlaceholder="Search study plans..." options={dropdownData?.['Study Plan']?.map((option: any) => ({ value: option.key, label: option.value })) || []} emptyMessage="No study plans found" className="transition-all focus:ring-2 focus:ring-primary/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="elt" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>English Language Test Completed</span>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
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
                    <span>Notes & Comments</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional information about this lead, their goals, preferences, or special requirements..." className="min-h-20 transition-all focus:ring-2 focus:ring-primary/20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-4">
            <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={onCancel} className="flex items-center justify-center space-x-2 w-full">
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
            </motion.div>

            <Button type="submit" disabled={createLeadMutation.isPending || emailDuplicateStatus.isDuplicate || phoneDuplicateStatus.isDuplicate || checkingEmail || checkingPhone} className="flex items-center justify-center space-x-2 min-w-32 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              {createLeadMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (checkingEmail || checkingPhone) ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (emailDuplicateStatus.isDuplicate || phoneDuplicateStatus.isDuplicate) ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Duplicates Found</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
