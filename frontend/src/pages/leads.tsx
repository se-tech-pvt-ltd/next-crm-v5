import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import * as DropdownsService from '@/services/dropdowns';
import * as LeadsService from '@/services/leads';
import * as StudentsService from '@/services/students';
import { Lead } from '@/lib/types';
import { Plus, UserPlus, Phone, Globe, Users, Target, TrendingUp, Filter, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddLeadForm from '@/components/add-lead-form';

export default function Leads() {
  // Helper functions for display names using dropdown data
  const getCountryDisplayName = (countryData: string | string[]): string => {
    if (!dropdownData?.["Interested Country"]) return String(countryData);

    // Handle array of country IDs (either as array or JSON string)
    let countryIds: string[] = [];

    if (Array.isArray(countryData)) {
      countryIds = countryData;
    } else if (typeof countryData === 'string') {
      // Try to parse as JSON array first
      try {
        const parsed = JSON.parse(countryData);
        if (Array.isArray(parsed)) {
          countryIds = parsed;
        } else {
          // Single country ID
          countryIds = [countryData];
        }
      } catch {
        // Not JSON, treat as single country ID
        countryIds = [countryData];
      }
    }

    // Map IDs to country names
    const countryNames = countryIds
      .map(id => {
        const country = dropdownData["Interested Country"].find((item: any) => item.key === id);
        return country?.value || id;
      })
      .filter(Boolean);

    return countryNames.length > 0 ? countryNames.join(', ') : 'Not specified';
  };

  const getSourceDisplayName = (sourceId: string): string => {
    if (!dropdownData?.Source) return sourceId;
    const source = dropdownData.Source.find((item: any) => item.key === sourceId);
    return source?.value || sourceId;
  };

  const getStatusDisplayName = (statusId: string): string => {
    if (!dropdownData?.Status) return statusId;
    const status = dropdownData.Status.find((item: any) => item.key === statusId);
    return status?.value || statusId;
  };
  const [, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState<Date | undefined>(undefined);
  const [dateToFilter, setDateToFilter] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 10 records per page
  // Removed no activity filter since we don't have activities API configured
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAddLeadClick = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setAddLeadOpen(true);
      setIsNavigating(false);
    }, 200);
  };

  // Get dropdown data for mapping IDs to display values
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Leads')
  });

  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['/api/leads', { page: currentPage, limit: pageSize }],
    queryFn: async () => LeadsService.getLeads({ page: currentPage, limit: pageSize }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: students } = useQuery({
    queryKey: ['/api/students'],
    staleTime: 0,
    refetchOnMount: true,
  });

  // Extract leads and pagination info from response
  const leads = leadsResponse?.data || [];
  const convertedLeadIds = new Set((Array.isArray(students) ? students : []).map((s: any) => s.leadId).filter(Boolean));
  const convertedCount = leads.filter((l: any) => convertedLeadIds.has(l.id)).length;
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<Lead> }) => LeadsService.updateLead(String(id), data),
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
      
      const student = await StudentsService.createStudent(studentData as any);
      
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
    const statusMatch = statusFilter === 'all'
      ? true
      : statusFilter === 'converted'
        ? convertedLeadIds.has(lead.id)
        : lead.status === statusFilter;
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


  return (
    <Layout
      title="Leads"
      subtitle="Manage and track your prospects"
    >
      <div className="space-y-3">

        {/* Leads Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-500" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold">
                {isLoading ? <Skeleton className="h-6 w-12" /> : pagination.total || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <UserPlus className="w-3 h-3 text-blue-500" />
                New Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-blue-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : leads?.filter(l => l.status === 'new').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Target className="w-3 h-3 text-green-500" />
                Qualified
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-green-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : leads?.filter(l => l.status === 'qualified').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer" onClick={() => { setStatusFilter('converted'); setCurrentPage(1); }}>
            <CardHeader className="pb-1 p-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                Converted
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-base font-semibold text-purple-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : convertedCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Filter className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Filters:</span>
                </div>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {dropdownData?.Status?.map((status: any) => (
                      <SelectItem key={status.key} value={status.key}>
                        {status.value}
                      </SelectItem>
                    ))}
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={(value) => {
                  setSourceFilter(value);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {dropdownData?.Source?.map((source: any) => (
                      <SelectItem key={source.key} value={source.key}>
                        {source.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Range Filter */}
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-28 h-7 text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {dateFromFilter ? format(dateFromFilter, "MM/dd") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dateFromFilter}
                        onSelect={(date) => {
                          setDateFromFilter(date);
                          setCurrentPage(1); // Reset to first page when filter changes
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-28 h-7 text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {dateToFilter ? format(dateToFilter, "MM/dd") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dateToFilter}
                        onSelect={(date) => {
                          setDateToFilter(date);
                          setCurrentPage(1); // Reset to first page when filter changes
                        }}
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
                    className="h-7 text-xs"
                    onClick={() => {
                      setStatusFilter('all');
                      setSourceFilter('all');
                      setDateFromFilter(undefined);
                      setDateToFilter(undefined);
                      setCurrentPage(1); // Reset to first page when clearing filters
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
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
                    onClick={handleAddLeadClick}
                    disabled={isNavigating}
                    title="Add New Lead"
                  >
                    {isNavigating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ rotate: 0 }}
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Plus className="w-4 h-4" />
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
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
            ) : filteredLeads.length === 0 ? (
              <EmptyState
                icon={<UserPlus className="h-10 w-10" />}
                title="No leads found"
                description={statusFilter === 'all' ? 'Get started by adding your first lead.' : `No leads with status "${statusFilter}".`}
                action={
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="h-8" onClick={handleAddLeadClick} disabled={isNavigating}>
                        {isNavigating ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 mr-1">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                          </motion.div>
                        ) : (
                          <motion.div initial={{ rotate: 0 }} animate={{ rotate: 0 }} whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                            <Plus className="w-3 h-3 mr-1" />
                          </motion.div>
                        )}
                        <span className="text-sm">{isNavigating ? 'Opening...' : 'Add Lead'}</span>
                      </Button>
                    </motion.div>
                  </motion.div>
                }
              />
            ) : (
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 text-[11px]">Name</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Phone</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Source</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Interested Country</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Converted</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setLocation(`/leads/${lead.id}`);
                      }}
                    >
                      <TableCell className="font-medium p-2 text-xs">{lead.name}</TableCell>
                      <TableCell className="p-2 text-xs">
                        {lead.phone ? (
                          <div className="flex items-center text-xs">
                            <Phone className="w-3 h-3 mr-1" />
                            {lead.phone}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No phone</span>
                        )}
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <span className="text-xs">
                          {lead.source ? getSourceDisplayName(lead.source) : 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        {lead.country ? (
                          <div className="flex items-center text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            {getCountryDisplayName(lead.country)}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        {convertedLeadIds.has(lead.id) ? (
                          <Badge className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <Badge className={getStatusColor(lead.status || 'new')}>
                          {getStatusDisplayName(lead.status || 'new')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {!isLoading && filteredLeads.length > 0 && (
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
      <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <DialogHeader>
            <DialogTitle className="sr-only">Add New Lead</DialogTitle>
          </DialogHeader>
          <AddLeadForm
            onCancel={() => setAddLeadOpen(false)}
            onSuccess={() => {
              setAddLeadOpen(false);
              queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
