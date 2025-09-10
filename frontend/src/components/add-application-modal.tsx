import { useState } from 'react';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
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

        <div className="flex h-[90vh]">
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Student & Program</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {studentId ? (
                    <FormItem className="flex flex-col">
                      <FormLabel>Student *</FormLabel>
                      <div className="mt-1">
                        <Button type="button" variant="link" className="p-0 h-8 text-sm text-left" onClick={() => { onOpenChange(false); setTimeout(() => setLocation(`/students/${studentId}`), 0); }}>
                          {presetStudent ? `${presetStudent.name} (${presetStudent.email})` : 'View student'}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  ) : (
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Student *</FormLabel>
                          <Popover open={studentDropdownOpen} onOpenChange={setStudentDropdownOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? students?.find((student) => student.id === field.value)
                                      ? `${students.find((student) => student.id === field.value)?.name} (${students.find((student) => student.id === field.value)?.email})`
                                      : "Select student"
                                    : "Select student"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search by name or email..." />
                                <CommandList>
                                  <CommandEmpty>No students found.</CommandEmpty>
                                  <CommandGroup>
                                    {students?.map((student) => (
                                      <CommandItem
                                        value={`${student.name} ${student.email}`}
                                        key={student.id}
                                        onSelect={() => {
                                          field.onChange(student.id);
                                          setStudentDropdownOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            student.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{student.name}</span>
                                          <span className="text-sm text-gray-500">{student.email}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

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

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createApplicationMutation.isPending}>
                {createApplicationMutation.isPending ? 'Creating...' : 'Create Application'}
              </Button>
            </div>
          </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
