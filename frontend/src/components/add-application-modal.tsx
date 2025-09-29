import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
console.log('[modal] loaded: frontend/src/components/add-application-modal.tsx');
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertApplicationSchema, type Student } from '@/lib/types';
import * as ApplicationsService from '@/services/applications';
import * as StudentsService from '@/services/students';
import * as UsersService from '@/services/users';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { StudentProfileModal } from './student-profile-modal-new';
import { ApplicationDetailsModal } from './application-details-modal-new';
import * as DropdownsService from '@/services/dropdowns';

interface AddApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string;
}

export function AddApplicationModal({ open, onOpenChange, studentId }: AddApplicationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [localProfileOpen, setLocalProfileOpen] = useState(false);
  const [localProfileId, setLocalProfileId] = useState<string | null>(null);
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [currentApplicationObj, setCurrentApplicationObj] = useState<any | null>(null);

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: open && !studentId,
  });

  const { data: presetStudent } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
    queryFn: async () => StudentsService.getStudent(studentId as string),
  });

  // Users for access selection
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const normalizeRole = (r: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');

  const { data: applicationsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Applications'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Applications'),
    enabled: open,
  });

  const makeOptions = (dd: any, candidates: string[]) => {
    let list: any[] = [];
    for (const k of candidates) {
      if (dd && Array.isArray(dd[k])) { list = dd[k]; break; }
    }
    if (!Array.isArray(list)) list = [];
    list = [...list].sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0)));
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
  };

  const appStatusOptions = makeOptions(applicationsDropdowns, ['Status', 'status', 'AppStatus', 'Application Status']);
  const caseStatusOptions = makeOptions(applicationsDropdowns, ['Case Status', 'caseStatus', 'CaseStatus', 'case_status']);
  const courseTypeOptions = makeOptions(applicationsDropdowns, ['Course Type', 'courseType', 'CourseType']);
  const countryOptions = makeOptions(applicationsDropdowns, ['Country', 'Countries', 'country', 'countryList']);
  const channelPartnerOptions = makeOptions(applicationsDropdowns, ['Channel Partner', 'ChannelPartners', 'channelPartner', 'channel_partners']);
  const intakeOptions = makeOptions(applicationsDropdowns, ['Intake', 'intake', 'Intakes']);

  useEffect(() => {
    try {
      if (!form.getValues('appStatus')) {
        const def = appStatusOptions.find(o => o.isDefault);
        if (def) form.setValue('appStatus', def.value as any);
      }
    } catch {}
    try {
      if (!form.getValues('caseStatus')) {
        const def = caseStatusOptions.find(o => o.isDefault);
        if (def) form.setValue('caseStatus', def.value as any);
      }
    } catch {}
    try {
      if (!form.getValues('courseType')) {
        const def = courseTypeOptions.find(o => o.isDefault);
        if (def) form.setValue('courseType', def.value as any);
      }
    } catch {}
    try {
      if (!form.getValues('country')) {
        const def = countryOptions.find(o => o.isDefault);
        if (def) form.setValue('country', def.value as any);
      }
    } catch {}
    try {
      if (!form.getValues('channelPartner')) {
        const def = channelPartnerOptions.find(o => o.isDefault);
        if (def) form.setValue('channelPartner', def.value as any);
      }
    } catch {}
    try {
      if (!form.getValues('intake')) {
        const def = intakeOptions.find(o => o.isDefault);
        if (def) form.setValue('intake', def.value as any);
      }
    } catch {}
  }, [applicationsDropdowns]);

  const form = useForm({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      studentId: studentId || '',
      university: '',
      program: presetStudent?.targetProgram || '',
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
    },
  });

  // Determine selected student's branch (depends on form)
  const selectedStudentId = form.watch('studentId');
  const selectedStudent = (Array.isArray(students) ? students.find((s) => s.id === selectedStudentId) : null) || presetStudent;
  const selectedBranchId = (selectedStudent as any)?.branchId || null;

  // Reset access selections when branch context changes
  useEffect(() => {
    form.setValue('counsellorId', '');
    form.setValue('admissionOfficerId', '');
  }, [selectedBranchId]);

  const counsellorOptions = Array.isArray(users) && selectedBranchId
    ? users
        .filter((u: any) => {
          const role = normalizeRole(u.role || u.role_name || u.roleName);
          return (
            (role === 'counselor' || role === 'counsellor' || role === 'admin_staff') &&
            String(u.branchId || '') === String(selectedBranchId || '')
          );
        })
        .map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'User') }))
    : [];
  const officerOptions = Array.isArray(users) && selectedBranchId
    ? users
        .filter((u: any) => {
          const role = normalizeRole(u.role || u.role_name || u.roleName);
          return (
            (role === 'admission_officer' || role === 'admission' || role === 'admissionofficer' || role === 'admission officer') &&
            String(u.branchId || '') === String(selectedBranchId || '')
          );
        })
        .map((u: any) => ({ value: String(u.id), label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email || 'User') }))
    : [];

  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => ApplicationsService.createApplication(data),
    onSuccess: (application: any) => {
      const sid = application?.studentId || form.getValues('studentId') || studentId;
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      if (sid) {
        queryClient.invalidateQueries({ queryKey: [`/api/applications/student/${sid}`] });
      }
      toast({
        title: "Success",
        description: "Application has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
      if (sid) {
        setTimeout(() => openStudentProfile(sid), 240);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createApplicationMutation.mutate(data);
  };


  useEffect(() => {
    if (studentId) {
      form.setValue('studentId', studentId);
    }
    if (presetStudent && presetStudent.id) {
      form.setValue('studentId', presetStudent.id);
    }
  }, [studentId, presetStudent]);

  const openStudentProfile = (sid?: string) => {
    if (!sid) return;
    onOpenChange(false);
    setTimeout(() => {
      try {
        // Open local StudentProfileModal to avoid relying on global routing/events
        setLocalProfileId(sid);
        setLocalProfileOpen(true);
      } catch (e) {
        // fallback to existing approach
        try { window.dispatchEvent(new CustomEvent('open-student-profile', { detail: { id: sid } })); } catch {}
        try { setLocation(`/students?studentId=${sid}`); } catch {}
      }
    }, 240);
  };

  return (<>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="no-not-allowed w-[62.5vw] max-w-7xl max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl" style={{ touchAction: 'pan-y' }}>
        <DialogTitle className="sr-only">Add Application</DialogTitle>
        <div className="flex flex-col h-[90vh] min-h-0">
        <DialogHeader>
          <div className="px-4 py-3 flex items-center justify-between bg-[#223E7D] text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Add New Application</h2>
                <p className="text-xs text-gray-500">Create a university application for a student</p>
              </div>
            </div>
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
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={createApplicationMutation.isPending}
                className="px-3 h-8 text-xs bg-[#0071B0] hover:bg-[#00649D] text-white rounded-md"
              >
                {createApplicationMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="p-6 pt-2">
                  <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Linked Entities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-xs">
                      <div className="text-[11px] text-gray-500">Student ID</div>
                      <div className="font-medium">
                        {presetStudent?.student_id || selectedStudent?.student_id || selectedStudent?.id ? (
                          <Button type="button" variant="link" className="p-0 h-6" onClick={() => openStudentProfile(presetStudent?.id || selectedStudent?.id)}>
                            {presetStudent?.student_id || selectedStudent?.student_id || selectedStudent?.id}
                          </Button>
                        ) : (
                          '-'
                        )}
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="text-[11px] text-gray-500">Student Name</div>
                      <div className="font-medium">{presetStudent?.name || selectedStudent?.name || '-'}</div>
                    </div>
                    <div className="text-xs">
                      <div className="text-[11px] text-gray-500">Email</div>
                      <div className="font-medium">{presetStudent?.email || selectedStudent?.email || '-'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Program Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="hidden" {...form.register('studentId')} />

                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter university name" {...field} />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select channel partner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {channelPartnerOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="program"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Computer Science, Business Administration" {...field} />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courseTypeOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                            ))}
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
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countryOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intake</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select intake" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {intakeOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Access */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Access</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="counsellorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Counsellor</FormLabel>
                        <FormControl>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedBranchId ? 'Select counsellor' : 'No branch linked to student'} />
                              </SelectTrigger>
                            </FormControl>
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
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedBranchId ? 'Select admission officer' : 'No branch linked to student'} />
                              </SelectTrigger>
                            </FormControl>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status & Links</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="appStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'Open'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {appStatusOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                            ))}
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
                        <Select onValueChange={field.onChange} value={field.value || 'Raw'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select case status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {caseStatusOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value as string}>{opt.label}</SelectItem>
                            ))}
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
                        <FormLabel>Google Drive Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://drive.google.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea rows={4} placeholder="Any additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

                  </div>
                </div>
                              </form>
            </Form>
        </div>
      </div>
      </DialogContent>
    </Dialog>
    <StudentProfileModal
      open={localProfileOpen}
      onOpenChange={(o) => {
        setLocalProfileOpen(o);
        if (!o) setLocalProfileId(null);
      }}
      studentId={localProfileId}
      onOpenAddApplication={(sid) => {
        // Close profile modal and reopen this AddApplicationModal for the given student id
        try {
          setLocalProfileOpen(false);
          // Ensure parent AddApplicationModal is reopened
          setTimeout(() => {
            try {
              // set the form studentId and emit open
              form.setValue('studentId', sid || '');
            } catch {}
            try { onOpenChange(true); } catch {}
          }, 120);
        } catch (e) {
          console.error('failed to reopen add application from profile', e);
        }
      }}
      onOpenApplication={(app) => {
        setCurrentApplicationObj(app);
        try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAppDetailsOpen(true)); } catch { setIsAppDetailsOpen(true); }
      }}
    />

    <ApplicationDetailsModal
      open={isAppDetailsOpen}
      onOpenChange={(open) => { setIsAppDetailsOpen(open); if (!open) setCurrentApplicationObj(null); }}
      application={currentApplicationObj}
    />
    </>
  );
}
