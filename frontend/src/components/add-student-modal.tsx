import { useState } from 'react';
import { useForm } from 'react-hook-form';
console.log('[modal] loaded: frontend/src/components/add-student-modal.tsx');
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertStudentSchema, type Lead } from '@/lib/types';
import * as StudentsService from '@/services/students';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from './help-tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import * as DropdownsService from '@/services/dropdowns';

interface AddStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: number;
}

export function AddStudentModal({ open, onOpenChange, leadId }: AddStudentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    enabled: !leadId,
  });

  const selectedLead = leadId ? leads?.find(l => l.id === leadId) : null;

  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/students'],
    queryFn: async () => DropdownsService.getModuleDropdowns('students'),
  });

  const dropdownsForStudents = () => {
    return (dropdownData as any)?.Counsellor || (dropdownData as any)?.Counselor || (dropdownData as any)?.counsellor || [];
  };

  const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const toStringValue = (value: unknown) => (value == null ? '' : String(value));
  const getFieldOptions = (fieldName: string): any[] => {
    const data = dropdownData as any;
    if (!data) return [];
    const target = normalize(fieldName);
    const entry = Object.entries(data).find(([k]) => normalize(String(k)) === target);
    return (entry?.[1] as any[]) || [];
  };

  const form = useForm({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      leadId: leadId || null,
      name: selectedLead?.name || '',
      email: selectedLead?.email || '',
      phone: selectedLead?.phone || '',
      dateOfBirth: '',
      nationality: '',
      passportNumber: '',
      academicBackground: '',
      englishProficiency: '',
      targetCountry: selectedLead?.country || '',
      targetProgram: selectedLead?.program || '',
      budget: '',
      status: 'active',
      notes: selectedLead?.notes || '',
      expectation: selectedLead?.expectation || '',
      counselorId: selectedLead?.counselorId || selectedLead?.counsellor || '',
      consultancyFree: false,
      scholarship: false,
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => StudentsService.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Success",
        description: "Student has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create student. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createStudentMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add New Student</DialogTitle>
            <HelpTooltip content="Create a new student profile with detailed academic and personal information for application tracking." />
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter nationality" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passport Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter passport number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expectation</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select expectation" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFieldOptions('expectation').map((opt: any) => (
                            <SelectItem key={opt.key || opt.id || opt.value} value={(opt.key || opt.id || opt.value) as string}>
                              {opt.value}
                            </SelectItem>
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
                name="counselorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Counsellor</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select counsellor" />
                        </SelectTrigger>
                        <SelectContent>
                          {(dropdownsForStudents() || []).map((opt: any) => (
                            <SelectItem key={opt.key || opt.id} value={opt.key || opt.id}>{opt.value}</SelectItem>
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
                name="consultancyFree"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value || false} onCheckedChange={(v) => field.onChange(!!v)} />
                    </FormControl>
                    <FormLabel>Consultancy Free</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scholarship"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value || false} onCheckedChange={(v) => field.onChange(!!v)} />
                    </FormControl>
                    <FormLabel>Scholarship</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USA">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Netherlands">Netherlands</SelectItem>
                        <SelectItem value="New Zealand">New Zealand</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetProgram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Program</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science, Business, Medicine" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="englishProficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>English Proficiency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select proficiency level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IELTS 6.0">IELTS 6.0</SelectItem>
                        <SelectItem value="IELTS 6.5">IELTS 6.5</SelectItem>
                        <SelectItem value="IELTS 7.0">IELTS 7.0</SelectItem>
                        <SelectItem value="IELTS 7.5">IELTS 7.5</SelectItem>
                        <SelectItem value="IELTS 8.0+">IELTS 8.0+</SelectItem>
                        <SelectItem value="TOEFL 80">TOEFL 80</SelectItem>
                        <SelectItem value="TOEFL 90">TOEFL 90</SelectItem>
                        <SelectItem value="TOEFL 100">TOEFL 100</SelectItem>
                        <SelectItem value="TOEFL 110+">TOEFL 110+</SelectItem>
                        <SelectItem value="Native">Native Speaker</SelectItem>
                        <SelectItem value="Not tested">Not Yet Tested</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Range</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="$10,000 - $20,000">$10,000 - $20,000</SelectItem>
                        <SelectItem value="$20,000 - $30,000">$20,000 - $30,000</SelectItem>
                        <SelectItem value="$30,000 - $50,000">$30,000 - $50,000</SelectItem>
                        <SelectItem value="$50,000 - $70,000">$50,000 - $70,000</SelectItem>
                        <SelectItem value="$70,000+">$70,000+</SelectItem>
                        <SelectItem value="Looking for scholarships">Looking for scholarships</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="admitted">Admitted</SelectItem>
                        <SelectItem value="enrolled">Enrolled</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="academicBackground"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Background</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter academic qualifications, degrees, institutions..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the student..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStudentMutation.isPending}>
                {createStudentMutation.isPending ? 'Adding...' : 'Add Student'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
