import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertLeadSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltip } from './help-tooltip';
import { MultiSelect } from './multi-select';

interface AddLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLeadModal({ open, onOpenChange }: AddLeadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing leads and students to prevent duplicates
  const { data: existingLeads } = useQuery({
    queryKey: ['/api/leads'],
  });

  const { data: existingStudents } = useQuery({
    queryKey: ['/api/students'],
  });

  // Get counselors for counselor field
  const { data: counselors } = useQuery({
    queryKey: ['/api/users'],
  });

  const form = useForm({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      program: '',
      source: '',
      status: 'new',
      counselorId: '',
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/leads', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Success",
        description: "Lead has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Check for duplicate email in existing leads
    if (Array.isArray(existingLeads)) {
      const duplicateLead = existingLeads.find(
        (lead: any) => lead.email === data.email
      );
      if (duplicateLead) {
        toast({
          title: "Error",
          description: "A lead with this email already exists.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check for duplicate email in existing students
    if (Array.isArray(existingStudents)) {
      const duplicateStudent = existingStudents.find(
        (student: any) => student.email === data.email
      );
      if (duplicateStudent) {
        toast({
          title: "Error",
          description: "A student with this email already exists.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check for duplicate phone if provided
    if (data.phone) {
      let duplicateFound = false;
      
      if (Array.isArray(existingLeads)) {
        const duplicatePhoneLead = existingLeads.find(
          (lead: any) => lead.phone === data.phone
        );
        if (duplicatePhoneLead) duplicateFound = true;
      }
      
      if (Array.isArray(existingStudents)) {
        const duplicatePhoneStudent = existingStudents.find(
          (student: any) => student.phone === data.phone
        );
        if (duplicatePhoneStudent) duplicateFound = true;
      }
      
      if (duplicateFound) {
        toast({
          title: "Error",
          description: "A contact with this phone number already exists.",
          variant: "destructive",
        });
        return;
      }
    }

    createLeadMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add New Lead</DialogTitle>
            <HelpTooltip content="Fill out basic information to create a lead. You can add more details later when converting to a student." />
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                name="counselorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Counselor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select counselor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(counselors) ? counselors.filter((user: any) => user.role === 'counselor' || user.role === 'admin_staff').map((counselor: any) => (
                          <SelectItem key={counselor.id} value={counselor.id}>
                            {counselor.email}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social-media">Social Media</SelectItem>
                        <SelectItem value="advertisement">Advertisement</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Countries of Interest</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={[
                          { label: 'United States', value: 'usa' },
                          { label: 'Canada', value: 'canada' },
                          { label: 'United Kingdom', value: 'uk' },
                          { label: 'Australia', value: 'australia' },
                          { label: 'Germany', value: 'germany' },
                          { label: 'France', value: 'france' },
                          { label: 'Netherlands', value: 'netherlands' },
                          { label: 'New Zealand', value: 'new-zealand' },
                        ]}
                        value={Array.isArray(field.value) ? field.value : (field.value ? [field.value] : [])}
                        onChange={field.onChange}
                        placeholder="Select countries"
                      />
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
                    <FormLabel>Programs of Interest</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={[
                          { label: 'Business Administration', value: 'business-admin' },
                          { label: 'Computer Science', value: 'computer-science' },
                          { label: 'Engineering', value: 'engineering' },
                          { label: 'Medicine', value: 'medicine' },
                          { label: 'Law', value: 'law' },
                          { label: 'Arts & Humanities', value: 'arts-humanities' },
                          { label: 'Social Sciences', value: 'social-sciences' },
                          { label: 'Natural Sciences', value: 'natural-sciences' },
                          { label: 'Education', value: 'education' },
                          { label: 'Psychology', value: 'psychology' },
                        ]}
                        value={Array.isArray(field.value) ? field.value : (field.value ? [field.value] : [])}
                        onChange={field.onChange}
                        placeholder="Select programs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>



            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLeadMutation.isPending}>
                {createLeadMutation.isPending ? 'Adding...' : 'Add Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
