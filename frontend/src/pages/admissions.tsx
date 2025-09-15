import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/help-tooltip';

import { Admission, Student } from '@/lib/types';
import { Plus, MoreHorizontal, Trophy, Calendar, DollarSign, School, AlertCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdmissionDetailsModal } from '@/components/admission-details-modal-new';
import { useLocation, useRoute } from 'wouter';
import * as DropdownsService from '@/services/dropdowns';
import * as AdmissionsService from '@/services/admissions';
import { useMemo } from 'react';

export default function Admissions() {
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [, setLocation] = useLocation();
  const [matchAd, adParams] = useRoute('/admissions/:id');
  const [matchEdit, editParams] = useRoute('/admissions/:id/edit');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);

  const { data: admissions, isLoading: admissionsLoading } = useQuery<Admission[]>({
    queryKey: ['/api/admissions'],
  });

  const { data: admissionsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Admissions'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Admissions')
  });

  const decisionOptions = useMemo(() => {
    const dd: any = admissionsDropdowns as any;
    let list: any[] = dd?.Decision || dd?.decision || dd?.Decisions || dd?.decisionStatus || [];
    if (!Array.isArray(list)) list = [];
    list = [...list].sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0)));
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value }));
  }, [admissionsDropdowns]);

  // Open details modal when route matches and ensure selected admission is set
  useEffect(() => {
    const id = (matchEdit ? editParams?.id : adParams?.id) || null;
    if (matchAd || matchEdit) {
      if (id) {
        const found = (admissions || []).find(a => a.id === id) as Admission | undefined;
        if (found) setSelectedAdmission(found);
        else {
          AdmissionsService.getAdmission(id).then((a) => setSelectedAdmission(a as any)).catch(() => {});
        }
      }
      setIsDetailsOpen(true);
    }
  }, [matchAd, matchEdit, adParams?.id, editParams?.id, admissions]);

  const visaStatusOptions = useMemo(() => {
    const dd: any = admissionsDropdowns as any;
    let list: any[] = dd?.['Visa Status'] || dd?.visaStatus || dd?.VisaStatus || dd?.visa_status || [];
    if (!Array.isArray(list)) list = [];
    return list;
  }, [admissionsDropdowns]);

  const getVisaStatusLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of visaStatusOptions) {
      const key = (o?.id ?? o?.key ?? o?.value);
      if (key != null) {
        const k = String(key);
        map.set(k, String(o.value));
        map.set(k.toLowerCase(), String(o.value));
      }
    }
    return (val?: string | null) => {
      if (!val) return '';
      const v = String(val);
      return map.get(v) || map.get(v.toLowerCase()) || v.replace(/[_-]/g, ' ');
    };
  }, [visaStatusOptions]);

  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const filteredAdmissions = admissions?.filter(admission => {
    const decisionMatch = decisionFilter === 'all' || admission.decision === decisionFilter;
    const universityMatch = universityFilter === 'all' || admission.university === universityFilter;
    return decisionMatch && universityMatch;
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

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'waitlisted':
        return 'bg-yellow-100 text-yellow-800';
      case 'conditional':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisaStatusColor = (status: string) => {
    const s = (status || '').toLowerCase().replace(/_/g, '-');
    switch (s) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'not-applied':
      case 'on-hold':
      case 'interview-scheduled':
      case 'applied':
        return 'bg-gray-100 text-gray-800';
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
                <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Filter by decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Decisions</SelectItem>
                    {decisionOptions.map((opt) => (
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

                {(decisionFilter !== 'all' || universityFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setDecisionFilter('all');
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
                description={decisionFilter === 'all' ? 'Admission records will appear here when universities make decisions.' : `No admissions with decision "${decisionFilter}".`}
              />
            ) : (
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 text-[11px]">Student</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">University</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Program</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Admission ID</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Decision</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Scholarship</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Visa Status</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Decision Date</TableHead>
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
                        <div className="text-[11px] font-mono text-gray-700 truncate max-w-[12rem]">{(admission as any).admissionId || admission.id}</div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <Badge className={getDecisionColor(admission.decision)}>
                          {admission.decision}
                        </Badge>
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
                      <TableCell className="p-2 text-xs">
                        <Badge className={getVisaStatusColor((admission.visaStatus || 'pending') as string)}>
                          {getVisaStatusLabel(admission.visaStatus || 'pending')}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(admission.decisionDate)}
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
            if (matchEdit && editParams?.id) setLocation(`/admissions/${editParams.id}`);
            else setLocation('/admissions');
            setSelectedAdmission(null);
          }
        }}
        admission={selectedAdmission}
      />
    </Layout>
  );
}
