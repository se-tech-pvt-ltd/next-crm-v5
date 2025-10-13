import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/help-tooltip';
import { useLocation, useRoute } from 'wouter';
import { Application, Student } from '@/lib/types';
import * as ApplicationsService from '@/services/applications';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreHorizontal, Calendar, DollarSign, School, FileText, Clock, CheckCircle, AlertCircle, Filter, GraduationCap, Search } from 'lucide-react';
import { ApplicationDetailsModal } from '@/components/application-details-modal-new';
import { AddApplicationModal } from '@/components/add-application-modal';
import { StudentPickerDialog } from '@/components/student-picker-dialog';
import { AddAdmissionModal } from '@/components/add-admission-modal';
import { StudentProfileModal } from '@/components/student-profile-modal-new';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import * as DropdownsService from '@/services/dropdowns';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function Applications() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [location, setLocation] = useLocation();
  const [matchApp, appParams] = useRoute('/applications/:id');
  const [matchEdit, editParams] = useRoute('/applications/:id/edit');
  const [matchAddAdm, addAdmParams] = useRoute('/applications/:id/admission');
  const [matchNew] = useRoute('/applications/new');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isAddApplicationModalOpen, setIsAddApplicationModalOpen] = useState(false);
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [addApplicationStudentId, setAddApplicationStudentId] = useState<string | undefined>(undefined);
  const [isAddAdmissionModalOpen, setIsAddAdmissionModalOpen] = useState(false);
  const [addAdmissionAppId, setAddAdmissionAppId] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { accessByRole } = useAuth() as any;
  const normalize = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const singularize = (s: string) => s.replace(/s$/i, '');
  const canCreateApplication = (() => {
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalize(a.moduleName ?? a.module_name)) === 'application');
    if (entries.length === 0) return true;
    return entries.some((e: any) => (e.canCreate ?? e.can_create) === true);
  })();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleAddApplicationClick = () => {
    setIsNavigating(true);
    try { setLocation('/applications/new'); } finally { setTimeout(() => setIsNavigating(false), 600); }
  };

  const handleStudentPickerSelect = (studentId: string) => {
    if (!studentId) return;
    setAddApplicationStudentId(studentId);
    setIsStudentPickerOpen(false);
    setIsAddApplicationModalOpen(true);
    if (matchNew) {
      try {
        const params = new URLSearchParams();
        params.set('studentId', studentId);
        const target = `/applications/new?${params.toString()}`;
        if (location !== target) {
          setLocation(target);
        }
      } catch {}
    }
  };

  const { data: applicationsResponse, isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/applications', { page: currentPage, limit: pageSize, statusFilter, universityFilter }],
    queryFn: async () => ApplicationsService.getApplications({ page: currentPage, limit: pageSize }),
  });

  // Normalize response (support both array and server-paginated responses)
  const applicationsArray: Application[] = Array.isArray(applicationsResponse) ? (applicationsResponse as Application[]) : (applicationsResponse?.data || []);
  const rawPagination = applicationsResponse && !Array.isArray(applicationsResponse) ? (applicationsResponse as any).pagination : undefined;
  const serverPaginated = Boolean(rawPagination);

  const { data: applicationsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Applications'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Applications')
  });

  const statusOptions = useMemo(() => {
    const dd: any = applicationsDropdowns as any;
    if (!dd || typeof dd !== 'object') return [];
    const normalizeKey = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const keyMap: Record<string, string> = {};
    for (const k of Object.keys(dd || {})) keyMap[normalizeKey(k)] = k;
    const candidates = ['App Status','Application Status','Status','AppStatus','app status','App status'];
    let list: any[] = [];
    for (const raw of candidates) {
      const foundKey = keyMap[normalizeKey(raw)];
      if (foundKey && Array.isArray(dd[foundKey])) { list = dd[foundKey]; break; }
    }
    if (!Array.isArray(list)) list = [];
    list = [...list].sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0)));
    // Use the human label as the filter value to match enriched appStatus values
    return list.map((o: any) => ({ label: o.value, value: o.value }));
  }, [applicationsDropdowns]);

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

  const cleanLabel = (val?: string | null) => {
    if (!val) return '';
    const uuidRe = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
    // take first non-empty line if multiple
    const parts = val.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      const nonUuid = parts.find(s => !uuidRe.test(s));
      if (nonUuid) return nonUuid;
    }
    let s = (parts[0] || val).replace(/\(([0-9a-fA-F-]{36})\)/g, '').trim();
    s = s.replace(uuidRe, '').replace(/\s{2,}/g, ' ').trim();
    return s || (val || '').trim();
  };

  // Apply client-side filters to the full applications array
  const filteredAll = (applicationsArray || []).filter(app => {
    const appStatusValue = cleanLabel(app.appStatus || '');
    const statusMatch = statusFilter === 'all' || appStatusValue === statusFilter;
    const universityMatch = universityFilter === 'all' || (cleanLabel(app.university || '') === universityFilter);
    return statusMatch && universityMatch;
  }) || [];

  // If backend provides pagination, assume applicationsArray is already the page to display.
  // Otherwise, compute pagination on the client and slice the filtered results for display.
  const effectivePagination = serverPaginated ? rawPagination : {
    page: currentPage,
    limit: pageSize,
    total: filteredAll.length,
    totalPages: Math.max(1, Math.ceil(filteredAll.length / pageSize)),
    hasNextPage: currentPage * pageSize < filteredAll.length,
    hasPrevPage: currentPage > 1
  };

  const displayApplications = serverPaginated ? applicationsArray : filteredAll.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Get unique universities for filter dropdown
  const uniqueUniversities = applicationsArray ?
    applicationsArray.reduce((universities: string[], app) => {
      const uni = cleanLabel(app.university || '');
      if (uni && !universities.includes(uni)) {
        universities.push(uni);
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

  // Open details modal when route matches and ensure selected application is set
  useEffect(() => {
    const id = (matchEdit ? editParams?.id : appParams?.id) || null;
    if (matchApp || matchEdit) {
      if (id) {
        const found = (applicationsArray || []).find(a => a.id === id) as Application | undefined;
        if (found) setSelectedApplication(found);
        else {
          ApplicationsService.getApplication(id).then((app) => setSelectedApplication(app as any)).catch(() => {});
        }
      }
      setIsDetailsOpen(true);
    }
  }, [matchApp, matchEdit, appParams?.id, editParams?.id, applicationsArray]);

  // Open Add Admission modal when route matches /applications/:id/admission
  useEffect(() => {
    const aid = addAdmParams?.id;
    if (matchAddAdm && aid) {
      setAddAdmissionAppId(aid);
      setIsAddAdmissionModalOpen(true);
    } else if (!matchAddAdm) {
      setIsAddAdmissionModalOpen(false);
      setAddAdmissionAppId(undefined);
    }
  }, [matchAddAdm, addAdmParams?.id]);

  // Handle /applications/new route to show student picker first
  useEffect(() => {
    if (!matchNew) {
      setIsStudentPickerOpen(false);
      return;
    }

    const queryString = (() => {
      try {
        const index = location.indexOf('?');
        return index >= 0 ? location.slice(index + 1) : '';
      } catch {
        return '';
      }
    })();

    const params = new URLSearchParams(queryString);
    const queryStudentId = params.get('studentId');

    if (queryStudentId && addApplicationStudentId !== queryStudentId) {
      setAddApplicationStudentId(queryStudentId);
      return;
    }

    if (queryStudentId || addApplicationStudentId) {
      if (!isAddApplicationModalOpen) {
        setIsAddApplicationModalOpen(true);
      }
      setIsStudentPickerOpen(false);
      return;
    }

    setIsStudentPickerOpen(true);
  }, [matchNew, location, addApplicationStudentId, isAddApplicationModalOpen]);

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
                {applicationsLoading ? <Skeleton className="h-6 w-12" /> : applicationsArray?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-primary" />
                Open
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-blue-600">
                {applicationsLoading ? <Skeleton className="h-6 w-12" /> : (applicationsArray || []).filter(a => cleanLabel(a.appStatus || '') === 'Open').length || 0}
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
                {applicationsLoading ? <Skeleton className="h-6 w-12" /> : (applicationsArray || []).filter(a => cleanLabel(a.appStatus || '') === 'Needs Attention').length || 0}
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
                {applicationsLoading ? <Skeleton className="h-6 w-12" /> : (applicationsArray || []).filter(a => cleanLabel(a.appStatus || '') === 'Closed').length || 0}
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
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
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

              <div className="flex items-center gap-2">
                {canCreateApplication && (
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
                      onClick={handleAddApplicationClick}
                      disabled={isNavigating}
                      title="Add New Application"
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
            ) : filteredAll.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="h-12 w-12" />}
                title="No applications found"
                description={statusFilter === 'all' ? 'Applications will appear here when students apply to universities.' : `No applications with status "${statusFilter}".`}
                action={canCreateApplication ? (
                  <Button onClick={handleAddApplicationClick}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Application
                  </Button>
                ) : undefined}
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
                  {displayApplications.map((application) => (
                    <TableRow
                      key={application.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => { setLocation(`/applications/${application.id}`); }}
                    >
                      <TableCell className="font-medium p-2 text-xs">
                        {getStudentName(application.studentId)}
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="flex items-center text-xs">
                          <School className="w-3 h-3 mr-1" />
                          <span>{cleanLabel(application.university)}</span>
                          {application.applicationCode && (
                            <span className="ml-2 text-[11px] text-gray-500">({application.applicationCode})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="text-xs">
                          {cleanLabel(application.program)}
                          {application.courseType && (
                            <div className="text-[11px] text-gray-500">{cleanLabel(application.courseType)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <Badge className={getStatusColor(cleanLabel(application.appStatus || 'Open') || 'Open')}>
                          {cleanLabel(application.appStatus || 'Open') || 'Open'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="text-xs">
                          {cleanLabel(application.intake) || '—'}
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
                              onClick={() => { setLocation(`/applications/${application.id}`); }}
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

        {/* Pagination */}
        {!applicationsLoading && (effectivePagination?.total ?? 0) > pageSize && (
          <div className="mt-4 pt-4 border-t">
            <Pagination
              currentPage={effectivePagination.page}
              totalPages={effectivePagination.totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              hasNextPage={Boolean(effectivePagination.hasNextPage)}
              hasPrevPage={Boolean(effectivePagination.hasPrevPage)}
            />
          </div>
        )}
      </div>

      <ApplicationDetailsModal
        open={isDetailsOpen}
        startInEdit={Boolean(matchEdit)}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            try { setLocation('/applications'); } catch {}
            setSelectedApplication(null);
          }
        }}
        application={selectedApplication}
        onOpenStudentProfile={(sid) => {
          try { setLocation(`/students/${sid}`); } catch {}
          setSelectedStudentId(sid);
          try {
            const { useModalManager } = require('@/contexts/ModalManagerContext');
            const { openModal } = useModalManager();
            openModal(() => setIsProfileModalOpen(true));
          } catch {
            setIsProfileModalOpen(true);
          }
        }}
      />

      <StudentProfileModal
    open={isProfileModalOpen}
    onOpenChange={(open) => { setIsProfileModalOpen(open); if (!open) setSelectedStudentId(null); }}
    studentId={selectedStudentId}
    onOpenAddApplication={(sid) => {
      setAddApplicationStudentId(sid || undefined);
      try {
        const { useModalManager } = require('@/contexts/ModalManagerContext');
        const { openModal } = useModalManager();
        openModal(() => setIsAddApplicationModalOpen(true));
      } catch {
        setIsAddApplicationModalOpen(true);
      }
    }}
    onOpenApplication={(app) => {
      setSelectedApplication(app);
      try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsDetailsOpen(true)); } catch { setIsDetailsOpen(true); }
    }}
  />

  <StudentPickerDialog
    open={isStudentPickerOpen}
    onOpenChange={(open) => {
      setIsStudentPickerOpen(open);
      if (!open && matchNew && !addApplicationStudentId) {
        try { setLocation('/applications'); } catch {}
      }
    }}
    onSelect={handleStudentPickerSelect}
    title="Select a student to create application"
    pageSize={4}
  />

  <AddApplicationModal
    open={isAddApplicationModalOpen}
    onOpenChange={(open) => {
      setIsAddApplicationModalOpen(open);
      if (!open) {
        setAddApplicationStudentId(undefined);
        setIsStudentPickerOpen(false);
        if (matchNew) {
          try { setLocation('/applications'); } catch {}
        }
      }
    }}
    studentId={addApplicationStudentId}
  />

  <AddAdmissionModal
    open={isAddAdmissionModalOpen}
    onOpenChange={(o) => {
      setIsAddAdmissionModalOpen(o);
      if (!o) {
        try {
          if (addAdmissionAppId) setLocation(`/applications/${addAdmissionAppId}`);
          else setLocation('/applications');
        } catch {}
        setAddAdmissionAppId(undefined);
      }
    }}
    applicationId={addAdmissionAppId}
    studentId={undefined}
  />
</Layout>
  );
}
