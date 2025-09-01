import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ActivityTracker } from '@/components/activity-tracker';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type Application, type Student } from '@/lib/types';
import { ArrowLeft, School, User, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function ApplicationDetails() {
  const [match, params] = useRoute('/applications/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: application, isLoading, error } = useQuery<Application>({
    queryKey: ['/api/applications', params?.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/applications/${params?.id}`);
      if (!res.ok) throw new Error('Failed to load application');
      return res.json();
    },
    enabled: !!params?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: student } = useQuery<Student>({
    queryKey: application?.studentId ? ['/api/students', application.studentId] : ['noop'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/students/${application?.studentId}`);
      return res.json();
    },
    enabled: !!application?.studentId,
  });

  const [currentStatus, setCurrentStatus] = useState<string>(application?.appStatus || 'Open');

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!application) return;
      const res = await apiRequest('PUT', `/api/applications/${application.id}`, { appStatus: newStatus });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({ title: 'Status updated' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'Needs Attention': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!match) return <div>Not found</div>;

  if (error) {
    return (
      <Layout title="Application Details">
        <Card><CardContent className="p-6">Error loading application</CardContent></Card>
      </Layout>
    );
  }

  return (
    <Layout
      title={
        <Button variant="ghost" size="sm" onClick={() => setLocation('/applications')} className="p-1 h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      }
      helpText="View application details."
    >
      {isLoading || !application ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-4 text-xs md:text-[12px]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">
                {application.university}
                {application.applicationCode && (
                  <span className="ml-2 text-sm text-gray-500">({application.applicationCode})</span>
                )}
              </h1>
              <p className="text-sm text-gray-600">{application.program}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(application.appStatus || 'Open')}>
                {application.appStatus || 'Open'}
              </Badge>
              <div>
                <label className="text-xs text-gray-500">Change Status</label>
                <Select value={currentStatus} onValueChange={(v) => { setCurrentStatus(v); updateStatusMutation.mutate(v); }}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm"><School className="w-5 h-5 mr-2" />Application Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">University</label>
                      <p className="text-lg font-semibold">{application.university}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Program</label>
                      <p className="text-lg font-semibold">{application.program}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Course Type</label>
                      <p>{application.courseType || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Country</label>
                      <p>{application.country || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Intake</label>
                      <p>{application.intake || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Channel Partner</label>
                      <p>{application.channelPartner || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Google Drive Link</label>
                      <p>{application.googleDriveLink ? (
                        <a className="text-blue-600 underline inline-flex items-center gap-1" href={application.googleDriveLink} target="_blank" rel="noreferrer">
                          Open Link <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : 'Not provided'}</p>
                    </div>
                  </div>
                  {application.notes && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="mt-1 text-gray-800">{application.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityTracker
                    entityType="application"
                    entityId={application.id}
                    entityName={`${application.university} - ${application.program}`}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm"><User className="w-4 h-4 mr-2" />Student</CardTitle>
                </CardHeader>
                <CardContent>
                  {student ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-gray-600">{student.email}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setLocation(`/students/${student.id}`)}>View Profile</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Loading student...</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
