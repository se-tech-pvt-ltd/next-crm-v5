import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertAdmissionSchema, type InsertAdmission, type Student, type Application } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AddAdmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId?: number;
  studentId?: number;
}

export function AddAdmissionModal({ open, onOpenChange, applicationId, studentId }: AddAdmissionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      studentId: studentId || 0,
      university: '',
      program: '',
      decision: 'pending',
      scholarshipAmount: '',
      conditions: '',
      depositRequired: false,
      depositAmount: '',
      visaStatus: 'pending',
      notes: '',
      decisionDate: null,
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
      decisionDate: data.decisionDate ? new Date(data.decisionDate) : null,
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
                    <FormItem className="col-span-2">
                      <FormLabel>Application</FormLabel>
                      <Select onValueChange={handleApplicationChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an application" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {applications?.map((app) => (
                            <SelectItem key={app.id} value={app.id.toString()}>
                              {app.university} - {app.program}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

              {/* Decision */}
              <FormField
                control={form.control}
                name="decision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select decision" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="waitlisted">Waitlisted</SelectItem>
                        <SelectItem value="deferred">Deferred</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Decision Date */}
              <FormField
                control={form.control}
                name="decisionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decision Date</FormLabel>
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

              {/* Deposit Required */}
              <FormField
                control={form.control}
                name="depositRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Deposit Required</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Deposit Amount */}
              {form.watch('depositRequired') && (
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
              )}

              {/* Deposit Deadline */}
              {form.watch('depositRequired') && (
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
              )}
            </div>

            {/* Conditions */}
            <FormField
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conditions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any admission conditions..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes..."
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