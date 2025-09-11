import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

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

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: !studentId,
  });

  const { data: presetStudent } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: !!studentId,
    queryFn: async () => StudentsService.getStudent(studentId as string),
  });

  const form = useForm({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      studentId: studentId || '',
      university: '',
      program: presetStudent?.targetProgram || '',
      courseType: '',
      appStatus: 'Open',
      caseStatus: 'Raw',
      country: '',
      channelPartner: '',
      intake: '',
      googleDriveLink: '',
      notes: '',
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => ApplicationsService.createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/applications/student/${studentId}`] });
      }
      toast({
        title: "Success",
        description: "Application has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
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

  const selectedStudentId = form.watch('studentId');
  const selectedStudent = students?.find((s) => s.id === selectedStudentId) || presetStudent;

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
    setTimeout(() => setLocation(`/students/${sid}`), 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] h-[90vh] p-0 overflow-hidden grid grid-rows-[auto_1fr_auto]">
        <DialogTitle className="sr-only">Add Application</DialogTitle>
        <DialogHeader>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Add New Application</h2>
                <p className="text-xs text-gray-500">Create a university application for a student</p>
              </div>
            </div>
            <div className="flex items-center gap-2" />
          </div>
        </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 pt-2">
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
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
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
                <div className="border-t px-6 py-4 flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createApplicationMutation.isPending}>
                    {createApplicationMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </Form>
      </DialogContent>
    </Dialog>
  );
}
