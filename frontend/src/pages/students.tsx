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
import { AddStudentModal } from '@/components/add-student-modal';
import { AddApplicationModal } from '@/components/add-application-modal';
import { StudentProfileModal } from '@/components/student-profile-modal';
import { Student } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreHorizontal, GraduationCap, Phone, Mail, Globe, User, Users, UserCheck, Target, TrendingUp, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Students() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddApplicationModalOpen, setIsAddApplicationModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Student> }) => {
      const response = await apiRequest('PUT', `/api/students/${id}`, data);
      return response.json();
    },
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

  const filteredStudents = students?.filter(student => {
    const statusMatch = statusFilter === 'all' || student.status === statusFilter;
    const countryMatch = countryFilter === 'all' || student.targetCountry === countryFilter;
    return statusMatch && countryMatch;
  }) || [];

  // Get unique countries for filter dropdown
  const uniqueCountries = students ? 
    students.reduce((countries: string[], student) => {
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

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const handleViewProfile = (studentId: number) => {
    setSelectedStudentId(studentId);
    setIsProfileModalOpen(true);
  };

  const handleCreateApplication = (studentId: number) => {
    setSelectedStudentId(studentId);
    setIsAddApplicationModalOpen(true);
  };

  return (
    <Layout 
      title="Students" 
      subtitle="Manage your active students"
      helpText="Students are converted leads who are actively pursuing study abroad programs. Track their applications and admissions progress."
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="admitted">Admitted</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-40">
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
            <HelpTooltip content="Filter students by status and target country. Active students are those currently working on applications." />
          </div>
          
          <Button onClick={() => setIsAddStudentModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>

        {/* Students Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : students?.length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-500" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? <Skeleton className="h-8 w-16" /> : students?.filter(s => s.status === 'active').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoading ? <Skeleton className="h-8 w-16" /> : students?.filter(s => s.status === 'applied').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Admitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {isLoading ? <Skeleton className="h-8 w-16" /> : students?.filter(s => s.status === 'admitted').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Students List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {statusFilter === 'all' 
                    ? "Students will appear here when leads are converted."
                    : `No students with status "${statusFilter}".`
                  }
                </p>
                <div className="mt-6">
                  <Button onClick={() => setIsAddStudentModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Target Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Academic Background</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow 
                      key={student.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setIsProfileModalOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="w-3 h-3 mr-1" />
                            {student.email}
                          </div>
                          {student.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-3 h-3 mr-1" />
                              {student.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {student.targetCountry && (
                            <div className="flex items-center text-sm">
                              <Globe className="w-3 h-3 mr-1" />
                              {student.targetCountry}
                            </div>
                          )}
                          {student.targetProgram && (
                            <div className="flex items-center text-sm">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              {student.targetProgram}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status || 'active')}>
                          {student.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {student.academicBackground || 'Not specified'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(student.createdAt)}
                        </span>
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
          </CardContent>
        </Card>
      </div>

      <AddStudentModal 
        open={isAddStudentModalOpen}
        onOpenChange={setIsAddStudentModalOpen}
      />
      <AddApplicationModal 
        open={isAddApplicationModalOpen}
        onOpenChange={setIsAddApplicationModalOpen}
        studentId={selectedStudentId || undefined}
      />
      <StudentProfileModal 
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        studentId={selectedStudentId}
      />
    </Layout>
  );
}
