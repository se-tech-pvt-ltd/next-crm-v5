import { useForm } from 'react-hook-form';
console.log('[modal] loaded: frontend/src/components/add-lead-modal.tsx');
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Button } from '@/components/ui/button';
import AddLeadForm from '@/components/add-lead-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { insertLeadSchema } from '@/lib/types';
import * as UsersService from '@/services/users';
import * as LeadsService from '@/services/leads';
import * as StudentsService from '@/services/students';
import { useToast } from '@/hooks/use-toast';
import { CommandMultiSelect } from './command-multi-select';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  DollarSign,
  Calendar,
  Globe,
  FileText,
  Users,
  Target,
  BookOpen
} from 'lucide-react';

interface AddLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<any>;
}

export function AddLeadModal({ open, onOpenChange, initialData }: AddLeadModalProps) {
  const [submitLeadForm, setSubmitLeadForm] = useState<(() => void) | null>(null);
  const handleRegisterSubmit = useCallback((fn: () => void) => {
    try { setSubmitLeadForm(() => fn); } catch {}
  }, []);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [counselorSearchQuery, setCounselorSearchQuery] = useState('');
  const [searchingCounselors, setSearchingCounselors] = useState(false);

  // Get existing leads and students to prevent duplicates
  const { data: existingLeads } = useQuery({
    queryKey: ['/api/leads'],
    enabled: open,
  });

  const { data: existingStudents } = useQuery({
    queryKey: ['/api/students'],
    enabled: open,
  });

  // Get counselors with search functionality
  const { data: counselors, isLoading: counselorsLoading } = useQuery({
    queryKey: ['/api/users', { search: counselorSearchQuery }],
    queryFn: async () => UsersService.getUsers(),
    enabled: open,
  });

  // Handle counselor search
  const handleCounselorSearch = useCallback((query: string) => {
    setCounselorSearchQuery(query);
    if (query) {
      setSearchingCounselors(true);
      // The query will be refetched automatically due to the queryKey dependency
      setTimeout(() => setSearchingCounselors(false), 500);
    }
  }, []);

  // Prepare counselor options for the searchable combobox
  const counselorOptions = Array.isArray(counselors)
    ? counselors
        .filter((user: any) => user.role === 'counselor' || user.role === 'admin_staff')
        .map((counselor: any) => ({
          value: counselor.id,
          label: counselor.firstName && counselor.lastName
            ? `${counselor.firstName} ${counselor.lastName}`
            : (typeof counselor.email === 'string' ? (counselor.email.includes('@') ? counselor.email.split('@')[0] : counselor.email) : 'Unknown'),
          email: counselor.email,
          role: counselor.role === 'admin_staff' ? 'Admin' : 'Counselor'
        }))
    : [];

  const form = useForm({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      program: '',
      source: '',
      status: 'new',
      counselorId: '',
    },
  });

  // Reset form when initialData changes or when opened
  useEffect(() => {
    if (open && initialData) {
      const values: any = {
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        city: initialData.city || undefined,
        source: initialData.source || '',
        status: initialData.status || 'new',
        counselorId: initialData.counselorId || '',
        country: initialData.country || '',
        program: initialData.program || '',
      };
      form.reset(values);
    }
  }, [open, initialData]);

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => LeadsService.createLead(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Success! 🎉",
        description: "Lead has been created successfully and added to your pipeline.",
      });

      // If we were given an event registration id, mark registration as converted
      try {
        if (initialData && (initialData as any).eventRegId) {
          // @ts-ignore
          await (await import('@/services/event-registrations')).updateRegistration((initialData as any).eventRegId, { isConverted: 1, is_converted: 1 });
          queryClient.invalidateQueries({ queryKey: ['/api/event-registrations'] });
        }
      } catch (e) {
        // ignore
      }

      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create lead. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Check for duplicate email in existing leads
    if (Array.isArray(existingLeads)) {
      const duplicateLead = existingLeads.find(
        (lead: any) => lead.email === data.email
      );
      if (duplicateLead) {
        toast({
          title: "Duplicate Found",
          description: "A lead with this email already exists in your system.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check for duplicate email in existing students
    if (Array.isArray(existingStudents)) {
      const duplicateStudent = existingStudents.find(
        (student: any) => student.email === data.email
      );
      if (duplicateStudent) {
        toast({
          title: "Already a Student",
          description: "This contact is already registered as a student.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check for duplicate phone if provided
    if (data.phone) {
      let duplicateFound = false;
      
      if (Array.isArray(existingLeads)) {
        const duplicatePhoneLead = existingLeads.find(
          (lead: any) => lead.phone === data.phone
        );
        if (duplicatePhoneLead) duplicateFound = true;
      }
      
      if (Array.isArray(existingStudents)) {
        const duplicatePhoneStudent = existingStudents.find(
          (student: any) => student.phone === data.phone
        );
        if (duplicatePhoneStudent) duplicateFound = true;
      }
      
      if (duplicateFound) {
        toast({
          title: "Duplicate Phone",
          description: "A contact with this phone number already exists.",
          variant: "destructive",
        });
        return;
      }
    }

    createLeadMutation.mutate(data);
  };

  const handleSubmitClick = () => {
    form.handleSubmit(onSubmit)();
  };

  return (
    <DetailsDialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Add Lead"
      headerClassName="bg-[#223E7D] text-white"
      contentClassName="no-not-allowed w-[65vw] max-w-7xl max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl"
      headerLeft={(
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-semibold leading-tight truncate">Add New Lead</div>
            <div className="text-xs opacity-90 truncate">Capture lead information to start the student journey</div>
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
            onClick={() => {
              try { if (submitLeadForm) submitLeadForm(); else (document.getElementById('add-lead-form-submit') as HTMLButtonElement | null)?.click(); } catch {}
            }}
            className="px-3 h-8 text-xs bg-white text-[#223E7D] hover:bg-white/90 border border-white rounded-md"
          >
            Save
          </Button>
        </div>
      )}
      leftContent={(
        <AddLeadForm
          onCancel={() => onOpenChange(false)}
          onSuccess={() => { onOpenChange(false); try { queryClient.invalidateQueries({ queryKey: ['/api/leads'] }); } catch {} }}
          initialData={initialData}
          onRegisterSubmit={handleRegisterSubmit}
        />
      )}
    />
  );
}
