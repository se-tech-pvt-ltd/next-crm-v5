import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpTooltip } from '@/components/help-tooltip';
import { AdmissionDetailsModal } from '@/components/admission-details-modal';
import { Admission, Student } from '@shared/schema';
import { Plus, MoreHorizontal, Trophy, Calendar, DollarSign, School, AlertCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Admissions() {
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: admissions, isLoading: admissionsLoading } = useQuery<Admission[]>({
    queryKey: ['/api/admissions'],
  });

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

  const getStudentName = (studentId: number) => {
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
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'not-applied':
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
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <Select value={decisionFilter} onValueChange={setDecisionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Decisions</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="conditional">Conditional</SelectItem>
              </SelectContent>
            </Select>
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {uniqueUniversities.map((university) => (
                  <SelectItem key={university} value={university}>{university}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Admission Record
          </Button>
        </div>

        {/* Admissions Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <School className="w-4 h-4 mr-2 text-gray-500" />
                Total Admissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {admissionsLoading ? <Skeleton className="h-8 w-16" /> : admissions?.length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Accepted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {admissionsLoading ? <Skeleton className="h-8 w-16" /> : admissions?.filter(a => a.decision === 'accepted').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                Waitlisted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {admissionsLoading ? <Skeleton className="h-8 w-16" /> : admissions?.filter(a => a.decision === 'waitlisted').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-purple-500" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {admissionsLoading ? <Skeleton className="h-8 w-16" /> : (
                  admissions?.length 
                    ? Math.round((admissions.filter(a => a.decision === 'accepted').length / admissions.length) * 100)
                    : 0
                )}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Admissions List</CardTitle>
          </CardHeader>
          <CardContent>
            {admissionsLoading ? (
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
            ) : filteredAdmissions.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No admissions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {decisionFilter === 'all' 
                    ? "Admission records will appear here when universities make decisions."
                    : `No admissions with decision "${decisionFilter}".`
                  }
                </p>
                <div className="mt-6">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Admission Record
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
                    <TableHead>Decision</TableHead>
                    <TableHead>Scholarship</TableHead>
                    <TableHead>Visa Status</TableHead>
                    <TableHead>Decision Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmissions.map((admission) => (
                    <TableRow 
                      key={admission.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedAdmission(admission);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        {getStudentName(admission.studentId)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <School className="w-3 h-3 mr-1" />
                          {admission.university}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {admission.program}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDecisionColor(admission.decision)}>
                          {admission.decision}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admission.scholarshipAmount ? (
                          <div className="flex items-center text-sm text-green-600">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {admission.scholarshipAmount}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getVisaStatusColor(admission.visaStatus || 'pending')}>
                          {admission.visaStatus || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(admission.decisionDate)}
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
                                setSelectedAdmission(admission);
                                setIsDetailsModalOpen(true);
                              }}
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
      
      <AdmissionDetailsModal 
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        admission={selectedAdmission}
      />
    </Layout>
  );
}
