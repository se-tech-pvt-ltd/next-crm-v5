import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { LeadDetailsModal } from '@/components/lead-details-modal';
import { HelpTooltip } from '@/components/help-tooltip';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatStatus } from '@/lib/utils';
import { Lead } from '@/lib/types';
import { Plus, MoreHorizontal, UserPlus, Phone, Mail, Globe, GraduationCap, Users, UserCheck, Target, TrendingUp, Filter, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

export default function Leads() {
  // Helper functions for display names
  const getCountryDisplayName = (countryCode: string): string => {
    const countryMap: { [key: string]: string } = {
      'USA': 'United States',
      'Canada': 'Canada',
      'UK': 'United Kingdom',
      'Australia': 'Australia',
      'Germany': 'Germany',
      'France': 'France',
      'Netherlands': 'Netherlands',
      'New Zealand': 'New Zealand',
    };
    return countryMap[countryCode] || countryCode;
  };

  const getProgramDisplayName = (programCode: string): string => {
    const programMap: { [key: string]: string } = {
      'Business Administration': 'Business Administration',
      'Computer Science': 'Computer Science',
      'Computer': 'Computer Science',
      'Engineering': 'Engineering',
      'Medicine': 'Medicine',
      'Law': 'Law',
      'Arts & Humanities': 'Arts & Humanities',
      'Social Sciences': 'Social Sciences',
      'Natural Sciences': 'Natural Sciences',
      'Education': 'Education',
      'Psychology': 'Psychology',
    };
    return programMap[programCode] || programCode;
  };

  const getSourceDisplayName = (sourceCode: string): string => {
    const sourceMap: { [key: string]: string } = {
      'website': 'Website',
      'referral': 'Referral',
      'social-media': 'Social Media',
      'advertisement': 'Advertisement',
      'event': 'Event',
    };
    return sourceMap[sourceCode] || sourceCode.charAt(0).toUpperCase() + sourceCode.slice(1);
  };
  const [, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState<Date | undefined>(undefined);
  const [dateToFilter, setDateToFilter] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 10 records per page
  // Removed no activity filter since we don't have activities API configured
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleLeadUpdate = (updatedLead: Lead) => {
    setSelectedLead(updatedLead);
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAddLeadClick = () => {
    setIsNavigating(true);
    // Small delay for animation effect
    setTimeout(() => {
      setLocation('/leads/add');
    }, 200);
  };

  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['/api/leads', { page: currentPage, limit: pageSize }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/leads?page=${currentPage}&limit=${pageSize}`);
      return response.json();
    },
  });

  // Extract leads and pagination info from response
  const leads = leadsResponse?.data || [];
  const pagination = leadsResponse?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  };

  // For now, we'll simplify the no activity filter without requiring activities API
  // const { data: activities } = useQuery({
  //   queryKey: ['/api/activities'],
  //   enabled: noActivityFilter,
  // });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Lead> }) => {
      const response = await apiRequest('PUT', `/api/leads/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Success",
        description: "Lead updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lead.",
        variant: "destructive",
      });
    },
  });

  const convertToStudentMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      const studentData = {
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        targetCountry: lead.country,
        targetProgram: lead.program,
        status: 'active',

      };
      
      const response = await apiRequest('POST', '/api/students', studentData);
      const student = await response.json();
      
      // Update lead status
      await updateLeadMutation.mutateAsync({ id: lead.id, data: { status: 'converted' } });
      
      return student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Success",
        description: "Lead converted to student successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to convert lead to student.",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads?.filter(lead => {
    const statusMatch = statusFilter === 'all' || lead.status === statusFilter;
    const sourceMatch = sourceFilter === 'all' || lead.source === sourceFilter;
    
    // Date range filter
    let dateMatch = true;
    if (dateFromFilter || dateToFilter) {
      const leadDate = lead.createdAt ? new Date(lead.createdAt) : null;
      if (leadDate) {
        if (dateFromFilter && leadDate < dateFromFilter) dateMatch = false;
        if (dateToFilter && leadDate > dateToFilter) dateMatch = false;
      }
    }
    
    return statusMatch && sourceMatch && dateMatch;
  }) || [];

  // Get unique sources for filter dropdown
  const uniqueSources = leads ? 
    leads.reduce((sources: string[], lead) => {
      if (lead.source && !sources.includes(lead.source)) {
        sources.push(lead.source);
      }
      return sources;
    }, []) : [];;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
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
      title="Leads" 
      subtitle="Manage and track your prospects"
      helpText="Leads are potential students interested in study abroad programs. Track their progress and convert them to active students."
    >
      <div className="space-y-3">
        {/* Header Actions */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Date Range Filter */}
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32 h-8 text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {dateFromFilter ? format(dateFromFilter, "MM/dd") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateFromFilter}
                    onSelect={setDateFromFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32 h-8 text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {dateToFilter ? format(dateToFilter, "MM/dd") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateToFilter}
                    onSelect={setDateToFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Clear Filters */}
            {(statusFilter !== 'all' || sourceFilter !== 'all' || dateFromFilter || dateToFilter) && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setStatusFilter('all');
                  setSourceFilter('all');
                  setDateFromFilter(undefined);
                  setDateToFilter(undefined);
                }}
              >
                Clear All
              </Button>
            )}
            
            <HelpTooltip content="Use filters to view leads by status, source, creation date range, and activity. Convert qualified leads to students when they're ready to proceed." />
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              className="h-8"
              onClick={handleAddLeadClick}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 mr-1"
                >
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                </motion.div>
              )}
              <span className="text-sm">
                {isNavigating ? 'Opening...' : 'Add Lead'}
              </span>
            </Button>
          </motion.div>
        </div>

        {/* Leads Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold">
                {isLoading ? <Skeleton className="h-6 w-12" /> : leads?.length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-500" />
                New Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-blue-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : leads?.filter(l => l.status === 'new').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                Qualified
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-green-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : leads?.filter(l => l.status === 'qualified').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Converted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-xl font-bold text-purple-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : leads?.filter(l => l.status === 'converted').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-lg">Leads List</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
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
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-4">
                <UserPlus className="mx-auto h-10 w-10 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {statusFilter === 'all'
                    ? "Get started by adding your first lead."
                    : `No leads with status "${statusFilter}".`
                  }
                </p>
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className="h-8"
                      onClick={handleAddLeadClick}
                      disabled={isNavigating}
                    >
                      {isNavigating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 mr-1"
                        >
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 0 }}
                          whileHover={{ rotate: 90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                        </motion.div>
                      )}
                      <span className="text-sm">
                        {isNavigating ? 'Opening...' : 'Add Lead'}
                      </span>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="w-3 h-3 mr-1" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-3 h-3 mr-1" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {lead.country && (
                            <div className="flex items-center text-sm">
                              <Globe className="w-3 h-3 mr-1" />
                              {getCountryDisplayName(lead.country)}
                            </div>
                          )}
                          {lead.program && (
                            <div className="flex items-center text-sm">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              {getProgramDisplayName(lead.program)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(lead.status || 'new')}>
                          {formatStatus(lead.status || 'new')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {lead.source ? getSourceDisplayName(lead.source) : 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(lead.createdAt)}
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsDetailsModalOpen(true);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => convertToStudentMutation.mutate(lead)}
                              disabled={convertToStudentMutation.isPending}
                            >
                              Convert to Student
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

      <LeadDetailsModal 
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        lead={selectedLead}
        onLeadUpdate={handleLeadUpdate}
      />
    </Layout>
  );
}
