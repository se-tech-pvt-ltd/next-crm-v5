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
import { http } from '@/services/http';
import * as ApplicationsService from '@/services/applications';
import * as AdmissionsService from '@/services/admissions';
import * as UsersService from '@/services/users';
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
      applicationId: presetApplicationId || '',
      studentId: presetStudentId,
      university: presetApplication?.university || '',
      program: presetApplication?.program || '',
      decision: 'pending',
      decisionDate: undefined,
      scholarshipAmount: '',
      conditions: '',
      depositRequired: false,
      depositAmount: '',
      depositDeadline: undefined,
      visaStatus: 'pending',
      // UI-only fields requested
      status: '',
      caseStatus: '',
      fullTuitionFee: '',
      netTuitionFee: '',
      initialDeposit: '',
      depositDate: undefined,
      visaDate: undefined,
      googleDriveLink: '',
      // Access
      counsellorId: '',
      admissionOfficerId: '',
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
      console.log('[AddAdmission] mutationFn called with data:', data);
      const payload: InsertAdmission = {
        applicationId: String(data.applicationId),
        studentId: data.studentId,
        university: data.university,
        program: data.program,
        // admission decision (e.g., accepted/rejected) remains separate from UI 'Status'
        decision: data.decision || 'pending',
        decisionDate: data.decisionDate ? new Date(data.decisionDate) : undefined,
        // Map UI fields to ORM fields
        status: data.status || null,
        caseStatus: data.caseStatus || null,
        fullTuitionFee: data.fullTuitionFee || null,
        scholarshipAmount: data.scholarshipAmount || null,
        netTuitionFee: data.netTuitionFee || null,
        depositRequired: Boolean(data.depositRequired) || false,
        depositAmount: data.depositAmount || data.initialDeposit || undefined,
        depositDate: data.depositDate ? new Date(data.depositDate) : undefined,
        depositDeadline: data.depositDeadline ? new Date(data.depositDeadline) : undefined,
        visaDate: data.visaDate ? new Date(data.visaDate) : undefined,
        visaStatus: data.visaStatus || 'pending',
        googleDriveLink: data.googleDriveLink || null,
        counsellorId: data.counsellorId || undefined,
        admissionOfficerId: data.admissionOfficerId || undefined,
      } as any;
      console.log('[AddAdmission] payload prepared:', payload);
      // Remove undefined fields (especially optional dates) so backend doesn't receive null/undefined
      Object.keys(payload).forEach((k) => { if ((payload as any)[k] === undefined) delete (payload as any)[k]; });
      try {
        const created = await AdmissionsService.createAdmission(payload as any);
        try {
          if (data.caseStatus && data.applicationId) {
            await ApplicationsService.updateApplication(String(data.applicationId), { caseStatus: data.caseStatus });
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
          }
          if (data.googleDriveLink && data.applicationId) {
            await ApplicationsService.updateApplication(String(data.applicationId), { googleDriveLink: data.googleDriveLink });
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
          }
        } catch (e) {
          console.warn('[AddAdmission] failed to update application details:', e);
        }
        return created;
      } catch (err) {
        console.error('[AddAdmission] createAdmission error:', err);
        throw err;
      }
    },
    onSuccess: (created) => {
      console.log('[AddAdmission] create success:', created);
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      toast({ title: 'Success', description: 'Admission created.' });
      const target = from || (presetApplicationId ? `/applications/${presetApplicationId}` : '/admissions');
      setLocation(target);
    },
    onError: (err: any) => {
      console.error('[AddAdmission] create error:', err);
      toast({ title: 'Error', description: err?.message || 'Failed to create admission.', variant: 'destructive' });
    },
  });

  const onSubmit = (data: any) => {
    console.log('[AddAdmission] onSubmit called with', data);
    createMutation.mutate(data);
  };

  const goBack = () => setLocation(from || (presetApplicationId ? `/applications/${presetApplicationId}` : '/admissions'));

  const selectedApp = (() => {
    if (presetApplication) return presetApplication;
    const id = String(form.watch('applicationId') || '');
    if (!id) return undefined;
    return applications?.find((a) => String(a.id) === id);
  })();

  const linkedApp = selectedApp;
  const linkedStudent = presetStudent || (students?.find((s) => s.id === (linkedApp?.studentId || presetStudentId)) as Student | undefined);

  // Users for access assignment
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    staleTime: 5 * 60 * 1000,
  });
  const normalizeRole = (r: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');
  const counsellorOptions = Array.isArray(users)
    ? users.filter((u: any) => {
        const role = normalizeRole(u.role || u.role_name || u.roleName);
        return role === 'counselor' || role === 'counsellor' || role === 'admin_staff';
      })
      .map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'User') }))
    : [];
  const officerOptions = Array.isArray(users)
    ? users.filter((u: any) => {
        const role = normalizeRole(u.role || u.role_name || u.roleName);
        return role === 'admission_officer' || role === 'admission' || role === 'admissionofficer' || role === 'admission officer';
      })
      .map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'User') }))
    : [];

  // Ensure required values are set from linked application so form can submit
  useEffect(() => {
    if (linkedApp) {
      const idStr = String(linkedApp.id);
      if (form.getValues('applicationId') !== idStr) {
        form.setValue('applicationId', idStr);
      }
      if (!form.getValues('studentId')) {
        form.setValue('studentId', linkedApp.studentId);
      }
      form.setValue('university', linkedApp.university || '');
      form.setValue('program', linkedApp.program || '');
      try {
        const anyApp: any = linkedApp as any;
        if (anyApp.regionId && !form.getValues('regionId')) form.setValue('regionId', String(anyApp.regionId));
        if (anyApp.branchId && !form.getValues('branchId')) form.setValue('branchId', String(anyApp.branchId));
        if (!form.getValues('counsellorId') && anyApp.counsellorId) form.setValue('counsellorId', String(anyApp.counsellorId));
        if (!form.getValues('admissionOfficerId') && anyApp.admissionOfficerId) form.setValue('admissionOfficerId', String(anyApp.admissionOfficerId));
      } catch {}
    }
  }, [linkedApp, form]);

  // Admission dropdowns grouped by module (same approach as leads/add) with debug logs
  const { data: admissionDropdowns } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/dropdowns/module/Admissions'],
    queryFn: async () => {
      const url = '/api/dropdowns/module/Admissions';
      console.log('[Admission Dropdowns] GET', url);
      const json = await http.get<any>(url);
      console.log('[Admission Dropdowns] keys:', Object.keys(json || {}));
      return json;
    },
  });
  const getOptions = (name: string) => {
    const src = (admissionDropdowns as any) || {};
    const found = Object.entries(src).find(([k]) => k.toLowerCase().trim() === name.toLowerCase());
    return (found?.[1] as any[]) || [];
  };
  const statusOptions = getOptions('Status');
  const caseStatusOptions = getOptions('Case Status');
  useEffect(() => {
    console.log('[Admission Dropdowns] Status options:', statusOptions);
    console.log('[Admission Dropdowns] Case Status options:', caseStatusOptions);
    // Do not auto-select; require explicit user choice
  }, [statusOptions, caseStatusOptions]);

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
                        <Button variant="link" className="p-0 h-8" onClick={() => setLocation(`/students?studentId=${linkedStudent.id}`)}>
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
                        <Button variant="link" className="p-0 h-8" onClick={() => linkedApp && setLocation(`/applications/${linkedApp.id}`)} disabled={!linkedApp}>
                          {linkedApp?.applicationCode || `${linkedApp?.university || ''} — ${linkedApp?.program || ''}`}
                        </Button>
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
                                    field.onChange(v);
                                    const app = applications?.find((a) => String(a.id) === v);
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
                                      <SelectItem key={String(app.id)} value={String(app.id)}>
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

                  <div>
                    <FormLabel>University</FormLabel>
                    <div className="mt-1">
                      <Input value={linkedApp?.university || ''} disabled placeholder="Select application" />
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
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions?.map((opt: any) => (
                                <SelectItem key={opt.key || opt.id} value={opt.value}>{opt.value}</SelectItem>
                              ))}
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                            <SelectContent>
                              {caseStatusOptions?.map((opt: any) => (
                                <SelectItem key={opt.key || opt.id} value={opt.value}>{opt.value}</SelectItem>
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

            {/* Access */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><School className="w-5 h-5 text-primary" /> Access</CardTitle>
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select counsellor" />
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select admission officer" />
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
                          <Input
                            placeholder="e.g., 20000"
                            value={field.value || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              const ok = /^\d*(?:\.\d{0,3})?$/.test(v);
                              if (ok || v === '') field.onChange(v);
                            }}
                            onKeyDown={(e) => {
                              const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                              const ctrl = e.ctrlKey || e.metaKey;
                              if (ctrl && ['a','c','v','x'].includes(e.key.toLowerCase())) return;
                              if (allowed.includes(e.key)) return;
                              if (e.key === '.') {
                                if ((field.value || '').includes('.')) e.preventDefault();
                                return;
                              }
                              if (!/\d/.test(e.key)) e.preventDefault();
                            }}
                            onPaste={(e) => {
                              const text = (e.clipboardData || (window as any).clipboardData).getData('text');
                              if (!/^\d*(?:\.\d{0,3})?$/.test(text)) e.preventDefault();
                            }}
                          />
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
                          <Input
                            placeholder="e.g., 5000"
                            value={field.value || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              const ok = /^\d*(?:\.\d{0,3})?$/.test(v);
                              if (ok || v === '') field.onChange(v);
                            }}
                            onKeyDown={(e) => {
                              const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                              const ctrl = e.ctrlKey || e.metaKey;
                              if (ctrl && ['a','c','v','x'].includes(e.key.toLowerCase())) return;
                              if (allowed.includes(e.key)) return;
                              if (e.key === '.') {
                                if ((field.value || '').includes('.')) e.preventDefault();
                                return;
                              }
                              if (!/\d/.test(e.key)) e.preventDefault();
                            }}
                            onPaste={(e) => {
                              const text = (e.clipboardData || (window as any).clipboardData).getData('text');
                              if (!/^\d*(?:\.\d{0,3})?$/.test(text)) e.preventDefault();
                            }}
                          />
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
                          <Input
                            placeholder="e.g., 2000"
                            value={field.value || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              const ok = /^\d*(?:\.\d{0,3})?$/.test(v);
                              if (ok || v === '') field.onChange(v);
                            }}
                            onKeyDown={(e) => {
                              const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                              const ctrl = e.ctrlKey || e.metaKey;
                              if (ctrl && ['a','c','v','x'].includes(e.key.toLowerCase())) return;
                              if (allowed.includes(e.key)) return;
                              if (e.key === '.') {
                                if ((field.value || '').includes('.')) e.preventDefault();
                                return;
                              }
                              if (!/\d/.test(e.key)) e.preventDefault();
                            }}
                            onPaste={(e) => {
                              const text = (e.clipboardData || (window as any).clipboardData).getData('text');
                              if (!/^\d*(?:\.\d{0,3})?$/.test(text)) e.preventDefault();
                            }}
                          />
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

                </div>
              </CardContent>
            </Card>

            {/* Visa Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> Others</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2 lg:col-span-3">
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
                  </div>
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
