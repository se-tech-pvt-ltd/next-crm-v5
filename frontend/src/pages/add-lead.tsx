import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { MultiSelect } from '@/components/ui/multi-select';
import { Layout } from '@/components/layout';
import { insertLeadSchema } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from '@/components/help-tooltip';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  Globe,
  FileText,
  Users,
  Target,
  BookOpen,
  ArrowLeft,
  Save,
  UserPlus
} from 'lucide-react';
import { z } from 'zod';

// Create form schema based on required fields
const addLeadFormSchema = z.object({
  type: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Valid email is required"),
  city: z.string().optional(),
  source: z.string().optional(),
  country: z.array(z.string()).optional(),
  studyLevel: z.string().optional(),
  studyPlan: z.string().optional(),
  elt: z.string().optional(),
  counselorId: z.string().optional(),
  notes: z.string().optional(),
});

type AddLeadFormData = z.infer<typeof addLeadFormSchema>;

export default function AddLead() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [counselorSearchQuery, setCounselorSearchQuery] = useState('');
  const [searchingCounselors, setSearchingCounselors] = useState(false);

  // Get dropdown data for Leads module
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dropdowns/module/Leads');
      return response.json();
    }
  });

  // Get existing leads and students to prevent duplicates
  const { data: existingLeads } = useQuery({
    queryKey: ['/api/leads'],
  });

  const { data: existingStudents } = useQuery({
    queryKey: ['/api/students'],
  });

  const { data: counselors, isLoading: counselorsLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  // Filter counselors based on search
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

  const handleCounselorSearch = useCallback((query: string) => {
    setCounselorSearchQuery(query);
    if (query.length > 0) {
      setSearchingCounselors(true);
      // Simulate search delay for better UX
      setTimeout(() => setSearchingCounselors(false), 300);
    } else {
      setSearchingCounselors(false);
    }
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
      country: '',
      studyLevel: '',
      studyPlan: '',
      elt: '',
      counselorId: '',
      notes: '',
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: AddLeadFormData) => {
      const response = await apiRequest('POST', '/api/leads', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Success! 🎉",
        description: "Lead has been created successfully and added to your pipeline.",
      });
      setLocation('/leads');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create lead. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddLeadFormData) => {
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

  return (
    <Layout
      title="Add New Lead"
      subtitle="Capture lead information to start the student journey"
      helpText="Fill out the lead information to add them to your pipeline. Required fields are marked with an asterisk."
    >
      <div className="w-full max-w-none sm:max-w-4xl mx-auto px-2 sm:px-0">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
            <motion.div
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
              className="sm:order-first"
            >
              <Button
                variant="outline"
                onClick={() => setLocation('/leads')}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Leads</span>
              </Button>
            </motion.div>
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold truncate">Add New Lead</h1>
                <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">
                  Capture lead information to start the student journey
                </p>
              </div>
            </div>
          </div>
          <div className="hidden sm:block sm:order-last">
            <HelpTooltip content="Fill out the lead information to add them to your pipeline. Required fields are marked with an asterisk." />
          </div>
        </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* Name */}
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

                  {/* Email */}
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

                  {/* Number (Phone) */}
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

                  {/* City */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>City</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter city"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lead Management Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span>Lead Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* Type - Dropdown */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Lead Type</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dropdownData?.Type?.map((option: any) => (
                              <SelectItem key={option.key} value={option.key}>
                                {option.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status - Dropdown */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Target className="w-4 h-4" />
                          <span>Lead Status *</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lead status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dropdownData?.Status?.map((option: any) => (
                              <SelectItem key={option.key} value={option.key}>
                                {option.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Source - Dropdown */}
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Globe className="w-4 h-4" />
                          <span>Lead Source</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dropdownData?.Source?.map((option: any) => (
                              <SelectItem key={option.key} value={option.key}>
                                {option.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Admission Officer (Counselor) */}
                  <FormField
                    control={form.control}
                    name="counselorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Admission Officer</span>
                        </FormLabel>
                        <FormControl>
                          <SearchableCombobox
                            value={field.value}
                            onValueChange={field.onChange}
                            onSearch={handleCounselorSearch}
                            options={counselorOptions}
                            loading={searchingCounselors || counselorsLoading}
                            placeholder="Search and select officer..."
                            searchPlaceholder="Type to search officers..."
                            emptyMessage={counselorSearchQuery ? "No officers found matching your search." : "Start typing to search officers..."}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* Interested Country - Dropdown */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Globe className="w-4 h-4" />
                          <span>Preferred Country</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dropdownData?.["Interested Country"]?.map((option: any) => (
                              <SelectItem key={option.key} value={option.key}>
                                {option.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Study Level */}
                  <FormField
                    control={form.control}
                    name="studyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4" />
                          <span>Study Level</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Bachelor's, Master's, PhD"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Study Plan */}
                  <FormField
                    control={form.control}
                    name="studyPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4" />
                          <span>Field of Study</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Computer Science, Medicine"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ELT */}
                  <FormField
                    control={form.control}
                    name="elt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>English Language Test</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., IELTS 7.0, TOEFL 100"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Additional Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Notes & Comments</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional information about this lead, their goals, preferences, or special requirements..."
                          className="min-h-20 transition-all focus:ring-2 focus:ring-primary/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-4">
              <motion.div
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/leads')}
                  className="flex items-center justify-center space-x-2 w-full"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Cancel</span>
                </Button>
              </motion.div>
              
              <Button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="flex items-center justify-center space-x-2 min-w-32 w-full sm:w-auto"
              >
                {createLeadMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Create Lead</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
