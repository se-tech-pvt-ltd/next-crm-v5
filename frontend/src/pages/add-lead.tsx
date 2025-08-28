import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { Layout } from '@/components/layout';
import { insertLeadSchema } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from '@/components/help-tooltip';
import { CommandMultiSelect } from '@/components/command-multi-select';
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
  BookOpen,
  ArrowLeft,
  Save,
  UserPlus
} from 'lucide-react';

export default function AddLead() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [counselorSearchQuery, setCounselorSearchQuery] = useState('');
  const [searchingCounselors, setSearchingCounselors] = useState(false);

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
          label: `${user.name || user.email}`,
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

  const form = useForm({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      program: '',
      source: 'website',
      notes: '',
      budget: '',
      timeline: '',
      status: 'new',
      counselorId: '',
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
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

  return (
    <Layout 
      title="Add New Lead" 
      subtitle="Capture lead information to start the student journey"
      helpText="Fill out the lead information to add them to your pipeline. Required fields are marked with an asterisk."
    >
      <div className="max-w-4xl">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/leads')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Leads</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Add New Lead</h1>
                <p className="text-sm text-muted-foreground">
                  Capture lead information to start the student journey
                </p>
              </div>
            </div>
          </div>
          <HelpTooltip content="Fill out the lead information to add them to your pipeline. Required fields are marked with an asterisk." />
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
                            { label: 'Netherlands 🇳🇱', value: 'netherlands' },
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
                            { label: 'Architecture & Design', value: 'architecture' },
                            { label: 'Media & Communications', value: 'media' },
                            { label: 'Environmental Studies', value: 'environmental' },
                            { label: 'Mathematics & Statistics', value: 'mathematics' },
                            { label: 'Agriculture & Forestry', value: 'agriculture' },
                            { label: 'Hospitality & Tourism', value: 'hospitality' },
                            { label: 'Sports & Recreation', value: 'sports' },
                            { label: 'Public Administration', value: 'public-admin' },
                            { label: 'International Relations', value: 'international-relations' },
                            { label: 'Data Science & Analytics', value: 'data-science' },
                          ]}
                          value={Array.isArray(field.value) ? field.value : (field.value ? [field.value] : [])}
                          onChange={field.onChange}
                          placeholder="Select areas of academic interest"
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

            {/* Additional Details Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Additional Details</span>
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
                          <Target className="w-4 h-4" />
                          <span>Lead Source</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select how they found us" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="social-media">Social Media</SelectItem>
                            <SelectItem value="advertisement">Advertisement</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="phone-call">Phone Call</SelectItem>
                            <SelectItem value="email">Email Campaign</SelectItem>
                            <SelectItem value="partner">Partner Organization</SelectItem>
                            <SelectItem value="walk-in">Walk-in</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Budget Range</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select budget range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="under-20k">Under $20,000</SelectItem>
                            <SelectItem value="20k-40k">$20,000 - $40,000</SelectItem>
                            <SelectItem value="40k-60k">$40,000 - $60,000</SelectItem>
                            <SelectItem value="60k-80k">$60,000 - $80,000</SelectItem>
                            <SelectItem value="80k-100k">$80,000 - $100,000</SelectItem>
                            <SelectItem value="over-100k">Over $100,000</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                            <SelectItem value="not-specified">Not Specified</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Timeline</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="When do they plan to start?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate (Next 3 months)</SelectItem>
                            <SelectItem value="short-term">Short-term (3-6 months)</SelectItem>
                            <SelectItem value="medium-term">Medium-term (6-12 months)</SelectItem>
                            <SelectItem value="long-term">Long-term (1-2 years)</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                            <SelectItem value="not-sure">Not Sure</SelectItem>
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
                          <Users className="w-4 h-4" />
                          <span>Initial Status</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Set initial status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">🆕 New</SelectItem>
                            <SelectItem value="contacted">📞 Contacted</SelectItem>
                            <SelectItem value="qualified">✅ Qualified</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Notes</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional information about this lead..." 
                          className="min-h-24 transition-all focus:ring-2 focus:ring-primary/20"
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
            <div className="flex items-center justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation('/leads')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
              
              <Button 
                type="submit" 
                disabled={createLeadMutation.isPending}
                className="flex items-center space-x-2 min-w-32"
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
