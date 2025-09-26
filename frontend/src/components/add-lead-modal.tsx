import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
console.log('[modal] loaded: frontend/src/components/add-lead-modal.tsx');
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Button } from '@/components/ui/button';
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
            onClick={handleSubmitClick}
            disabled={createLeadMutation.isPending}
            className="px-3 h-8 text-xs bg-[#0071B0] hover:bg-[#00649D] text-white rounded-md"
            title={'Add Lead'}
          >
            {createLeadMutation.isPending ? 'Adding…' : 'Add Lead'}
          </Button>
        </div>
      )}
      leftContent={(
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Personal Information Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Full Name *</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter full name" 
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Email Address *</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="name@example.com" 
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Phone Number</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+1 (555) 123-4567" 
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="counselorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Target className="w-4 h-4" />
                          <span>Assigned Counselor</span>
                        </FormLabel>
                        <FormControl>
                          <SearchableCombobox
                            value={field.value}
                            onValueChange={field.onChange}
                            onSearch={handleCounselorSearch}
                            options={counselorOptions}
                            loading={searchingCounselors || counselorsLoading}
                            placeholder="Search and select counselor..."
                            searchPlaceholder="Type to search counselors..."
                            emptyMessage={counselorSearchQuery ? "No counselors found matching your search." : "Start typing to search counselors..."}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">
                          💡 Type to search through all counselors by name or email
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Academic Interests Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <span>Academic Interests</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Countries of Interest</span>
                      </FormLabel>
                      <FormControl>
                        <CommandMultiSelect
                          options={[
                            { label: 'United States 🇺🇸', value: 'usa' },
                            { label: 'Canada 🇨🇦', value: 'canada' },
                            { label: 'United Kingdom 🇬🇧', value: 'uk' },
                            { label: 'Australia 🇦🇺', value: 'australia' },
                            { label: 'Germany 🇩🇪', value: 'germany' },
                            { label: 'France 🇫🇷', value: 'france' },
                            { label: 'Netherlands ��🇱', value: 'netherlands' },
                            { label: 'New Zealand 🇳🇿', value: 'new-zealand' },
                            { label: 'Switzerland 🇨🇭', value: 'switzerland' },
                            { label: 'Singapore 🇸🇬', value: 'singapore' },
                            { label: 'Ireland 🇮🇪', value: 'ireland' },
                            { label: 'Denmark 🇩🇰', value: 'denmark' },
                            { label: 'Norway 🇳🇴', value: 'norway' },
                            { label: 'Sweden 🇸🇪', value: 'sweden' },
                            { label: 'Finland 🇫🇮', value: 'finland' },
                            { label: 'Belgium 🇧🇪', value: 'belgium' },
                            { label: 'Austria 🇦🇹', value: 'austria' },
                            { label: 'Italy 🇮🇹', value: 'italy' },
                            { label: 'Spain 🇪🇸', value: 'spain' },
                            { label: 'Japan 🇯🇵', value: 'japan' },
                            { label: 'South Korea 🇰🇷', value: 'south-korea' },
                            { label: 'Hong Kong 🇭🇰', value: 'hong-kong' },
                            { label: 'UAE 🇦🇪', value: 'uae' },
                            { label: 'Malta 🇲🇹', value: 'malta' },
                            { label: 'Cyprus 🇨🇾', value: 'cyprus' },
                          ]}
                          value={Array.isArray(field.value) ? field.value : (field.value ? [field.value] : [])}
                          onChange={field.onChange}
                          placeholder="Select preferred study destinations"
                          searchPlaceholder="Search countries..."
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="program"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Programs of Interest</span>
                      </FormLabel>
                      <FormControl>
                        <CommandMultiSelect
                          options={[
                            { label: 'Business & Management', value: 'business-admin' },
                            { label: 'Computer Science & IT', value: 'computer-science' },
                            { label: 'Engineering', value: 'engineering' },
                            { label: 'Medicine & Healthcare', value: 'medicine' },
                            { label: 'Law & Legal Studies', value: 'law' },
                            { label: 'Arts & Humanities', value: 'arts-humanities' },
                            { label: 'Social Sciences', value: 'social-sciences' },
                            { label: 'Natural Sciences', value: 'natural-sciences' },
                            { label: 'Education & Teaching', value: 'education' },
                            { label: 'Psychology', value: 'psychology' },
                            { label: 'Economics & Finance', value: 'economics' },
                            { label: 'Architecture & Design', value: 'architecture' },
                            { label: 'Media & Communications', value: 'media' },
                            { label: 'Environmental Studies', value: 'environmental' },
                          ]}
                          value={Array.isArray(field.value) ? field.value : (field.value ? [field.value] : [])}
                          onChange={field.onChange}
                          placeholder="Select areas of study interest"
                          searchPlaceholder="Search programs..."
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Lead Details Section */}
            <Card>
              <CardHeader className="pb-3">
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
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Lead Source</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="How did they find us?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">🌐 Website</SelectItem>
                            <SelectItem value="referral">👥 Referral</SelectItem>
                            <SelectItem value="social-media">📱 Social Media</SelectItem>
                            <SelectItem value="google-ads">🔍 Google Ads</SelectItem>
                            <SelectItem value="facebook-ads">📘 Facebook Ads</SelectItem>
                            <SelectItem value="education-fair">🎓 Education Fair</SelectItem>
                            <SelectItem value="partner-agent">🤝 Partner Agent</SelectItem>
                            <SelectItem value="cold-outreach">📞 Cold Outreach</SelectItem>
                            <SelectItem value="word-of-mouth">💬 Word of Mouth</SelectItem>
                            <SelectItem value="other">❓ Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Target className="w-4 h-4" />
                          <span>Status</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hot">
                              <div className="flex items-center space-x-2">
                                <Badge variant="destructive" className="w-2 h-2 rounded-full p-0"></Badge>
                                <span>Hot - Ready to Apply</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="warm">
                              <div className="flex items-center space-x-2">
                                <Badge className="w-2 h-2 rounded-full p-0 bg-yellow-500"></Badge>
                                <span>Warm - Interested</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="new">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="w-2 h-2 rounded-full p-0"></Badge>
                                <span>New - Just Inquired</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="cold">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="w-2 h-2 rounded-full p-0"></Badge>
                                <span>Cold - Long Term</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Separator />

          </form>
        </Form>
      )}
    />
  );
}
