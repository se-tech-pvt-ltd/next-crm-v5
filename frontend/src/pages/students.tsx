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
import { http } from '@/services/http';
import * as StudentsService from '@/services/students';
import { STATUS_OPTIONS, labelFrom } from '@/constants/students-dropdowns';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, GraduationCap, Phone, Mail, Globe, Users, UserCheck, Target, TrendingUp, Filter, BookOpen, Plus, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { useLocation, useRoute } from 'wouter';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { CreateStudentModal } from '@/components/create-student-modal';
import * as ApplicationsService from '@/services/applications';
import * as AdmissionsService from '@/services/admissions';

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

  // Helper to update URL with student filters
  const updateUrlWithFilters = (filters: { status?: string; country?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.country && filters.country !== 'all') params.set('country', filters.country);
    if (filters.page && filters.page > 1) params.set('page', String(filters.page));

    const queryString = params.toString();
    try {
      setLocation(queryString ? `/students?${queryString}` : '/students');
    } catch (e) {
      // fallback
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', queryString ? `/students?${queryString}` : '/students');
      }
    }
  };

  // Sync filters from URL when location changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlStatus = params.get('status');
    const urlCountry = params.get('country');
    const urlPage = parseInt(params.get('page') || '1');

    setStatusFilter(urlStatus || 'all');
    setCountryFilter(urlCountry || 'all');
    setCurrentPage(urlPage > 0 ? urlPage : 1);
  }, [location]);
  const [matchStudent, studentParams] = useRoute('/students/:id');
  const [matchEdit, editParams] = useRoute('/students/:id/edit');
  const [matchCreateApp, createAppParams] = useRoute('/students/:id/application');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8); // 8 records per page
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { accessByRole, user } = useAuth() as any;
  const normalize = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const singularize = (s: string) => s.replace(/s$/i, '');
  const canCreateStudent = (() => {
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalize(a.moduleName ?? a.module_name)) === 'student');
    if (entries.length === 0) return true;
    return entries.some((e: any) => (e.canCreate ?? e.can_create) === true);
  })();

  const { data: studentsResponse, isLoading } = useQuery({
    queryKey: ['/api/students', { page: currentPage, limit: pageSize, statusFilter, countryFilter, searchQuery }],
    queryFn: async () => {
      // If no client-side filters/search applied, request server-paginated results for current page.
      const noFilters = (!searchQuery || String(searchQuery).trim() === '') && statusFilter === 'all' && countryFilter === 'all';
      if (noFilters) {
        return StudentsService.getStudents({ page: currentPage, limit: pageSize });
      }
      // When filters/search active, fetch all students (no pagination) and apply filters client-side so counts and matches are accurate.
      return StudentsService.getStudents();
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const studentsArrayAll: Student[] = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse?.data || []);
  const rawPagination = studentsResponse && !Array.isArray(studentsResponse) ? studentsResponse.pagination : undefined;

  // Restrict visible students for counsellors and admission officers to only records assigned to them
  const normalizeRole = (r: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');
  const roleNorm = normalizeRole((user as any)?.role || (user as any)?.role_name || (user as any)?.roleName || '');
  const isCounsellor = roleNorm === 'counselor' || roleNorm === 'counsellor';
  const isAdmissionOfficer = roleNorm === 'admission_officer' || roleNorm === 'admissionofficer' || roleNorm === 'admission officer' || roleNorm === 'admission';

  const studentsArray: Student[] = (Array.isArray(studentsArrayAll) ? studentsArrayAll.slice() : []).filter((s: any) => {
    if (!isCounsellor && !isAdmissionOfficer) return true;
    const sCoun = String((s.counsellorId ?? s.counselorId ?? s.counsellor ?? s.counselor) || '').trim();
    const sAdm = String((s.admissionOfficerId ?? s.admission_officer_id ?? s.admissionOfficer ?? s.admission_officer) || '').trim();
    const uid = String((user as any)?.id || (user as any)?.userId || (user as any)?.sub || '').trim();
    return (sCoun && sCoun === uid) || (sAdm && sAdm === uid);
  });


  // Fallback to Leads module for fields that may live there (e.g., Program/Study Plan)
  const { data: leadsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => { return http.get<any>('/api/dropdowns/module/Leads'); },
  });
  // Global fallback: pull all dropdowns to handle mismatched field names
  const { data: allDropdowns } = useQuery({
    queryKey: ['/api/dropdowns'],
    queryFn: async () => http.get<any[]>('/api/dropdowns'),
  });

  function getStatusLabel(raw?: string) {
    return labelFrom('status', raw || '') || (raw || '');
  }

  // Applications and Admissions for derived counts (moved after dropdowns to avoid TDZ)
  const { data: applicationsResponse } = useQuery({
    queryKey: ['/api/applications'],
    queryFn: async () => ApplicationsService.getApplications(),
    staleTime: 60000,
  });
  const { data: admissionsResponse } = useQuery({
    queryKey: ['/api/admissions'],
    queryFn: async () => AdmissionsService.getAdmissions(),
    staleTime: 60000,
  });

  const applicationsArray: any[] = Array.isArray(applicationsResponse) ? applicationsResponse : (applicationsResponse as any)?.data || [];
  const admissionsArray: any[] = Array.isArray(admissionsResponse) ? admissionsResponse : (admissionsResponse as any)?.data || [];

  // Non-enrolled students are considered Active in this context
  const nonEnrolledStudents: Student[] = (studentsArray || []).filter((s) => getStatusLabel(s.status).toLowerCase() !== 'enrolled');
  const nonEnrolledIds = new Set(nonEnrolledStudents.map((s) => s.id));

  const activeCount = nonEnrolledStudents.length;
  // Applied and Admitted should be global totals (not limited to non-enrolled students)
  const appliedCount = applicationsArray ? applicationsArray.length : 0;
  const admittedCount = admissionsArray ? admissionsArray.length : 0;

  // Utility to parse targetCountry value into array of ids or names
  const parseTargetCountries = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const s = value.trim();
      if (s.startsWith('[')) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      if (s.includes(',')) return s.split(',').map(p => p.trim()).filter(Boolean);
      return [s];
    }
    return [String(value)];
  };

  // Map target country ids to display names using dropdowns (robust to ids/keys/values and multiple values)
  const getTargetCountryDisplay = (student: Student) => {
    const raw = (student as any).targetCountry ?? (student as any).country ?? null;
    const values = parseTargetCountries(raw);
    if (!values.length) return '-';

    const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const dd: any = (studentDropdowns as any) || {};

    // Build a normalized map of fieldName -> options[]
    const ddMap: Record<string, any[]> = Object.keys(dd).reduce((acc: Record<string, any[]>, k) => {
      acc[normalize(k)] = dd[k];
      return acc;
    }, {});

    const candidatesNorm = ['target_country','targetcountry','target country','interested country','country'].map(normalize);
    let options: any[] = [];
    for (const c of candidatesNorm) {
      if (Array.isArray(ddMap[c]) && ddMap[c].length > 0) { options = ddMap[c]; break; }
    }

    // Fallback: search all dropdowns for country-like fields
    if (options.length === 0 && Array.isArray(allDropdowns)) {
      const terms = ['targetcountry','country','interestedcountry'];
      const pool = (allDropdowns as any[]).filter((d: any) => terms.some(t => normalize(d.fieldName).includes(t)));
      options = pool;
    }

    if (options.length === 0) return values.join(', ');

    const mapped = values.map((item) => {
      const str = String(item);
      const found = options.find((o: any) => (
        String(o.id) === str || String(o.key) === str || String(o.value) === str
      ));
      return found ? found.value : item;
    }).filter(Boolean);

    return mapped.length > 0 ? mapped.join(', ') : values.join(', ');
  };

  // Apply filters across the full students array
  const filteredAll = studentsArray?.filter(student => {
    const label = getStatusLabel(student.status).toLowerCase();
    const statusMatch = statusFilter === 'all' || label === statusFilter;
    const countryDisplay = getTargetCountryDisplay(student);
    const countryMatch = countryFilter === 'all' || countryDisplay === countryFilter;

    const q = (searchQuery || '').toString().trim().toLowerCase();
    let searchMatch = true;
    if (q) {
      const idVal = String(student.student_id || student.id || '').toLowerCase();
      const nameVal = String(student.name || '').toLowerCase();
      searchMatch = idVal.includes(q) || nameVal.includes(q);
    }

    return statusMatch && countryMatch && searchMatch;
  }) || [];

  // Detect if server returned pagination metadata
  const serverPaginatedRaw = Boolean(studentsResponse && !Array.isArray(studentsResponse) && studentsResponse.pagination);
  // If current user is a counsellor or admission officer, server-side pagination may include other users' records.
  // Force client-side pagination in that case to correctly restrict visible records.
  const serverPaginated = serverPaginatedRaw && !(isCounsellor || isAdmissionOfficer);

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




  // Map target program ids to display names using dropdowns (robust mapping; supports multiple values)
  const getTargetProgramDisplay = (student: Student) => {
    const raw = (student as any).targetProgram ?? (student as any).program ?? null;
    const values = parseTargetCountries(raw);
    if (!values.length) return '-';

    const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const dd: any = (studentDropdowns as any) || {};
    const ld: any = (leadsDropdowns as any) || {};

    // Build normalized maps for field lookup from both Students and Leads modules
    const buildMap = (src: any) => Object.keys(src || {}).reduce((acc: Record<string, any[]>, k) => { acc[normalize(k)] = src[k]; return acc; }, {} as Record<string, any[]>);
    const ddMap = buildMap(dd);
    const ldMap = buildMap(ld);

    const candidates = ['target_program','target program','targetprogram','program','study plan','studyplan','course','program name'];
    let options: any[] = [];
    for (const c of candidates.map(normalize)) {
      const list = ddMap[c] || ldMap[c];
      if (Array.isArray(list) && list.length > 0) { options = list; break; }
    }

    // Global fallback: search all dropdowns by fieldName containing program terms
    if (options.length === 0 && Array.isArray(allDropdowns)) {
      const terms = ['targetprogram','program','studyplan','course'];
      const pool = (allDropdowns as any[]).filter((d: any) => terms.some(t => normalize(d.fieldName).includes(t)));
      options = pool;
    }

    if (options.length === 0) return values.join(', ');

    const mapped = values.map((item) => {
      const str = String(item);
      const found = options.find((o: any) => (
        String(o.id) === str || String(o.key) === str || String(o.value) === str
      ));
      return found ? found.value : item;
    }).filter(Boolean);

    return mapped.length > 0 ? mapped.join(', ') : values.join(', ');
  };

  // Get unique countries for filter dropdown
  const uniqueCountries = studentsArray ?
    studentsArray.reduce((countries: string[], student) => {
      const display = getTargetCountryDisplay(student);
      if (display && !countries.includes(display)) {
        countries.push(display);
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
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => { setStatusFilter('all'); setCountryFilter('all'); setCurrentPage(1); updateUrlWithFilters({ status: 'all', country: 'all', page: 1 }); }}>
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

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => { setStatusFilter('active'); setCountryFilter('all'); setCurrentPage(1); updateUrlWithFilters({ status: 'active', country: 'all', page: 1 }); }}>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <UserCheck className="w-3 h-3 text-green-500" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-green-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : activeCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => { setStatusFilter('applied'); setCountryFilter('all'); setCurrentPage(1); updateUrlWithFilters({ status: 'applied', country: 'all', page: 1 }); }}>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Target className="w-3 h-3 text-primary" />
                Applied
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-blue-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : appliedCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => { setStatusFilter('admitted'); setCountryFilter('all'); setCurrentPage(1); updateUrlWithFilters({ status: 'admitted', country: 'all', page: 1 }); }}>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                Admitted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-purple-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : admittedCount || 0}
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
                <div className="w-48">
                  <InputWithIcon
                    placeholder="Search by ID or name"
                    leftIcon={<Search className="w-3 h-3 text-gray-400" />}
                    value={searchQuery}
                    onChange={(e: any) => setSearchQuery(e.target.value)}
                    className="h-7 text-xs"
                  />
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
                              {getTargetCountryDisplay(student)}
                            </div>
                          )}
                          {student.targetProgram && (
                            <div className="flex items-center text-xs text-gray-500">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {getTargetProgramDisplay(student)}
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
