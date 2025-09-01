import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout';
import { insertApplicationSchema, type Student, type InsertApplication } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { HelpTooltipSimple as HelpTooltip } from '@/components/help-tooltip-simple';
import { School, FileText, GraduationCap, Calendar, DollarSign, ArrowLeft, PlusCircle } from 'lucide-react';

export default function AddApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const presetStudentId = params.get('studentId') || '';

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: !presetStudentId,
  });

  const form = useForm<InsertApplication>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      studentId: presetStudentId,
      university: '',
      program: '',
      degree: '',
      intakeYear: new Date().getFullYear().toString(),
      intakeSemester: '',
      applicationFee: '',
      status: 'draft',
      notes: '',
    } as any,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertApplication) => {
      const res = await apiRequest('POST', '/api/applications', data as any);
      return res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      if (created?.studentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/applications/student/${created.studentId}`] });
      }
      toast({ title: 'Success', description: 'Application created.' });
      const target = presetStudentId ? `/students/${presetStudentId}` : '/applications';
      setLocation(target);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create application.', variant: 'destructive' });
    },
  });

  const onSubmit = (data: InsertApplication) => createMutation.mutate(data);

  const goBack = () => setLocation(presetStudentId ? `/students/${presetStudentId}` : '/applications');

  return (
    <Layout
      title="Add New Application"
      subtitle="Create a university application for a student"
      helpText="Fill in the application details and submit to track progress."
    >
      <div className="w-full max-w-none sm:max-w-4xl mx-auto px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" onClick={goBack} className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            </motion.div>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Add New Application</h1>
              <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">
                Create a university application for a student
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <HelpTooltip content="Provide university, program, and intake details. Use the status to track progress." />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Application Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student *</FormLabel>
                        <FormControl>
                          {presetStudentId ? (
                            <Input value={presetStudentId} disabled />
                          ) : (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                              <SelectContent>
                                {students?.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name} ({s.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><School className="w-4 h-4" /> University *</FormLabel>
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
                        <FormLabel className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Program *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree</FormLabel>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select degree" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                            <SelectItem value="Master's">Master's</SelectItem>
                            <SelectItem value="PhD">PhD</SelectItem>
                            <SelectItem value="Diploma">Diploma</SelectItem>
                            <SelectItem value="Certificate">Certificate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intakeYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Intake Year</FormLabel>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intakeSemester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intake Semester</FormLabel>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Fall">Fall</SelectItem>
                            <SelectItem value="Spring">Spring</SelectItem>
                            <SelectItem value="Summer">Summer</SelectItem>
                            <SelectItem value="Winter">Winter</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="applicationFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Application Fee</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $50" {...field} />
                        </FormControl>
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
                        <Select value={field.value || 'draft'} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="under-review">Under Review</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="waitlisted">Waitlisted</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={goBack}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Application'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
