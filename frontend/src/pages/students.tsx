import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { AddApplicationModal } from '@/components/add-application-modal';
import { StudentDetailsModal } from '@/components/student-details-modal';
import { StudentProfileModal } from '@/components/student-profile-modal-new';
import { ApplicationDetailsModal } from '@/components/application-details-modal-new';
import { Student } from '@/lib/types';
import * as DropdownsService from '@/services/dropdowns';
import * as StudentsService from '@/services/students';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, GraduationCap, Phone, Mail, Globe, Users, UserCheck, Target, TrendingUp, Filter, BookOpen } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLocation, useRoute } from 'wouter';

export default function Students() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [isAddApplicationModalOpen, setIsAddApplicationModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedApplicationForDetails, setSelectedApplicationForDetails] = useState<any | null>(null);
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [location, setLocation] = useLocation();
  const [matchStudent, studentParams] = useRoute('/students/:id');
  const [matchEdit, editParams] = useRoute('/students/:id/edit');
  const [matchCreateApp, createAppParams] = useRoute('/students/:id/application');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8); // 8 records per page

  const { data: studentsResponse, isLoading } = useQuery({
    queryKey: ['/api/students', { page: currentPage, limit: pageSize }],
    queryFn: async () => StudentsService.getStudents({ page: currentPage, limit: pageSize }),
    staleTime: 0,
    refetchOnMount: true,
  });

  const studentsArray: Student[] = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse?.data || []);
  const rawPagination = studentsResponse && !Array.isArray(studentsResponse) ? studentsResponse.pagination : undefined;
  const pagination = rawPagination || { page: currentPage, limit: pageSize, total: studentsArray.length, totalPages: Math.max(1, Math.ceil(studentsArray.length / pageSize)), hasNextPage: currentPage * pageSize < (studentsArray.length || 0), hasPrevPage: currentPage > 1 };

  // Fetch dropdowns for Students module (for status labels)
  const { data: studentDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/students'],
    queryFn: async () => DropdownsService.getModuleDropdowns('students'),
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Student> }) => StudentsService.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Success",
        description: "Student updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update student.",
        variant: "destructive",
      });
    },
  });

  const getStatusLabel = (raw?: string) => {
    const list: any[] = (studentDropdowns as any)?.Status || [];
    const s = raw || '';
    const match = list.find((o: any) => o.id === s || o.key === s || o.value?.toLowerCase() === s.toLowerCase());
    return (match?.value || s || '').toString();
  };

  // Apply filters across the full students array
  const filteredAll = studentsArray?.filter(student => {
    const label = getStatusLabel(student.status).toLowerCase();
    const statusMatch = statusFilter === 'all' || label === statusFilter;
    const countryMatch = countryFilter === 'all' || student.targetCountry === countryFilter;
    return statusMatch && countryMatch;
  }) || [];

  // Detect if server returned pagination metadata
  const serverPaginated = Boolean(studentsResponse && !Array.isArray(studentsResponse) && studentsResponse.pagination);

  // If server paginated, studentsArray already contains only current page items; otherwise perform client-side slicing
  const pagedStudents = serverPaginated ? filteredAll : (filteredAll || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // For rendering and counts use pagedStudents
  const filteredStudents = pagedStudents;

  // Get unique countries for filter dropdown
  const uniqueCountries = studentsArray ?
    studentsArray.reduce((countries: string[], student) => {
      if (student.targetCountry && !countries.includes(student.targetCountry)) {
        countries.push(student.targetCountry);
      }
      return countries;
    }, []) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'admitted':
        return 'bg-purple-100 text-purple-800';
      case 'enrolled':
        return 'bg-emerald-100 text-emerald-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCounsellorName = (id?: string) => {
    const list: any[] = (studentDropdowns as any)?.Counsellor || (studentDropdowns as any)?.Counselor || (studentDropdowns as any)?.counsellor || [];
    const match = list.find((o: any) => o.key === id || o.id === id || o.value === id);
    return match?.value || id || '';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramId = params.get('studentId');
      if (paramId) {
        setLocation(`/students/${paramId}`);
      }
    }

    const handler = (e: any) => {
      const id = e?.detail?.id || new URLSearchParams(window.location.search).get('studentId') || new URLSearchParams(window.location.search).get('id');
      if (id) {
        setLocation(`/students/${id}`);
      }
    };

    window.addEventListener('open-student-profile', handler);
    return () => window.removeEventListener('open-student-profile', handler);
  }, [location]);

  const handleViewProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
    setLocation(`/students/${studentId}`);
  };

  // Open profile when route matches
  useEffect(() => {
    if (matchStudent || matchEdit) {
      const id = (matchEdit ? editParams?.id : studentParams?.id) || null;
      if (id) setSelectedStudentId(id);
      setIsProfileModalOpen(true);
    }
  }, [matchStudent, matchEdit, studentParams?.id, editParams?.id]);

  // Open Add Application modal when route matches /students/:id/application
  useEffect(() => {
    if (matchCreateApp) {
      const id = createAppParams?.id || studentParams?.id || null;
      if (id) setSelectedStudentId(id);
      setIsAddApplicationModalOpen(true);
    }
  }, [matchCreateApp, createAppParams?.id, studentParams?.id]);

  const handleCreateApplication = (studentId: string) => {
    setSelectedStudentId(studentId);
    try { setLocation(`/students/${studentId}/application`); } catch {}
    try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAddApplicationModalOpen(true)); } catch { setIsAddApplicationModalOpen(true); }
  };

  return (
    <Layout
      title="Students"
      subtitle="Manage and track your active students"
    >
      <div className="space-y-3">
        {/* Students Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-500" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold">
                {isLoading ? <Skeleton className="h-6 w-12" /> : (pagination?.total || studentsArray.length) || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <UserCheck className="w-3 h-3 text-green-500" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-green-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : studentsArray?.filter(s => s.status === 'active').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Target className="w-3 h-3 text-blue-500" />
                Applied
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-blue-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : studentsArray?.filter(s => s.status === 'applied').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                Admitted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-purple-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : studentsArray?.filter(s => s.status === 'admitted').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
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
                    {(studentDropdowns as any)?.Status?.map((status: any) => (
                      <SelectItem key={status.key || status.id || status.value} value={(status.value || '').toLowerCase()}>
                        {status.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {uniqueCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(statusFilter !== 'all' || countryFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setStatusFilter('all');
                      setCountryFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>

            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="h-10 w-10" />}
                title="No students found"
                description={statusFilter === 'all' ? 'Students will appear here when leads are converted.' : `No students with status "${statusFilter}".`}
              />
            ) : (
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 text-[11px]">ID</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Name</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Contact</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Target Program</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Expectation</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Status</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewProfile(student.id)}
                    >
                      <TableCell className="p-2 text-xs">{student.student_id || student.id}</TableCell>
                      <TableCell className="p-2 text-xs">{student.name}</TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="space-y-1">
                          {student.phone ? (
                            <div className="flex items-center text-xs">
                              <Phone className="w-3 h-3 mr-1" />
                              {student.phone}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">-</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="space-y-1">
                          {student.targetCountry && (
                            <div className="flex items-center text-xs">
                              <Globe className="w-3 h-3 mr-1" />
                              {student.targetCountry}
                            </div>
                          )}
                          {student.targetProgram && (
                            <div className="flex items-center text-xs text-gray-500">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {student.targetProgram}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">{student.expectation || '-'}</TableCell>
                      <TableCell className="p-2 text-xs">
                        {(() => {
                          const label = getStatusLabel(student.status);
                          return (
                            <Badge className={getStatusColor(label.toLowerCase())}>
                              {label || 'Active'}
                            </Badge>
                          );
                        })()}
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
                            <DropdownMenuItem onClick={() => handleViewProfile(student.id)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateApplication(student.id)}>
                              Create Application
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {!isLoading && pagination.total > pageSize && (
              <div className="mt-4 pt-4 border-t">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                />
              </div>
            )}

          </CardContent>
        </Card>

      </div>

      <StudentProfileModal
        open={isProfileModalOpen}
        startInEdit={Boolean(matchEdit)}
        onOpenChange={(open) => {
          setIsProfileModalOpen(open);
          if (!open) {
            // if current URL already contains a students deep-link (e.g. /students/:id/application or /students/:id/edit), preserve it
            if (location && location.startsWith('/students/') && location !== '/students') {
              // keep existing location
            } else if (matchEdit && editParams?.id) setLocation(`/students/${editParams.id}`);
            else setLocation('/students');
          }
        }}
        studentId={selectedStudentId}
        onOpenApplication={(app) => { setSelectedApplicationForDetails(app); try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAppDetailsOpen(true)); } catch { setIsAppDetailsOpen(true); } }}
        onOpenAddApplication={(sid) => { setSelectedStudentId(sid || selectedStudentId); try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAddApplicationModalOpen(true)); } catch { setIsAddApplicationModalOpen(true); } }}
      />

      <ApplicationDetailsModal
        open={isAppDetailsOpen}
        onOpenChange={(open) => { setIsAppDetailsOpen(open); if (!open) setSelectedApplicationForDetails(null); }}
        application={selectedApplicationForDetails}
        onOpenStudentProfile={(sid) => {
          setSelectedStudentId(sid);
          setLocation(`/students/${sid}`);
        }}
      />

      <AddApplicationModal
        open={isAddApplicationModalOpen}
        onOpenChange={(open) => {
          setIsAddApplicationModalOpen(open);
          if (!open) {
            // if we arrived via deep link, return to student profile route
            if (matchCreateApp && createAppParams?.id) {
              setLocation(`/students/${createAppParams.id}`);
            } else if (matchStudent && studentParams?.id) {
              setLocation(`/students/${studentParams.id}`);
            } else if (!isProfileModalOpen) {
              setSelectedStudentId(null);
              setLocation('/students');
            }
            if (!isProfileModalOpen) setSelectedStudentId(null);
          }
        }}
        studentId={selectedStudentId || undefined}
      />
    </Layout>
  );
}
