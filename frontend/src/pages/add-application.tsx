import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout';
import { insertApplicationSchema, type Student, type InsertApplication } from '@/lib/types';
import * as ApplicationsService from '@/services/applications';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltipSimple as HelpTooltip } from '@/components/help-tooltip-simple';
import { School, FileText, Globe, Briefcase, Link as LinkIcon, ArrowLeft, PlusCircle, GraduationCap, Save } from 'lucide-react';
import * as DropdownsService from '@/services/dropdowns';
import { useMemo } from 'react';

export default function AddApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const presetStudentId = params.get('studentId') || '';

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: !presetStudentId,
  });

  const { data: presetStudent } = useQuery<Student>({
    queryKey: [`/api/students/${presetStudentId}`],
    enabled: !!presetStudentId,
  });

  const { data: applicationsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Applications'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Applications')
  });

  const makeOptions = (dd: any, candidates: string[]) => {
    let list: any[] = [];
    for (const k of candidates) {
      if (dd && Array.isArray(dd[k])) { list = dd[k]; break; }
    }
    if (!Array.isArray(list)) list = [];
    list = [...list].sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0)));
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value }));
  };

  const appStatusOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Status', 'status', 'AppStatus', 'Application Status']), [applicationsDropdowns]);
  const caseStatusOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Case Status', 'caseStatus', 'CaseStatus', 'case_status']), [applicationsDropdowns]);
  const courseTypeOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Course Type', 'courseType', 'CourseType']), [applicationsDropdowns]);
  const countryOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Country', 'Countries', 'country', 'countryList']), [applicationsDropdowns]);
  const channelPartnerOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Channel Partner', 'ChannelPartners', 'channelPartner', 'channel_partners']), [applicationsDropdowns]);
  const intakeOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Intake', 'intake', 'Intakes']), [applicationsDropdowns]);

  const form = useForm<InsertApplication>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      studentId: presetStudentId,
      university: '',
      program: '',
      courseType: '',
      appStatus: 'Open',
      caseStatus: 'Raw',
      country: '',
      channelPartner: '',
      intake: '',
      googleDriveLink: '',
      notes: '',
    } as any,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertApplication) => ApplicationsService.createApplication(data as any),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      if (created?.studentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/applications/student/${created.studentId}`] });
      }
      toast({ title: 'Success', description: 'Application created.' });
      const target = presetStudentId ? `/students/${presetStudentId}` : '/applications';
      setLocation(target);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create application.', variant: 'destructive' });
    },
  });

  const onSubmit = (data: InsertApplication) => createMutation.mutate(data);

  const goBack = () => setLocation(presetStudentId ? `/students/${presetStudentId}` : '/applications');

  return (
    <Layout
      title="Add New Application"
      subtitle="Create a university application for a student"
      helpText="Fill in the application details and submit to track progress."
    >
      <div className="w-full max-w-none sm:max-w-4xl mx-auto px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" onClick={goBack} className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Applications</span>
              </Button>
            </motion.div>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Add New Application</h1>
              <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">
                Create a university application for a student
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <HelpTooltip content="Provide university, program, and intake details. Use the status to track progress." />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Application Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student *</FormLabel>
                        <FormControl>
                          {presetStudentId ? (
                            <Input value={presetStudent ? `${presetStudent.name} (${presetStudent.email})` : 'Loading student...'} className="transition-all focus:ring-2 focus:ring-primary/20" disabled />
                          ) : (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                              <SelectContent>
                                {students?.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name} ({s.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><School className="w-4 h-4" /> University *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter university name" className="transition-all focus:ring-2 focus:ring-primary/20" {...field} />
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
                        <FormLabel className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Program *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Computer Science" className="transition-all focus:ring-2 focus:ring-primary/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="appStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Status</FormLabel>
                        <Select value={field.value || 'Open'} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {appStatusOptions.length > 0 ? appStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>) : (
                              <>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                              </>
                            )}
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
                        <FormLabel>Case Status</FormLabel>
                        <Select value={field.value || 'Raw'} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select case status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Raw">Raw</SelectItem>
                            <SelectItem value="Not Eligible">Not Eligible</SelectItem>
                            <SelectItem value="Documents Pending">Documents Pending</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Ready to Apply">Ready to Apply</SelectItem>
                            <SelectItem value="Submitted">Submitted</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="COL Received">COL Received</SelectItem>
                            <SelectItem value="UOL Requested">UOL Requested</SelectItem>
                            <SelectItem value="UOL Received">UOL Received</SelectItem>
                            <SelectItem value="Interview Outcome Awaiting">Interview Outcome Awaiting</SelectItem>
                            <SelectItem value="Deposit">Deposit</SelectItem>
                            <SelectItem value="Deferred">Deferred</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Type</FormLabel>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select course type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ELT">ELT</SelectItem>
                            <SelectItem value="Foundation">Foundation</SelectItem>
                            <SelectItem value="Bachelors">Bachelors</SelectItem>
                            <SelectItem value="Masters">Masters</SelectItem>
                            <SelectItem value="Top Up">Top Up</SelectItem>
                            <SelectItem value="Pre Masters">Pre Masters</SelectItem>
                            <SelectItem value="MRes/PHD">MRes/PHD</SelectItem>
                            <SelectItem value="Diploma">Diploma</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Globe className="w-4 h-4" /> Country</FormLabel>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UK">UK</SelectItem>
                            <SelectItem value="USA">USA</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="Germany">Germany</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                            <SelectItem value="Spain">Spain</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Cyprus">Cyprus</SelectItem>
                            <SelectItem value="Ireland">Ireland</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channelPartner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel Partner</FormLabel>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select channel partner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Scorp">Scorp</SelectItem>
                            <SelectItem value="UKEC">UKEC</SelectItem>
                            <SelectItem value="Crizac">Crizac</SelectItem>
                            <SelectItem value="Direct">Direct</SelectItem>
                            <SelectItem value="MSM Unify">MSM Unify</SelectItem>
                            <SelectItem value="Adventus">Adventus</SelectItem>
                            <SelectItem value="ABN">ABN</SelectItem>
                            <SelectItem value="NSA">NSA</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="intake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intake</FormLabel>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select intake" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="October 2025">October 2025</SelectItem>
                            <SelectItem value="November 2025">November 2025</SelectItem>
                            <SelectItem value="December 2025">December 2025</SelectItem>
                            <SelectItem value="January 2026">January 2026</SelectItem>
                            <SelectItem value="February 2026">February 2026</SelectItem>
                            <SelectItem value="March 2026">March 2026</SelectItem>
                            <SelectItem value="April 2026">April 2026</SelectItem>
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
                        <FormLabel className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Google Drive Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://drive.google.com/..." className="transition-all focus:ring-2 focus:ring-primary/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-4">
              <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={goBack} className="flex items-center justify-center space-x-2 w-full">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Cancel</span>
                </Button>
              </motion.div>
              <Button type="submit" disabled={createMutation.isPending} className="flex items-center justify-center space-x-2 min-w-32 w-full sm:w-auto">
                {createMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Create Application</span>
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
