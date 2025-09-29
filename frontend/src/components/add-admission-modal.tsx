import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
console.log('[modal] loaded: frontend/src/components/add-admission-modal.tsx');
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { insertAdmissionSchema, type InsertAdmission, type Student, type Application } from '@/lib/types';
import * as AdmissionsService from '@/services/admissions';
import * as ApplicationsService from '@/services/applications';
import * as StudentsService from '@/services/students';
import * as UsersService from '@/services/users';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, PlusCircle, Users } from 'lucide-react';
import { ApplicationDetailsModal } from './application-details-modal-new';
import { StudentProfileModal } from './student-profile-modal-new';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AddAdmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId?: string | number | null;
  studentId?: string | null;
}

export function AddAdmissionModal({ open, onOpenChange, applicationId, studentId }: AddAdmissionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [applicationDropdownOpen, setApplicationDropdownOpen] = useState(false);

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: open && !studentId
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    enabled: open && !applicationId
  });

  const { data: linkedApp } = useQuery<Application | null>({
    queryKey: ['/api/applications', String(applicationId)],
    queryFn: async () => {
      if (!applicationId) return null;
      const res = await ApplicationsService.getApplication(String(applicationId));
      return res as Application;
    },
    enabled: !!applicationId
  });

  const form = useForm<any>({
    resolver: zodResolver(insertAdmissionSchema as any),
    defaultValues: {
      applicationId: applicationId || '',
      studentId: studentId || '',
      university: '',
      program: '',
      decision: 'pending',
      decisionDate: undefined,
      scholarshipAmount: '',
      conditions: '',
      depositRequired: false,
      depositAmount: '',
      depositDeadline: undefined,
      visaStatus: 'pending',
      status: '',
      caseStatus: '',
      fullTuitionFee: '',
      netTuitionFee: '',
      initialDeposit: '',
      depositDate: null as any,
      visaDate: null as any,
      googleDriveLink: '',
      notes: '',
      counsellorId: '',
      admissionOfficerId: '',
    }
  });

  const watchedFull = form.watch('fullTuitionFee');
  const watchedScholarship = form.watch('scholarshipAmount');
  const watchedAppId = form.watch('applicationId');
  useEffect(() => {
    const full = Number(watchedFull) || 0;
    const scholarship = Number(watchedScholarship) || 0;
    const net = full > 0 ? Math.max(full - scholarship, 0) : 0;
    if (!Number.isNaN(net)) form.setValue('netTuitionFee', String(net));
  }, [watchedFull, watchedScholarship, form]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: InsertAdmission = {
        applicationId: String(data.applicationId),
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
        counsellorId: data.counsellorId || undefined,
        admissionOfficerId: data.admissionOfficerId || undefined,
      } as any;
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
      } catch {}
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      toast({ title: 'Success', description: 'Admission created.' });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create admission.', variant: 'destructive' });
    }
  });

  const onSubmit = (data: any) => createMutation.mutate(data);

  useEffect(() => {
    if (applicationId) {
      const idStr = String(applicationId);
      if (form.getValues('applicationId') !== idStr) form.setValue('applicationId', idStr);
    }
    if (studentId && !form.getValues('studentId')) form.setValue('studentId', studentId);

    // If we have a linked application (when modal opened with applicationId), populate university and program
    if (linkedApp) {
      form.setValue('applicationId', String(linkedApp.id));
      if (!form.getValues('studentId')) form.setValue('studentId', linkedApp.studentId);
      form.setValue('university', linkedApp.university || '');
      form.setValue('program', linkedApp.program || '');
      try {
        const anyApp: any = linkedApp as any;
        if (!form.getValues('counsellorId') && anyApp.counsellorId) form.setValue('counsellorId', String(anyApp.counsellorId));
        if (!form.getValues('admissionOfficerId') && anyApp.admissionOfficerId) form.setValue('admissionOfficerId', String(anyApp.admissionOfficerId));
      } catch {}
    }
  }, [applicationId, studentId, linkedApp, form]);

  const { data: admissionDropdowns } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/dropdowns/module/Admissions'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Admissions'),
    enabled: open,
  });

  const { data: applicationsDropdowns } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/dropdowns/module/Applications'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Applications'),
    enabled: open,
  });

  const getOptions = (name: string, preferredModules: ('Admissions'|'Applications')[] = ['Admissions','Applications']) => {
    const normalize = (s: string) => String(s || '').toLowerCase().trim();
    const variants = (n: string) => [n, n.toLowerCase(), n.replace(/\s+/g, ''), n.replace(/\s+/g, '').toLowerCase(), n.replace(/\s+/g, '_'), n.replace(/\s+/g, '').replace(/_/g,'')];

    const moduleMap: Record<string, Record<string, any[]>|undefined> = {
      'Admissions': admissionDropdowns as any,
      'Applications': applicationsDropdowns as any,
    };

    for (const mod of preferredModules) {
      const dd = moduleMap[mod];
      if (!dd || typeof dd !== 'object') continue;
      // try exact key matches with variants
      for (const v of variants(name)) {
        if (Object.prototype.hasOwnProperty.call(dd, v)) {
          const list = Array.isArray((dd as any)[v]) ? [...(dd as any)[v]] : [];
          return list.sort((a: any,b:any)=>Number(a.sequence??0)-Number(b.sequence??0)).map((o:any)=>({ label: o.value, value: o.id||o.key||o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
        }
      }
      // try case-insensitive match on keys
      const foundKey = Object.keys(dd).find(k => normalize(k) === normalize(name) || normalize(k).replace(/\s+/g,'') === normalize(name).replace(/\s+/g,''));
      if (foundKey) {
        const list = Array.isArray((dd as any)[foundKey]) ? [...(dd as any)[foundKey]] : [];
        return list.sort((a: any,b:any)=>Number(a.sequence??0)-Number(b.sequence??0)).map((o:any)=>({ label: o.value, value: o.id||o.key||o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
      }
    }

    return [] as {label:string;value:string}[];
  };

  const statusOptions = getOptions('Status', ['Admissions']);
  const caseStatusOptions = getOptions('Case Status', ['Applications','Admissions']);

  useEffect(() => {
    if (!open) return;
    try {
      if ((!form.getValues('status') || form.getValues('status') === '') && Array.isArray(statusOptions) && statusOptions.length > 0) {
        const def = statusOptions.find((o:any) => o.isDefault || o.is_default || o.default) || statusOptions[0];
        if (def) form.setValue('status', def.value as any);
      }
    } catch {}
    try {
      if ((!form.getValues('caseStatus') || form.getValues('caseStatus') === '') && Array.isArray(caseStatusOptions) && caseStatusOptions.length > 0) {
        const def = (caseStatusOptions as any).find((o:any) => o.isDefault || o.is_default || o.default) || (caseStatusOptions as any)[0];
        if (def) form.setValue('caseStatus', def.value as any);
      }
    } catch {}
  }, [open, statusOptions, caseStatusOptions]);

  // Users for access assignment
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    enabled: open,
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

  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [currentApplicationObj, setCurrentApplicationObj] = useState<Application | null>(null);
  const [currentStudentIdLocal, setCurrentStudentIdLocal] = useState<string | null>(null);

  const handleApplicationChange = (appId: string) => {
    const selectedApp = applications?.find(app => String(app.id) === String(appId));
    if (selectedApp) {
      form.setValue('applicationId', String(selectedApp.id));
      form.setValue('studentId', selectedApp.studentId);
      form.setValue('university', selectedApp.university || '');
      form.setValue('program', selectedApp.program || '');
    }
  };

  const openApplicationDetails = (app: Application) => {
    setCurrentApplicationObj(app);
    try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAppDetailsOpen(true)); } catch { setIsAppDetailsOpen(true); }
  };

  const openStudentProfile = (sid: string) => {
    setCurrentStudentIdLocal(sid);
    try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsStudentProfileOpen(true)); } catch { setIsStudentProfileOpen(true); }
  };

  const handleSubmitClick = () => { try { form.handleSubmit(onSubmit)(); } catch {} };

  return (
    <>
      <DetailsDialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title="Add Admission"
        headerClassName="bg-[#223E7D] text-white"
        contentClassName="no-not-allowed w-[65vw] max-w-7xl max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl"
        headerLeft={(
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-semibold leading-tight truncate">Add New Admission</div>
              <div className="text-xs opacity-90 truncate">Create a university admission record for a student</div>
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
              onClick={() => { handleSubmitClick(); }}
              disabled={createMutation.isPending}
              className="px-3 h-8 text-xs bg-[#0071B0] hover:bg-[#00649D] text-white rounded-md"
            >
              {createMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <span>Save</span>
              )}
            </Button>
          </div>
        )}
        leftContent={(
          <div className="flex h-full">
            <div className="flex-1 overflow-y-auto p-6 pt-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Linked Entities Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Linked Entities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <FormLabel>Student</FormLabel>
                          <div className="mt-1">
                            {studentId || form.getValues('studentId') ? (
                              <Button type="button" variant="link" className="p-0 h-8" onClick={() => { const sid = studentId || form.getValues('studentId'); if (sid) openStudentProfile(sid); }}>
                                {(() => {
                                  const sid = studentId || form.getValues('studentId');
                                  const s = students?.find((x) => x.id === sid);
                                  return s?.name || sid || 'Student';
                                })()}
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">Select application to link student</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <FormLabel>Application</FormLabel>
                          <div className="mt-1">
                            {(() => {
                              const aid = String(form.watch('applicationId') || applicationId || '');
                              if (!aid) return (
                                <Popover open={applicationDropdownOpen} onOpenChange={setApplicationDropdownOpen}>
                                  <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" className={cn(!form.getValues('applicationId') && 'text-muted-foreground')}>Select application <ChevronsUpDown className="ml-2 h-4 w-4" /></Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Search by student name, email, or university..." />
                                      <CommandList>
                                        <CommandEmpty>No applications found.</CommandEmpty>
                                        <CommandGroup>
                                          {applications?.map((app) => {
                                            const student = students?.find((s) => s.id === app.studentId);
                                            return (
                                              <CommandItem key={String(app.id)} onSelect={() => { handleApplicationChange(String(app.id)); setApplicationDropdownOpen(false); }}>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">{student?.name}</span>
                                                  <span className="text-sm text-gray-500">{student?.email}</span>
                                                  <span className="text-sm text-blue-600">{app.university} - {app.program}</span>
                                                </div>
                                              </CommandItem>
                                            );
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              );

                              const selectedApp = applications?.find((a) => String(a.id) === aid);
                              if (!selectedApp) return <div className="text-sm text-gray-700">{aid}</div>;
                              return (
                                <Button type="button" variant="link" className="p-0 h-8 text-sm" onClick={() => openApplicationDetails(selectedApp)}>
                                  {selectedApp.applicationCode || `${selectedApp.university} — ${selectedApp.program}`}
                                </Button>
                              );
                            })()}
                          </div>
                        </div>

                        <div>
                          <FormLabel>University</FormLabel>
                          <Input value={form.watch('university') || ''} disabled placeholder="Select application" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overview Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Status</FormLabel>
                          <Select value={form.watch('status') || ''} onValueChange={(v) => form.setValue('status', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions?.map((opt: any) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label || opt.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <FormLabel>Case Status</FormLabel>
                          <Select value={form.watch('caseStatus') || ''} onValueChange={(v) => form.setValue('caseStatus', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                            <SelectContent>
                              {caseStatusOptions?.map((opt: any) => (
                                <SelectItem key={opt.key || opt.id} value={opt.value}>{opt.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Access Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Counsellor</FormLabel>
                          <Select value={form.watch('counsellorId') || ''} onValueChange={(v) => form.setValue('counsellorId', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select counsellor" />
                            </SelectTrigger>
                            <SelectContent>
                              {counsellorOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <FormLabel>Admission Officer</FormLabel>
                          <Select value={form.watch('admissionOfficerId') || ''} onValueChange={(v) => form.setValue('admissionOfficerId', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select admission officer" />
                            </SelectTrigger>
                            <SelectContent>
                              {officerOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financials & Dates Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Financials & Dates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <FormLabel>Full Tuition Fee</FormLabel>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={form.watch('fullTuitionFee') || ''}
                            onChange={(e) => form.setValue('fullTuitionFee', String(e.target.value).replace(/[^0-9.]/g, ''))}
                            placeholder="e.g., 20000"
                          />
                        </div>

                        <div>
                          <FormLabel>Scholarship</FormLabel>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={form.watch('scholarshipAmount') || ''}
                            onChange={(e) => form.setValue('scholarshipAmount', String(e.target.value).replace(/[^0-9.]/g, ''))}
                            placeholder="e.g., 5000"
                          />
                        </div>

                        <div>
                          <FormLabel>Net Tuition</FormLabel>
                          <Input value={form.watch('netTuitionFee') || ''} disabled />
                        </div>

                        <div>
                          <FormLabel>Initial Deposit</FormLabel>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={form.watch('initialDeposit') || ''}
                            onChange={(e) => form.setValue('initialDeposit', String(e.target.value).replace(/[^0-9.]/g, ''))}
                            placeholder="e.g., 500"
                          />
                        </div>

                        <div>
                          <FormLabel>Deposit Date</FormLabel>
                          <Input type="date" value={form.watch('depositDate') ? new Date(form.watch('depositDate')).toISOString().split('T')[0] : ''} onChange={(e) => form.setValue('depositDate', e.target.value)} />
                        </div>

                        <div>
                          <FormLabel>Visa Date</FormLabel>
                          <Input type="date" value={form.watch('visaDate') ? new Date(form.watch('visaDate')).toISOString().split('T')[0] : ''} onChange={(e) => form.setValue('visaDate', e.target.value)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Others Panel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">Others</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <FormLabel>Google Drive Link</FormLabel>
                        <Input value={form.watch('googleDriveLink') || ''} onChange={(e) => form.setValue('googleDriveLink', e.target.value)} placeholder="https://drive.google.com/..." />
                      </div>
                    </CardContent>
                  </Card>

                </form>
              </Form>
            </div>

          </div>
        )}
      />

      {/* Details Modals */}
      <ApplicationDetailsModal open={isAppDetailsOpen} onOpenChange={setIsAppDetailsOpen} application={currentApplicationObj} onOpenStudentProfile={(sid) => openStudentProfile(sid)} />
      <StudentProfileModal open={isStudentProfileOpen} onOpenChange={setIsStudentProfileOpen} studentId={currentStudentIdLocal} onOpenApplication={(app) => { setCurrentApplicationObj(app); try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAppDetailsOpen(true)); } catch { setIsAppDetailsOpen(true); } }} />
    </>
  );
}
