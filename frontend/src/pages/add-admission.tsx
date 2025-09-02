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

  const createMutation = useMutation({
    mutationFn: async (data: InsertAdmission) => {
      const payload = {
        ...data,
        depositDeadline: data.depositDeadline ? new Date(data.depositDeadline) : null,
        decisionDate: data.decisionDate ? new Date(data.decisionDate) : null,
      };
      const res = await apiRequest('POST', '/api/admissions', payload as any);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      if (created?.studentId) queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({ title: 'Success', description: 'Admission created.' });
      const target = from || (presetApplicationId ? `/applications/${presetApplicationId}` : '/admissions');
      setLocation(target);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create admission.', variant: 'destructive' });
    },
  });

  const onSubmit = (data: InsertAdmission) => createMutation.mutate(data);

  const goBack = () => setLocation(from || (presetApplicationId ? `/applications/${presetApplicationId}` : '/admissions'));

  const selectedApp = (() => {
    if (presetApplication) return presetApplication;
    const idNum = Number(form.watch('applicationId'));
    if (!Number.isFinite(idNum)) return undefined;
    return applications?.find((a) => a.id === (idNum as any));
  })();

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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Admission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!presetApplicationId && (
                    <FormField
                      control={form.control}
                      name="applicationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application</FormLabel>
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
                                    {app.university} — {app.program}
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

                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <FormControl>
                          {presetStudentId || selectedApp ? (
                            <Input value={presetStudent ? `${presetStudent.name} (${presetStudent.email})` : selectedApp ? selectedApp.studentId : ''} disabled />
                          ) : (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
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
                        <FormLabel className="flex items-center gap-2"><School className="w-4 h-4" /> University</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter university" {...field} />
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
                        <FormLabel>Program</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter program" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="decision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decision</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select decision" />
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

                  <FormField
                    control={form.control}
                    name="scholarshipAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scholarship Amount</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $10,000" {...field} value={field.value || ''} />
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
                        <FormLabel>Deposit Amount</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $500" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depositDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ? new Date(field.value as any).toISOString().split('T')[0] : ''} />
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
                <CardTitle className="text-lg flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> Additional Info</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <textarea className="w-full border rounded-md p-2 min-h-[120px]" placeholder="Enter any additional notes" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
