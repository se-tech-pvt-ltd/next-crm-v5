import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/help-tooltip';
import { AddApplicationModal } from '@/components/add-application-modal';
import { ApplicationDetailsModal } from '@/components/application-details-modal';
import { StudentProfileModal } from '@/components/student-profile-modal';
import { Application, Student } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreHorizontal, FileText, Calendar, DollarSign, School } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Applications() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddApplicationModalOpen, setIsAddApplicationModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isStudentProfileModalOpen, setIsStudentProfileModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Application> }) => {
      const response = await apiRequest('PUT', `/api/applications/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({
        title: "Success",
        description: "Application updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive",
      });
    },
  });

  const filteredApplications = applications?.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  ) || [];

  const getStudentName = (studentId: number) => {
    const student = students?.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under-review':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'waitlisted':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Layout 
      title="Applications" 
      subtitle="Track university applications"
      helpText="Applications are submitted to universities on behalf of students. Track their progress and manage deadlines."
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
              </SelectContent>
            </Select>
            <HelpTooltip content="Filter applications by status. Track progress from draft to final decision." />
          </div>
          
          <Button onClick={() => setIsAddApplicationModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>

        {/* Applications Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applicationsLoading ? <Skeleton className="h-8 w-16" /> : applications?.length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {applicationsLoading ? <Skeleton className="h-8 w-16" /> : applications?.filter(a => a.status === 'submitted').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {applicationsLoading ? <Skeleton className="h-8 w-16" /> : applications?.filter(a => a.status === 'under-review').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {applicationsLoading ? <Skeleton className="h-8 w-16" /> : applications?.filter(a => a.status === 'accepted').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications List</CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {statusFilter === 'all' 
                    ? "Applications will appear here when students apply to universities."
                    : `No applications with status "${statusFilter}".`
                  }
                </p>
                <div className="mt-6">
                  <Button onClick={() => setIsAddApplicationModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Application
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Intake</TableHead>
                    <TableHead>Application Fee</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow 
                      key={application.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedApplication(application);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        {getStudentName(application.studentId)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <School className="w-3 h-3 mr-1" />
                          {application.university}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {application.program}
                          {application.degree && (
                            <div className="text-xs text-gray-500">{application.degree}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(application.status || 'draft')}>
                          {application.status || 'draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {application.intakeSemester} {application.intakeYear}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {application.applicationFee || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(application.submissionDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedApplication(application);
                                setIsDetailsModalOpen(true);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateApplicationMutation.mutate({ id: application.id, data: { status: 'submitted' } })}>
                              Mark as Submitted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateApplicationMutation.mutate({ id: application.id, data: { status: 'under-review' } })}>
                              Mark Under Review
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateApplicationMutation.mutate({ id: application.id, data: { status: 'accepted' } })}>
                              Mark as Accepted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateApplicationMutation.mutate({ id: application.id, data: { status: 'rejected' } })}>
                              Mark as Rejected
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AddApplicationModal 
        open={isAddApplicationModalOpen}
        onOpenChange={setIsAddApplicationModalOpen}
      />
      
      <ApplicationDetailsModal 
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        application={selectedApplication}
        onOpenStudentProfile={(studentId) => {
          setSelectedStudentId(studentId);
          setIsStudentProfileModalOpen(true);
          setIsDetailsModalOpen(false);
        }}
      />
      
      <StudentProfileModal 
        open={isStudentProfileModalOpen}
        onOpenChange={setIsStudentProfileModalOpen}
        studentId={selectedStudentId}
      />
    </Layout>
  );
}
