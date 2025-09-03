import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertAdmissionSchema, type InsertAdmission, type Student, type Application } from '@/lib/types';
import * as AdmissionsService from '@/services/admissions';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddAdmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId?: number;
  studentId?: string;
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

  const form = useForm<InsertAdmission>({
    resolver: zodResolver(insertAdmissionSchema),
    defaultValues: {
      applicationId: applicationId || 0,
      studentId: studentId || '',
      university: '',
      program: '',
      scholarshipAmount: '',
      depositAmount: '',
      visaStatus: 'pending',
      notes: '',
      depositDeadline: null
    }
  });

  const createAdmissionMutation = useMutation({
    mutationFn: async (admission: InsertAdmission) => {
      return apiRequest('/api/admissions', 'POST', admission);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      toast({
        title: "Success",
        description: "Admission record created successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create admission record. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: InsertAdmission) => {
    createAdmissionMutation.mutate({
      ...data,
      depositDeadline: data.depositDeadline ? new Date(data.depositDeadline) : null
    });
  };

  // Auto-populate university and program when application is selected
  const handleApplicationChange = (appId: string) => {
    const selectedApp = applications?.find(app => app.id === parseInt(appId));
    if (selectedApp) {
      form.setValue('applicationId', selectedApp.id);
      form.setValue('studentId', selectedApp.studentId);
      form.setValue('university', selectedApp.university);
      form.setValue('program', selectedApp.program);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Admission Record</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Application Selection */}
              {!applicationId && (
                <FormField
                  control={form.control}
                  name="applicationId"
                  render={({ field }) => (
                    <FormItem className="col-span-2 flex flex-col">
                      <FormLabel>Application</FormLabel>
                      <Popover open={applicationDropdownOpen} onOpenChange={setApplicationDropdownOpen}>
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
                                ? (() => {
                                    const selectedApp = applications?.find((app) => app.id === field.value);
                                    const student = students?.find((s) => s.id === selectedApp?.studentId);
                                    return selectedApp && student
                                      ? `${student.name} - ${selectedApp.university} (${selectedApp.program})`
                                      : "Select application";
                                  })()
                                : "Select application"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
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
                                    <CommandItem
                                      value={`${student?.name} ${student?.email} ${app.university} ${app.program}`}
                                      key={app.id}
                                      onSelect={() => {
                                        handleApplicationChange(app.id.toString());
                                        setApplicationDropdownOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          app.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* University */}
              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter university name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Program */}
              <FormField
                control={form.control}
                name="program"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter program name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              {/* Scholarship Amount */}
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

              {/* Visa Status */}
              <FormField
                control={form.control}
                name="visaStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visa Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'pending'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visa status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="not_required">Not Required</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Deposit Amount */}
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

              {/* Deposit Deadline */}
              <FormField
                control={form.control}
                name="depositDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit Deadline</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional notes..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAdmissionMutation.isPending}>
                {createAdmissionMutation.isPending ? 'Creating...' : 'Create Admission'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
