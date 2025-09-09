import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/help-tooltip';
import { useLocation } from 'wouter';
import { Application, Student } from '@/lib/types';
import * as ApplicationsService from '@/services/applications';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreHorizontal, Calendar, DollarSign, School, FileText, Clock, CheckCircle, AlertCircle, Filter, GraduationCap } from 'lucide-react';
import { ApplicationDetailsModal } from '@/components/application-details-modal-new';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as DropdownsService from '@/services/dropdowns';
import { useMemo } from 'react';

export default function Applications() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [, setLocation] = useLocation();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Application> }) => ApplicationsService.updateApplication(id, data),
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

  const filteredApplications = applications?.filter(app => {
    const statusMatch = statusFilter === 'all' || app.appStatus === statusFilter;
    const universityMatch = universityFilter === 'all' || app.university === universityFilter;
    return statusMatch && universityMatch;
  }) || [];

  // Get unique universities for filter dropdown
  const uniqueUniversities = applications ? 
    applications.reduce((universities: string[], app) => {
      if (app.university && !universities.includes(app.university)) {
        universities.push(app.university);
      }
      return universities;
    }, []) : [];

  const getStudentName = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'Needs Attention':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-gray-200 text-gray-800';
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
      <div className="space-y-3">

        {/* Applications Overview Cards (match Students sizing) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <FileText className="w-3 h-3 text-gray-500" />
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold">
                {applicationsLoading ? <Skeleton className="h-6 w-12" /> : applications?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-blue-500" />
                Open
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-blue-600">
                {applicationsLoading ? <Skeleton className="h-6 w-12" /> : applications?.filter(a => a.appStatus === 'Open').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Clock className="w-3 h-3 text-yellow-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-yellow-600">
                {applicationsLoading ? <Skeleton className="h-6 w-12" /> : applications?.filter(a => a.appStatus === 'Needs Attention').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-green-500" />
                Closed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-green-600">
                {applicationsLoading ? <Skeleton className="h-6 w-12" /> : applications?.filter(a => a.appStatus === 'Closed').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table with Filters (match Students) */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Filter className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Filters:</span>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={universityFilter} onValueChange={setUniversityFilter}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Filter by university" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Universities</SelectItem>
                    {uniqueUniversities.map((university) => (
                      <SelectItem key={university} value={university}>
                        {university}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(statusFilter !== 'all' || universityFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setStatusFilter('all');
                      setUniversityFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
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
              <EmptyState
                icon={<GraduationCap className="h-12 w-12" />}
                title="No applications found"
                description={statusFilter === 'all' ? 'Applications will appear here when students apply to universities.' : `No applications with status "${statusFilter}".`}
                action={
                  <Button onClick={() => setLocation('/applications/add')}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Application
                  </Button>
                }
              />
            ) : (
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 text-[11px]">Student</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">University</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Program</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Status</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Intake</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Created</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow
                      key={application.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => { setSelectedApplication(application); setIsDetailsOpen(true); }}
                    >
                      <TableCell className="font-medium p-2 text-xs">
                        {getStudentName(application.studentId)}
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="flex items-center text-xs">
                          <School className="w-3 h-3 mr-1" />
                          <span>{application.university}</span>
                          {application.applicationCode && (
                            <span className="ml-2 text-[11px] text-gray-500">({application.applicationCode})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="text-xs">
                          {application.program}
                          {application.courseType && (
                            <div className="text-[11px] text-gray-500">{application.courseType}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <Badge className={getStatusColor(application.appStatus || 'Open')}>
                          {application.appStatus || 'Open'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="text-xs">
                          {application.intake || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(application.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => { setSelectedApplication(application); setIsDetailsOpen(true); }}
                            >
                              View Details
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

      <ApplicationDetailsModal
        open={isDetailsOpen}
        onOpenChange={(open) => { setIsDetailsOpen(open); if (!open) setSelectedApplication(null); }}
        application={selectedApplication}
      />
    </Layout>
  );
}
