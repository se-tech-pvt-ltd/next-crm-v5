import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { Admission, Student } from '@/lib/types';
import { MoreHorizontal, Trophy, DollarSign, School, CheckCircle, Clock, Filter, Plus, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { AdmissionDetailsModal } from '@/components/admission-details-modal-new';
import { AddAdmissionModal } from '@/components/add-admission-modal';
import { ApplicationPickerDialog } from '@/components/application-picker-dialog';
import { useLocation, useRoute } from 'wouter';
import * as AdmissionsService from '@/services/admissions';

export default function Admissions() {
  const [universityFilter, setUniversityFilter] = useState('all');
  const [, setLocation] = useLocation();
  const [matchAd, adParams] = useRoute('/admissions/:id');
  const [matchEdit, editParams] = useRoute('/admissions/:id/edit');
  const [matchNew] = useRoute('/admissions/new');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);

  const [isAddAdmissionModalOpen, setIsAddAdmissionModalOpen] = useState(false);
  const [addAdmissionAppId, setAddAdmissionAppId] = useState<string | undefined>(undefined);

  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [addAdmissionStudentId, setAddAdmissionStudentId] = useState<string | undefined>(undefined);

  // Application picker state
  const [isApplicationPickerOpen, setIsApplicationPickerOpen] = useState(false);
  const [addAdmissionAppIdState, setAddAdmissionAppIdState] = useState<string | undefined>(undefined);

  const { data: admissions, isLoading: admissionsLoading } = useQuery<Admission[]>({
    queryKey: ['/api/admissions'],
  });

  const queryClient = useQueryClient();

  // Open details modal when route matches and ensure selected admission is set
  useEffect(() => {
    const id = (matchEdit ? editParams?.id : adParams?.id) || null;
    if (matchAd || matchEdit) {
      if (id) {
        const found = (admissions || []).find(a => a.id === id) as Admission | undefined;
        if (found) {
          setSelectedAdmission(found);
        } else {
          try {
            const cached = queryClient.getQueryData([`/api/admissions/${id}`]) as any;
            if (cached) {
              setSelectedAdmission(cached as Admission);
            } else {
              AdmissionsService.getAdmission(id).then((a) => setSelectedAdmission(a as any)).catch(() => {});
            }
          } catch {
            AdmissionsService.getAdmission(id).then((a) => setSelectedAdmission(a as any)).catch(() => {});
          }
        }
      }
      setIsDetailsOpen(true);
    }
  }, [matchAd, matchEdit, adParams?.id, editParams?.id, admissions]);

  useEffect(() => {
    const id = (matchEdit ? editParams?.id : adParams?.id) || null;
    if (!id) return;
    try {
      const cached = queryClient.getQueryData([`/api/admissions/${id}`]) as any;
      if (cached) setSelectedAdmission(cached as Admission);
    } catch {}
  }, [queryClient, adParams?.id, editParams?.id, matchAd, matchEdit]);

  // Open Add Admission modal or student picker when route matches /admissions/new
  useEffect(() => {
    if (!matchNew) {
      setIsApplicationPickerOpen(false);
      setIsAddAdmissionModalOpen(false);
      setAddAdmissionAppIdState(undefined);
      return;
    }

    const queryString = (() => {
      try {
        const index = typeof window !== 'undefined' ? window.location.href.indexOf('?') : -1;
        return index >= 0 ? (typeof window !== 'undefined' ? window.location.href.slice(index + 1) : '') : '';
      } catch {
        return '';
      }
    })();

    const params = new URLSearchParams(queryString);
    const queryAppId = params.get('applicationId');

    if (queryAppId && addAdmissionAppIdState !== queryAppId) {
      setAddAdmissionAppIdState(queryAppId);
      return;
    }

    if (queryAppId || addAdmissionAppIdState) {
      if (!isAddAdmissionModalOpen) setIsAddAdmissionModalOpen(true);
      setIsApplicationPickerOpen(false);
      return;
    }

    setIsApplicationPickerOpen(true);
  }, [matchNew, addAdmissionAppIdState, isAddAdmissionModalOpen]);

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const filteredAdmissions = admissions?.filter(admission => {
    const universityMatch = universityFilter === 'all' || admission.university === universityFilter;
    return universityMatch;
  }) || [];

  // Get unique universities for filter dropdown
  const uniqueUniversities = admissions ? 
    admissions.reduce((universities: string[], admission) => {
      if (admission.university && !universities.includes(admission.university)) {
        universities.push(admission.university);
      }
      return universities;
    }, []) : [];

  const getStudentName = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  return (
    <Layout 
      title="Admissions" 
      subtitle="Track admission decisions and outcomes"
      helpText="Admissions track the final decisions from universities. Monitor acceptance rates, scholarships, and visa status."
    >
      <div className="space-y-3">
        {/* Admissions Overview Cards (match Students sizing) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <School className="w-3 h-3 text-gray-500" />
                Total Admissions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold">
                {admissionsLoading ? <Skeleton className="h-6 w-12" /> : admissions?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Accepted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-green-600">
                {admissionsLoading ? <Skeleton className="h-6 w-12" /> : admissions?.filter(a => a.decision === 'accepted').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Clock className="w-3 h-3 text-yellow-500" />
                Waitlisted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-yellow-600">
                {admissionsLoading ? <Skeleton className="h-6 w-12" /> : admissions?.filter(a => a.decision === 'waitlisted').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Trophy className="w-3 h-3 text-purple-500" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-purple-600">
                {admissionsLoading ? <Skeleton className="h-6 w-12" /> : (
                  admissions?.length
                    ? Math.round((admissions.filter(a => a.decision === 'accepted').length / admissions.length) * 100)
                    : 0
                )}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admissions Table with Filters (match Students) */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Filter className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Filters:</span>
                </div>
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

                {(universityFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setUniversityFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 w-7 p-0 bg-primary text-white shadow ring-2 ring-primary/40 hover:ring-primary"
                  onClick={() => {
                    try {
                      setLocation('/admissions/new');
                    } catch { }
                  }}
                  title="Add New Admission"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {admissionsLoading ? (
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
            ) : filteredAdmissions.length === 0 ? (
              <EmptyState
                icon={<Trophy className="h-10 w-10" />}
                title="No admissions found"
                description={'Admission records will appear here when universities make decisions.'}
              />
            ) : (
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 text-[11px]">Admission ID</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Student</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">University</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Program</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Scholarship</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmissions.map((admission) => (
                    <TableRow
                      key={admission.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => { setLocation(`/admissions/${admission.id}`); }}
                    >
                      <TableCell className="p-2 text-xs">
                        <div className="text-[11px] font-mono text-gray-700 truncate max-w-[12rem]">{(admission as any).admissionId || admission.id}</div>
                      </TableCell>
                      <TableCell className="font-medium p-2 text-xs">{getStudentName(admission.studentId)}</TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="flex items-center text-xs">
                          <School className="w-3 h-3 mr-1" />
                          {admission.university}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="text-xs">{admission.program}</div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        {admission.scholarshipAmount ? (
                          <div className="flex items-center text-xs text-green-600">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {admission.scholarshipAmount}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">None</span>
                        )}
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
                            <DropdownMenuItem onClick={() => { setLocation(`/admissions/${admission.id}`); }}>
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

      <AdmissionDetailsModal
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            try { setLocation('/admissions'); } catch {}
            setSelectedAdmission(null);
          }
        }}
        admission={selectedAdmission}
      />

      <ApplicationPickerDialog
        open={isApplicationPickerOpen}
        onOpenChange={(open) => {
          setIsApplicationPickerOpen(open);
          if (!open && matchNew && !addAdmissionAppIdState) {
            try { setLocation('/admissions'); } catch {}
          }
        }}
        onSelect={(applicationId: string, application?: any) => {
          if (!applicationId) return;
          setAddAdmissionAppIdState(applicationId);
          setIsApplicationPickerOpen(false);
          setIsAddAdmissionModalOpen(true);
          if (matchNew) {
            try {
              const params = new URLSearchParams();
              params.set('applicationId', applicationId);
              const target = `/admissions/new?${params.toString()}`;
              if (typeof window !== 'undefined' && window.location.href !== target) {
                window.history.replaceState({}, '', target);
              }
            } catch {}
          }
        }}
        title="Select an application to create admission"
        pageSize={6}
      />

      <AddAdmissionModal
        open={isAddAdmissionModalOpen}
        onOpenChange={(o) => {
          setIsAddAdmissionModalOpen(o);
          if (!o) {
            try {
              setLocation('/admissions');
            } catch {}
            setAddAdmissionAppId(undefined);
            setAddAdmissionStudentId(undefined);
            setAddAdmissionAppIdState(undefined);
          }
        }}
        applicationId={addAdmissionAppIdState}
        studentId={undefined}
      />
    </Layout>
  );
}
