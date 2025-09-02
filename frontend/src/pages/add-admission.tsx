import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout';
import { insertAdmissionSchema, type InsertAdmission, type Student, type Application } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltipSimple as HelpTooltip } from '@/components/help-tooltip-simple';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, PlusCircle, School, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function AddAdmissionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const presetApplicationId = params.get('applicationId');
  const presetStudentId = params.get('studentId') || '';
  const from = params.get('from') || '';

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: !presetStudentId,
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    enabled: !presetApplicationId,
  });

  const { data: presetApplication } = useQuery<Application>({
    queryKey: presetApplicationId ? [`/api/applications/${presetApplicationId}`] : ['noop'],
    enabled: !!presetApplicationId,
  });

  const { data: presetStudent } = useQuery<Student>({
    queryKey: presetStudentId ? [`/api/students/${presetStudentId}`] : ['noop'],
    enabled: !!presetStudentId,
  });

  const form = useForm<any>({
    resolver: zodResolver(insertAdmissionSchema as any),
    defaultValues: {
      // Required for submission
      applicationId: presetApplicationId ? Number(presetApplicationId) : 0,
      studentId: presetStudentId,
      university: presetApplication?.university || '',
      program: presetApplication?.program || '',
      decision: 'pending',
      decisionDate: null as any,
      scholarshipAmount: '',
      conditions: '',
      depositRequired: false,
      depositAmount: '',
      depositDeadline: null as any,
      visaStatus: 'pending',
      notes: '',
      // UI-only fields requested
      status: 'pending',
      caseStatus: '',
      fullTuitionFee: '',
      netTuitionFee: '',
      initialDeposit: '',
      depositDate: null as any,
      visaDate: null as any,
      googleDriveLink: '',
    },
  });

  const watchedFull = form.watch('fullTuitionFee');
  const watchedScholarship = form.watch('scholarshipAmount');
  useEffect(() => {
    const full = Number(watchedFull) || 0;
    const scholarship = Number(watchedScholarship) || 0;
    const net = full > 0 ? Math.max(full - scholarship, 0) : 0;
    if (!Number.isNaN(net)) form.setValue('netTuitionFee', String(net));
  }, [watchedFull, watchedScholarship, form]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: InsertAdmission = {
        applicationId: Number(data.applicationId),
        studentId: data.studentId,
        university: data.university,
        program: data.program,
        decision: data.status || data.decision || 'pending',
        decisionDate: data.visaDate ? new Date(data.visaDate) : (data.decisionDate ? new Date(data.decisionDate) : null),
        scholarshipAmount: data.scholarshipAmount || null,
        conditions: data.conditions || null,
        depositRequired: Boolean(data.depositRequired) || false,
        depositAmount: data.depositAmount || data.initialDeposit || null,
        depositDeadline: data.depositDate ? new Date(data.depositDate) : (data.depositDeadline ? new Date(data.depositDeadline) : null),
        visaStatus: data.visaStatus || 'pending',
        notes: (() => {
          const extra: string[] = [];
          if (data.fullTuitionFee) extra.push(`Full Tuition Fee: ${data.fullTuitionFee}`);
          if (data.netTuitionFee) extra.push(`Net Tuition Fee: ${data.netTuitionFee}`);
          if (data.googleDriveLink) extra.push(`Drive: ${data.googleDriveLink}`);
          if (data.caseStatus) extra.push(`Case Status: ${data.caseStatus}`);
          if (data.visaDate && !data.decisionDate) extra.push(`Visa Date: ${new Date(data.visaDate).toISOString().split('T')[0]}`);
          const base = data.notes || '';
          return [base, extra.join(' | ')].filter(Boolean).join(' \n');
        })(),
      } as any;
      const res = await apiRequest('POST', '/api/admissions', payload as any);
      if (!res.ok) throw new Error('Failed');
      const created = await res.json();
      try {
        if (data.caseStatus && data.applicationId) {
          await apiRequest('PUT', `/api/applications/${data.applicationId}`, { caseStatus: data.caseStatus });
          queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        }
        if (data.googleDriveLink && data.applicationId) {
          await apiRequest('PUT', `/api/applications/${data.applicationId}`, { googleDriveLink: data.googleDriveLink });
          queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        }
      } catch {}
      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      toast({ title: 'Success', description: 'Admission created.' });
      const target = from || (presetApplicationId ? `/applications/${presetApplicationId}` : '/admissions');
      setLocation(target);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create admission.', variant: 'destructive' });
    },
  });

  const onSubmit = (data: any) => createMutation.mutate(data);

  const goBack = () => setLocation(from || (presetApplicationId ? `/applications/${presetApplicationId}` : '/admissions'));

  const selectedApp = (() => {
    if (presetApplication) return presetApplication;
    const idNum = Number(form.watch('applicationId'));
    if (!Number.isFinite(idNum)) return undefined;
    return applications?.find((a) => a.id === (idNum as any));
  })();

  const linkedApp = selectedApp;
  const linkedStudent = presetStudent || (students?.find((s) => s.id === (linkedApp?.studentId || presetStudentId)) as Student | undefined);

  return (
    <Layout title="Add Admission" subtitle="Create a full admission record" helpText="Fill in admission decision and related details.">
      <div className="w-full max-w-none sm:max-w-4xl mx-auto px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
            <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }} className="sm:order-first">
              <Button variant="outline" onClick={goBack} className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4" />
                <span>{from && from.includes('/applications/') ? 'Back to Application' : 'Back to Admissions'}</span>
              </Button>
            </motion.div>
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold truncate">Add New Admission</h1>
                <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">Create a university admission record for a student</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:block sm:order-last">
            <HelpTooltip content="Provide admission decision details, scholarship/visa info, and important dates." />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Linked Entities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Linked Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Student link */}
                  <div>
                    <FormLabel>Student</FormLabel>
                    <div className="mt-1">
                      {linkedStudent ? (
                        <Button variant="link" className="p-0 h-8" onClick={() => setLocation(`/students/${linkedStudent.id}`)}>
                          {linkedStudent.name}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Select application to link student</span>
                      )}
                    </div>
                  </div>

                  {/* Application link or selector */}
                  <div>
                    <FormLabel>Application</FormLabel>
                    <div className="mt-1">
                      {presetApplicationId || linkedApp ? (
                        <div>
                          <Button variant="link" className="p-0 h-8" onClick={() => linkedApp && setLocation(`/applications/${linkedApp.id}`)} disabled={!linkedApp}>
                            {linkedApp?.applicationCode || `${linkedApp?.university || ''} — ${linkedApp?.program || ''}`}
                          </Button>
                          {linkedApp?.university && (
                            <div className="mt-1 text-sm text-muted-foreground">
                              University: {linkedApp.university}
                            </div>
                          )}
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name="applicationId"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  value={field.value ? String(field.value) : ''}
                                  onValueChange={(v) => {
                                    const idNum = Number(v);
                                    field.onChange(idNum);
                                    const app = applications?.find((a) => a.id === (idNum as any));
                                    if (app) {
                                      form.setValue('studentId', app.studentId);
                                      form.setValue('university', app.university);
                                      form.setValue('program', app.program);
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select application" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {applications?.map((app) => (
                                      <SelectItem key={app.id} value={String(app.id)}>
                                        {app.applicationCode || `${app.university} — ${app.program}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overview Fields */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* Status -> decision */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue('decision', v); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="waitlisted">Waitlisted</SelectItem>
                              <SelectItem value="conditional">Conditional</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Case Status (updates application) */}
                  <FormField
                    control={form.control}
                    name="caseStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Status</FormLabel>
                        <FormControl>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select case status" />
                            </SelectTrigger>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
              </CardContent>
            </Card>

            {/* Financial and Dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> Financial & Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  <FormField
                    control={form.control}
                    name="fullTuitionFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Tuition Fee</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 20000" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scholarshipAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scholarship</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 5000" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="netTuitionFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Tuition Fee</FormLabel>
                        <FormControl>
                          <Input placeholder="Auto-calculated" {...field} value={field.value || ''} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depositAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Deposit</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2000" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depositDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ? new Date(field.value as any).toISOString().split('T')[0] : ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visaDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visa Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ? new Date(field.value as any).toISOString().split('T')[0] : ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="googleDriveLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Drive Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://drive.google.com/..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visaStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visa Status</FormLabel>
                        <FormControl>
                          <Select value={field.value || 'pending'} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select visa status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="not-applied">Not Applied</SelectItem>
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-4">
              <Button type="button" variant="outline" onClick={goBack} className="w-full sm:w-auto flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto min-w-40 flex items-center justify-center gap-2">
                {createMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Create Admission</span>
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
