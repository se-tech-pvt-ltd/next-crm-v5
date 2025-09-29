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
import * as UsersService from '@/services/users';
import { School, FileText, Globe, Briefcase, Link as LinkIcon, ArrowLeft, PlusCircle, GraduationCap, Save, Users } from 'lucide-react';
import * as DropdownsService from '@/services/dropdowns';
import { useMemo, useEffect } from 'react';

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

  const normalizeKey = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const makeOptions = (dd: any, candidates: string[]) => {
    if (!dd || typeof dd !== 'object') return [];
    const keyMap: Record<string, string> = {};
    for (const k of Object.keys(dd || {})) keyMap[normalizeKey(k)] = k;
    let list: any[] = [];
    for (const raw of candidates) {
      const foundKey = keyMap[normalizeKey(raw)];
      if (foundKey && Array.isArray(dd[foundKey]) && dd[foundKey].length) { list = dd[foundKey]; break; }
    }
    if (!Array.isArray(list) || list.length === 0) {
      // relaxed fallback: try to match any key that includes candidate words
      for (const k of Object.keys(dd || {})) {
        const nk = normalizeKey(k);
        for (const raw of candidates) {
          if (nk.includes(normalizeKey(raw))) {
            if (Array.isArray(dd[k]) && dd[k].length) { list = dd[k]; break; }
          }
        }
        if (Array.isArray(list) && list.length) break;
      }
    }
    if (!Array.isArray(list)) list = [];
    list = [...list].sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0)));
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
  };

  const appStatusOptions = useMemo(() => makeOptions(applicationsDropdowns, ['App Status','Application Status','AppStatus','Status','status','appstatus']), [applicationsDropdowns]);
  const caseStatusOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Case Status','caseStatus','CaseStatus','case_status','case status']), [applicationsDropdowns]);
  const courseTypeOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Course Type', 'courseType', 'CourseType']), [applicationsDropdowns]);
  const countryOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Country', 'Countries', 'country', 'countryList']), [applicationsDropdowns]);
  const channelPartnerOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Channel Partner', 'ChannelPartners', 'channelPartner', 'channel_partners']), [applicationsDropdowns]);
  const intakeOptions = useMemo(() => makeOptions(applicationsDropdowns, ['Intake', 'intake', 'Intakes']), [applicationsDropdowns]);

  useEffect(() => {
    // Pre-select defaults for application form when dropdowns load
    if (!appStatusOptions || appStatusOptions.length === 0) return;
    try {
      const cur = form.getValues('appStatus');
      if (!cur) {
        const def = appStatusOptions.find(o => o.isDefault);
        if (def) form.setValue('appStatus', def.value);
      }
    } catch {}

    try {
      const curCase = form.getValues('caseStatus');
      if (!curCase) {
        const defC = caseStatusOptions.find(o => o.isDefault);
        if (defC) form.setValue('caseStatus', defC.value);
      }
    } catch {}

    try {
      const curCourse = form.getValues('courseType');
      if (!curCourse) {
        const defCt = courseTypeOptions.find(o => o.isDefault);
        if (defCt) form.setValue('courseType', defCt.value);
      }
    } catch {}

    try {
      const curCountry = form.getValues('country');
      if ((!curCountry || curCountry === '') && countryOptions.length > 0) {
        const defCountry = countryOptions.find(o => o.isDefault);
        if (defCountry) form.setValue('country', defCountry.value);
      }
    } catch {}

    try {
      const curChannel = form.getValues('channelPartner');
      if (!curChannel) {
        const defCh = channelPartnerOptions.find(o => o.isDefault);
        if (defCh) form.setValue('channelPartner', defCh.value);
      }
    } catch {}

    try {
      const curIntake = form.getValues('intake');
      if (!curIntake) {
        const defI = intakeOptions.find(o => o.isDefault);
        if (defI) form.setValue('intake', defI.value);
      }
    } catch {}
  }, [appStatusOptions, caseStatusOptions, courseTypeOptions, countryOptions, channelPartnerOptions, intakeOptions]);

  const form = useForm<InsertApplication>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      studentId: presetStudentId,
      university: '',
      program: '',
      courseType: '',
      appStatus: '',
      caseStatus: '',
      country: '',
      channelPartner: '',
      intake: '',
      googleDriveLink: '',
      notes: '',
      counsellorId: '',
      admissionOfficerId: '',
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
      const target = presetStudentId ? `/students?studentId=${presetStudentId}` : '/applications';
      setLocation(target);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create application.', variant: 'destructive' });
    },
  });

  const onSubmit = (data: InsertApplication) => createMutation.mutate(data);

  // Users for access assignment
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    staleTime: 5 * 60 * 1000,
  });
  const normalizeRole = (r: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');

  // Determine selected student's branch
  const selectedStudentId = form.watch('studentId');
  const selectedBranchId = useMemo(() => {
    if (presetStudentId) return (presetStudent as any)?.branchId || null;
    const s = Array.isArray(students) ? students.find((st) => st.id === selectedStudentId) : null;
    return (s as any)?.branchId || null;
  }, [presetStudentId, presetStudent, students, selectedStudentId]);

  // Reset access selections when branch context changes
  useEffect(() => {
    form.setValue('counsellorId', '');
    form.setValue('admissionOfficerId', '');
  }, [selectedBranchId]);

  const counsellorOptions = useMemo(() => {
    if (!Array.isArray(users) || !selectedBranchId) return [] as any[];
    return users
      .filter((u: any) => {
        const role = normalizeRole(u.role || u.role_name || u.roleName);
        return (
          (role === 'counselor' || role === 'counsellor' || role === 'admin_staff') &&
          String(u.branchId || '') === String(selectedBranchId || '')
        );
      })
      .map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'User') }));
  }, [users, selectedBranchId]);

  const officerOptions = useMemo(() => {
    if (!Array.isArray(users) || !selectedBranchId) return [] as any[];
    return users
      .filter((u: any) => {
        const role = normalizeRole(u.role || u.role_name || u.roleName);
        return (
          (role === 'admission_officer' || role === 'admission' || role === 'admissionofficer' || role === 'admission officer') &&
          String(u.branchId || '') === String(selectedBranchId || '')
        );
      })
      .map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'User') }));
  }, [users, selectedBranchId]);

  const goBack = () => setLocation(presetStudentId ? `/students?studentId=${presetStudentId}` : '/applications');

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
                              <SelectValue placeholder="Please select" />
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
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {appStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
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
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {caseStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
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
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courseTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
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
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countryOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
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
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {channelPartnerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Access Panel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="counsellorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Counsellor</FormLabel>
                        <FormControl>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder={selectedBranchId ? 'Select counsellor' : 'No branch linked to student'} />
                            </SelectTrigger>
                            <SelectContent>
                              {counsellorOptions.map((opt) => (
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
                        <FormLabel>Admission Officer</FormLabel>
                        <FormControl>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder={selectedBranchId ? 'Select admission officer' : 'No branch linked to student'} />
                            </SelectTrigger>
                            <SelectContent>
                              {officerOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {intakeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
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
