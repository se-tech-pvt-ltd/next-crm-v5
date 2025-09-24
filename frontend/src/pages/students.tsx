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
import { MoreHorizontal, GraduationCap, Phone, Mail, Globe, Users, UserCheck, Target, TrendingUp, Filter, BookOpen, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLocation, useRoute } from 'wouter';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { CreateStudentModal } from '@/components/create-student-modal';

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
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { accessByRole } = useAuth() as any;
  const normalize = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const singularize = (s: string) => s.replace(/s$/i, '');
  const canCreateStudent = (() => {
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalize(a.moduleName ?? a.module_name)) === 'student');
    if (entries.length === 0) return true;
    return entries.some((e: any) => (e.canCreate ?? e.can_create) === true);
  })();

  const { data: studentsResponse, isLoading } = useQuery({
    queryKey: ['/api/students', { page: currentPage, limit: pageSize }],
    queryFn: async () => StudentsService.getStudents({ page: currentPage, limit: pageSize }),
    staleTime: 0,
    refetchOnMount: true,
  });

  const studentsArray: Student[] = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse?.data || []);
  const rawPagination = studentsResponse && !Array.isArray(studentsResponse) ? studentsResponse.pagination : undefined;

  // Fetch dropdowns for Students module (for status labels)
  const { data: studentDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/students'],
    queryFn: async () => DropdownsService.getModuleDropdowns('students'),
  });

  function getStatusLabel(raw?: string) {
    const list: any[] = (studentDropdowns as any)?.Status || [];
    const s = raw || '';
    const match = list.find((o: any) => o.id === s || o.key === s || (o.value && String(o.value).toLowerCase() === String(s).toLowerCase()));
    return (match?.value || s || '').toString();
  }

  // Apply filters across the full students array
  const filteredAll = studentsArray?.filter(student => {
    const label = getStatusLabel(student.status).toLowerCase();
    const statusMatch = statusFilter === 'all' || label === statusFilter;
    const countryMatch = countryFilter === 'all' || student.targetCountry === countryFilter;
    return statusMatch && countryMatch;
  }) || [];

  // Detect if server returned pagination metadata
  const serverPaginated = Boolean(studentsResponse && !Array.isArray(studentsResponse) && studentsResponse.pagination);

  // Effective pagination: if server provides it, use that; otherwise compute based on filteredAll
  const effectivePagination = serverPaginated ? rawPagination : { page: currentPage, limit: pageSize, total: filteredAll.length, totalPages: Math.max(1, Math.ceil(filteredAll.length / pageSize)), hasNextPage: currentPage * pageSize < (filteredAll.length || 0), hasPrevPage: currentPage > 1 };

  // If server paginated, studentsArray already contains only current page items; otherwise perform client-side slicing
  const pagedStudents = serverPaginated ? filteredAll : (filteredAll || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // For rendering and counts use pagedStudents
  const filteredStudents = pagedStudents;

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

  // Open create student modal when navigating to /students/new
  useEffect(() => {
    if (location === '/students/new') setAddStudentOpen(true);
  }, [location]);

  const handleAddStudentClick = () => {
    setLocation('/students/new');
    setIsNavigating(true);
    setTimeout(() => {
      try {
        const { useModalManager } = require('@/contexts/ModalManagerContext');
        const { openModal } = useModalManager();
        openModal(() => setAddStudentOpen(true));
      } catch {
        setAddStudentOpen(true);
      }
      setIsNavigating(false);
    }, 200);
  };

  // Open profile when route matches (ignore /students/new)
  useEffect(() => {
    const isNew = studentParams?.id === 'new';
    if ((matchStudent && !isNew) || matchEdit) {
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
                {isLoading ? <Skeleton className="h-6 w-12" /> : (effectivePagination?.total || studentsArray.length) || 0}
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
                <Target className="w-3 h-3 text-primary" />
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

              <div className="flex items-center gap-2">
                {canCreateStudent && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                    className="ml-2"
                  >
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 w-7 p-0 bg-primary text-white shadow ring-2 ring-primary/40 hover:ring-primary"
                      onClick={handleAddStudentClick}
                      disabled={isNavigating}
                      title="Add New Student"
                    >
                      {isNavigating ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full" />
                        </motion.div>
                      ) : (
                        <motion.div initial={{ rotate: 0 }} whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                          <Plus className="w-4 h-4" />
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>
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
                action={canCreateStudent ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="h-8" onClick={handleAddStudentClick} disabled={isNavigating}>
                        {isNavigating ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 mr-1">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                          </motion.div>
                        ) : (
                          <motion.div initial={{ rotate: 0 }} animate={{ rotate: 0 }} whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                            <Plus className="w-3 h-3 mr-1" />
                          </motion.div>
                        )}
                        <span className="text-sm">{isNavigating ? 'Opening...' : 'Add Student'}</span>
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : undefined}
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
            {!isLoading && effectivePagination.total > pageSize && (
              <div className="mt-4 pt-4 border-t">
                <Pagination
                  currentPage={effectivePagination.page}
                  totalPages={effectivePagination.totalPages}
                  onPageChange={setCurrentPage}
                  hasNextPage={effectivePagination.hasNextPage}
                  hasPrevPage={effectivePagination.hasPrevPage}
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
            setSelectedStudentId(null);
            try {
              const path = typeof window !== 'undefined' ? window.location.pathname : location;
              // Only navigate back to /students when we're not deep-linking into admission/application
              if (path && path.startsWith('/students/') && !path.includes('/admission') && !path.includes('/application')) {
                setLocation('/students');
              }
            } catch (e) {
              // fallback to previous behavior
              if (location && location.startsWith('/students/')) setLocation('/students');
            }
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

      <CreateStudentModal
        open={addStudentOpen}
        onOpenChange={(open) => {
          setAddStudentOpen(open);
          if (!open && location === '/students/new') setLocation('/students');
          if (open && location !== '/students/new') setLocation('/students/new');
        }}
      />
    </Layout>
  );
}
