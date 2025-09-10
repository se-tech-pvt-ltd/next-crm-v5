import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';

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
    enabled: !studentId
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    enabled: !applicationId
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
    }
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
  }, [applicationId, studentId, form]);

  const getOptions = (name: string, admissionDropdowns: Record<string, any[]> | undefined) => {
    const src = (admissionDropdowns as any) || {};
    const found = Object.entries(src).find(([k]) => k.toLowerCase().trim() === name.toLowerCase());
    return (found?.[1] as any[]) || [];
  };

  const { data: admissionDropdowns } = useQuery<Record<string, any[]>>({
    queryKey: ['/api/dropdowns/module/Admissions'],
    queryFn: async () => {
      const res = await (await fetch('/api/dropdowns/module/Admissions')).json();
      return res;
    }
  });

  const statusOptions = getOptions('Status', admissionDropdowns);
  const caseStatusOptions = getOptions('Case Status', admissionDropdowns);

  const handleApplicationChange = (appId: string) => {
    const selectedApp = applications?.find(app => String(app.id) === String(appId));
    if (selectedApp) {
      form.setValue('applicationId', String(selectedApp.id));
      form.setValue('studentId', selectedApp.studentId);
      form.setValue('university', selectedApp.university || '');
      form.setValue('program', selectedApp.program || '');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="no-not-allowed max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Add New Admission</h2>
                <p className="text-xs text-gray-500">Create a university admission record for a student</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[90vh]">
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Linked Entities Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                  {/* Application selector */}
                  <div>
                    <FormLabel>Application</FormLabel>
                    <div className="mt-1">
                      {applicationId ? (
                        <div className="text-sm text-gray-700">{String(applicationId)}</div>
                      ) : (
                        <div>
                          <Popover open={applicationDropdownOpen} onOpenChange={setApplicationDropdownOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn(!form.getValues('applicationId') && 'text-muted-foreground')}>Select application <ChevronsUpDown className="ml-2 h-4 w-4" /></Button>
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
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <FormLabel>University</FormLabel>
                    <Input value={form.watch('university') || ''} disabled placeholder="Select application" />
                  </div>

                  <div>
                    <FormLabel>Program</FormLabel>
                    <Input value={form.watch('program') || ''} disabled placeholder="Select application" />
                  </div>
                </div>

                {/* Overview panel */}
                <div className="p-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <FormLabel>Status</FormLabel>
                      <Select value={form.watch('status') || ''} onValueChange={(v) => form.setValue('status', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions?.map((opt: any) => (
                            <SelectItem key={opt.key || opt.id} value={opt.value}>{opt.value}</SelectItem>
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
                </div>

                {/* Financial & dates panel */}
                <div className="p-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <FormLabel>Full Tuition Fee</FormLabel>
                      <Input value={form.watch('fullTuitionFee') || ''} onChange={(e) => form.setValue('fullTuitionFee', e.target.value)} placeholder="e.g., 20000" />
                    </div>

                    <div>
                      <FormLabel>Scholarship</FormLabel>
                      <Input value={form.watch('scholarshipAmount') || ''} onChange={(e) => form.setValue('scholarshipAmount', e.target.value)} placeholder="e.g., 5000" />
                    </div>

                    <div>
                      <FormLabel>Net Tuition</FormLabel>
                      <Input value={form.watch('netTuitionFee') || ''} disabled />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="p-2">
                  <FormLabel>Notes</FormLabel>
                  <Textarea value={form.watch('notes') || ''} onChange={(e) => form.setValue('notes', e.target.value)} />
                </div>

                <div className="flex justify-end space-x-2 p-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button onClick={() => form.handleSubmit(onSubmit)()}>{createMutation.isPending ? 'Creating...' : 'Create Admission'}</Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="w-[360px] border-l bg-white flex flex-col min-h-0">
            <div className="sticky top-0 z-10 px-4 py-3 border-b bg-white">
              <h3 className="text-sm font-semibold">Help</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-xs text-gray-500">Provide decision, financials, and visa info for the admission.</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
