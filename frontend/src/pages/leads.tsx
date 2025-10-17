import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
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
import { Plus, UserPlus, Phone, Globe, Users, XCircle, TrendingUp, Filter, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { AddLeadModal } from '@/components/add-lead-modal';
import { LeadDetailsModal } from '@/components/lead-details-modal';
import { ConvertToStudentModal } from '@/components/convert-to-student-modal';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
const useState = React.useState;

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
  const [location, setLocation] = useLocation();
  const [matchLead, leadParams] = useRoute('/leads/:id');
  const [matchEdit, editParams] = useRoute('/leads/:id/edit');
  const [matchConvert, convertParams] = useRoute('/leads/:id/student');
  const [isNavigating, setIsNavigating] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState<Date | undefined>(undefined);
  const [dateToFilter, setDateToFilter] = useState<Date | undefined>(undefined);
  const [lastUpdatedFilter, setLastUpdatedFilter] = useState('all');
  const [queryText, setQueryText] = useState('');
  const [openDateRange, setOpenDateRange] = useState(false);
  const [dateRangeStep, setDateRangeStep] = useState<'from' | 'to'>('from');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8); // 8 records per page (paginate after 8 records)
  // Access control for Leads: show Create button only if allowed
  const { accessByRole } = useAuth() as any;
  const normalize = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const singularize = (s: string) => s.replace(/s$/i, '');
  const canCreateLead = React.useMemo(() => {
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalize(a.moduleName ?? a.module_name)) === 'lead');
    if (entries.length === 0) return true;
    return entries.some((e: any) => (e.canCreate ?? e.can_create) === true);
  }, [accessByRole]);
  // Removed no activity filter since we don't have activities API configured
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAddLeadClick = () => {
    setLocation('/leads/new');
    setIsNavigating(true);
    setTimeout(() => {
      try {
        const { useModalManager } = require('@/contexts/ModalManagerContext');
        const { openModal } = useModalManager();
        openModal(() => setAddLeadOpen(true));
      } catch {
        setAddLeadOpen(true);
      }
      setIsNavigating(false);
    }, 200);
  };

  // Get dropdown data for mapping IDs to display values
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Leads')
  });

  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['/api/leads', { page: currentPage, limit: pageSize, status: statusFilter, source: sourceFilter, lastUpdated: lastUpdatedFilter }],
    queryFn: async () => LeadsService.getLeads({
      page: currentPage,
      limit: pageSize,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      source: sourceFilter !== 'all' ? sourceFilter : undefined,
      lastUpdated: lastUpdatedFilter !== 'all' ? lastUpdatedFilter : undefined,
    }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: leadById } = useQuery({
    queryKey: ['/api/leads', leadParams?.id],
    queryFn: async () => LeadsService.getLead(leadParams?.id),
    enabled: Boolean(matchLead && leadParams?.id && leadParams.id !== 'new'),
    staleTime: 0,
  });

  const { data: leadByIdForConvert } = useQuery({
    queryKey: ['/api/leads', convertParams?.id],
    queryFn: async () => LeadsService.getLead(convertParams?.id),
    enabled: Boolean(matchConvert && convertParams?.id),
    staleTime: 0,
  });

  const { data: leadByIdForEdit } = useQuery({
    queryKey: ['/api/leads', editParams?.id],
    queryFn: async () => LeadsService.getLead(editParams?.id),
    enabled: Boolean(matchEdit && editParams?.id),
    staleTime: 0,
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

  const getLastUpdatedThreshold = (filterValue: string): Date | null => {
    const now = new Date();
    switch (filterValue) {
      case '1':
        return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      case '3':
        return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      case '5':
        return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      case '7':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      case '15':
        return new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      case '30':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      default:
        return null;
    }
  };

  const filteredLeads = leads?.filter(lead => {
    const statusMatch = statusFilter === 'all'
      ? true
      : statusFilter === 'converted'
        ? convertedLeadIds.has(lead.id)
        : statusFilter === 'lost'
          ? (String((lead as any).isLost || '') === '1' || lead.status === 'lost')
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

    // Last updated filter
    let lastUpdatedMatch = true;
    if (lastUpdatedFilter !== 'all') {
      const threshold = getLastUpdatedThreshold(lastUpdatedFilter);
      if (threshold) {
        const leadUpdatedDate = lead.updatedAt ? new Date(lead.updatedAt) : null;
        if (!leadUpdatedDate || leadUpdatedDate < threshold) {
          lastUpdatedMatch = false;
        }
      }
    }

    // Free text query filter (name, phone, email, city)
    const q = String(queryText || '').trim().toLowerCase();
    const matchesQuery = q === '' ? true : [lead.name, lead.phone, lead.email, lead.city].some(f => {
      if (!f) return false;
      return String(f).toLowerCase().includes(q);
    });

    return statusMatch && sourceMatch && dateMatch && lastUpdatedMatch && matchesQuery;
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


  const [showConvertModal, setShowConvertModal] = useState(false);
  const { data: leadsStats } = useQuery({
    queryKey: ['/api/leads/stats'],
    queryFn: async () => LeadsService.getLeadsStats(),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [addLeadInitialData, setAddLeadInitialData] = useState<any | undefined>(undefined);

  React.useEffect(() => {
    if (location === '/leads/new') {
      setAddLeadOpen(true);
      try {
        const raw = sessionStorage.getItem('pendingLeadInitialData');
        if (raw) {
          setAddLeadInitialData(JSON.parse(raw));
          sessionStorage.removeItem('pendingLeadInitialData');
        } else {
          setAddLeadInitialData(undefined);
        }
      } catch (e) {
        setAddLeadInitialData(undefined);
      }
    }
  }, [location]);

  React.useEffect(() => {
    if (matchLead) {
      setLeadModalOpen(true);
      const id = leadParams?.id;
      if (id) {
        const found = Array.isArray(leads) ? (leads as any[]).find((l: any) => String(l.id) === String(id)) : undefined;
        if (leadById) setSelectedLead(leadById as any);
        else if (found) setSelectedLead(found as any);
      }
    }
  }, [matchLead, leadParams, leads, leadById]);

  React.useEffect(() => {
    if (matchConvert) {
      setShowConvertModal(true);
      const id = convertParams?.id;
      if (id) {
        const found = Array.isArray(leads) ? (leads as any[]).find((l: any) => String(l.id) === String(id)) : undefined;
        if (leadByIdForConvert) {
          setSelectedLead(leadByIdForConvert as any);
          setConvertLead(leadByIdForConvert as any);
        } else if (found) {
          setSelectedLead(found as any);
          setConvertLead(found as any);
        }
      }
    }
  }, [matchConvert, convertParams, leads, leadByIdForConvert]);

  React.useEffect(() => {
    if (matchEdit) {
      setLeadModalOpen(true);
      const id = editParams?.id;
      if (id) {
        const found = Array.isArray(leads) ? (leads as any[]).find((l: any) => String(l.id) === String(id)) : undefined;
        if (leadByIdForEdit) setSelectedLead(leadByIdForEdit as any);
        else if (found) setSelectedLead(found as any);
      }
    }
  }, [matchEdit, editParams, leads, leadByIdForEdit]);

  return (
    <Layout
      title="Leads"
      subtitle="Manage and track your prospects"
    >
      <div className="space-y-3">

        {/* Leads Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-500" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 relative">
              <div className="text-lg font-bold">
                {isLoading ? <Skeleton className="h-6 w-12" /> : (pagination.total || 0)}
              </div>
              <div className="absolute top-3 right-3 text-xs text-muted-foreground font-medium">
                {isLoading ? <Skeleton className="h-3 w-8" /> : ((pagination.total || 0) ? '100%' : '0%')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <UserPlus className="w-3 h-3 text-primary" />
                Active Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 relative">
              <div className="text-lg font-bold text-yellow-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : (leadsStats?.active ?? 0)}
              </div>
              <div className="absolute top-3 right-3 text-xs text-yellow-600 font-medium">
                {isLoading ? <Skeleton className="h-3 w-8" /> : (() => {
                  const total = (pagination.total || 0);
                  const val = (leadsStats?.active ?? 0);
                  return total ? `${Math.round((val / total) * 100)}%` : '0%';
                })()}
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <XCircle className="w-3 h-3 text-red-500" />
                Lost Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 relative">
              <div className="text-lg font-bold text-red-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : (leadsStats?.lost ?? 0)}
              </div>
              <div className="absolute top-3 right-3 text-xs text-red-600 font-medium">
                {isLoading ? <Skeleton className="h-3 w-8" /> : (() => {
                  const total = (pagination.total || 0);
                  const val = (leadsStats?.lost ?? 0);
                  return total ? `${Math.round((val / total) * 100)}%` : '0%';
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => { setStatusFilter('converted'); setCurrentPage(1); }}>
            <CardHeader className="pb-2 p-3">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-purple-500" />
                Converted Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 relative">
              <div className="text-lg font-bold text-green-600">
                {isLoading ? <Skeleton className="h-6 w-12" /> : convertedCount}
              </div>
              <div className="absolute top-3 right-3 text-xs text-green-600 font-medium">
                {isLoading ? <Skeleton className="h-3 w-8" /> : (() => {
                  const total = (pagination.total || 0);
                  const val = convertedCount || 0;
                  return total ? `${Math.round((val / total) * 100)}%` : '0%';
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader className="p-4 pb-3">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-800">Filters</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Clear Filters */}
                  {(statusFilter !== 'all' || sourceFilter !== 'all' || lastUpdatedFilter !== 'all' || dateFromFilter || dateToFilter || queryText) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-3"
                      onClick={() => {
                        setStatusFilter('all');
                        setSourceFilter('all');
                        setLastUpdatedFilter('all');
                        setDateFromFilter(undefined);
                        setDateToFilter(undefined);
                        setQueryText('');
                        setCurrentPage(1);
                      }}
                    >
                      Clear All
                    </Button>
                  )}

                  {/* Create Lead Button */}
                  {canCreateLead && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 px-3 bg-primary text-white shadow ring-2 ring-primary/40 hover:ring-primary flex items-center gap-2"
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
                        <span className="text-xs">Add Lead</span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Filter Row 1: Search and Dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Free text search for name, phone, email, city */}
                <div className="flex-1 min-w-52">
                  <InputWithIcon
                    value={queryText}
                    onChange={(e) => { setQueryText(e.target.value); setCurrentPage(1); }}
                    placeholder="Search name, phone, email, city"
                    leftIcon={<Search className="w-3 h-3" />}
                    id="leads-filter-search"
                    aria-label="Search leads"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Status</SelectItem>
                    {dropdownData?.Status?.map((status: any) => (
                      <SelectItem key={status.key} value={status.key}>
                        {status.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={(value) => {
                  setSourceFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Select Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Source</SelectItem>
                    {dropdownData?.Source?.map((source: any) => (
                      <SelectItem key={source.key} value={source.key}>
                        {source.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={lastUpdatedFilter} onValueChange={(value) => {
                  setLastUpdatedFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue placeholder="Last Updated at" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Last Updated at</SelectItem>
                    <SelectItem value="1">1 day ago</SelectItem>
                    <SelectItem value="3">3 days ago</SelectItem>
                    <SelectItem value="5">5 days ago</SelectItem>
                    <SelectItem value="7">7 days ago</SelectItem>
                    <SelectItem value="15">15 days ago</SelectItem>
                    <SelectItem value="30">30 days ago</SelectItem>
                  </SelectContent>
                </Select>

                {/* Combined Date Range Popover */}
                <Popover open={openDateRange} onOpenChange={(open) => {
                  setOpenDateRange(open);
                  if (!open) {
                    setDateRangeStep('from');
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 text-xs flex items-center justify-between whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2" />
                        <span className="leading-none text-xs">
                          {dateFromFilter && dateToFilter
                            ? `${format(dateFromFilter, "MM/dd")} - ${format(dateToFilter, "MM/dd")}`
                            : dateFromFilter
                            ? `From ${format(dateFromFilter, "MM/dd")}`
                            : "Date range"}
                        </span>
                      </div>
                      {(dateFromFilter || dateToFilter) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDateFromFilter(undefined);
                            setDateToFilter(undefined);
                          }}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-4" align="start" sideOffset={6}>
                    <div className="space-y-3">
                      <div className="text-sm font-medium">
                        {dateRangeStep === 'from' ? 'Select start date' : 'Select end date'}
                      </div>
                      <div className="w-full overflow-hidden">
                        <ErrorBoundary fallback={<div className="p-2 text-sm">Calendar failed to render.</div>}>
                          <CalendarComponent
                            mode="single"
                            selected={dateRangeStep === 'from' ? dateFromFilter : dateToFilter}
                            onSelect={(date) => {
                              if (dateRangeStep === 'from') {
                                setDateFromFilter(date);
                                setCurrentPage(1);
                                setDateRangeStep('to');
                              } else {
                                if (date && dateFromFilter && date < dateFromFilter) {
                                  toast({
                                    title: "Invalid date range",
                                    description: "End date must be after start date.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                setDateToFilter(date);
                                setCurrentPage(1);
                                setOpenDateRange(false);
                                setDateRangeStep('from');
                              }
                            }}
                            disabled={(date) => {
                              if (dateRangeStep === 'to' && dateFromFilter) {
                                return date < dateFromFilter;
                              }
                              return false;
                            }}
                            className="w-full"
                            showOutsideDays={false}
                            classNames={{
                              months: 'flex',
                              month: 'grid grid-cols-7 gap-1 min-w-[260px]',
                              table: 'w-full table-fixed',
                              head_row: 'grid grid-cols-7',
                              head_cell: 'text-muted-foreground text-center text-xs',
                              row: 'grid grid-cols-7',
                              cell: 'w-full h-10 text-center p-0',
                              day: 'w-full h-full p-0 text-sm leading-tight whitespace-nowrap',
                            }}
                          />
                        </ErrorBoundary>
                      </div>
                      {dateRangeStep === 'from' && dateFromFilter && (
                        <div className="text-xs text-muted-foreground">
                          Start date: {format(dateFromFilter, "MMMM d, yyyy")}
                        </div>
                      )}
                      {dateRangeStep === 'to' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => {
                              setDateRangeStep('from');
                            }}
                          >
                            Back
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => {
                              setOpenDateRange(false);
                              setDateRangeStep('from');
                            }}
                          >
                            Done
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <EmptyState
                icon={<UserPlus className="h-10 w-10" />}
                title="No leads found"
                description={statusFilter === 'all' ? 'Get started by adding your first lead.' : `No leads with status "${statusFilter}".`}
                action={canCreateLead ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="h-8 px-4" onClick={handleAddLeadClick} disabled={isNavigating}>
                        {isNavigating ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 mr-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          </motion.div>
                        ) : (
                          <motion.div initial={{ rotate: 0 }} animate={{ rotate: 0 }} whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                            <Plus className="w-4 h-4 mr-2" />
                          </motion.div>
                        )}
                        <span className="text-sm">{isNavigating ? 'Opening...' : 'Add Lead'}</span>
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : undefined}
              />
            ) : (
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 px-3 text-xs font-semibold">Name</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold">Phone</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold">Source</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold">Interested Country</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold">Status</TableHead>
                    <TableHead className="h-10 px-3 text-xs font-semibold">Current Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setLocation(`/leads/${lead.id}`);
                        setSelectedLead(lead);
                        try {
                          const { useModalManager } = require('@/contexts/ModalManagerContext');
                          const { openModal } = useModalManager();
                          openModal(() => setLeadModalOpen(true));
                        } catch {
                          setLeadModalOpen(true);
                        }
                      }}
                    >
                      <TableCell className="font-medium p-3 text-sm">{lead.name}</TableCell>
                      <TableCell className="p-3 text-sm">
                        {lead.phone ? (
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-2 text-gray-500" />
                            {lead.phone}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No phone</span>
                        )}
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        <Badge className="bg-gray-100 text-gray-800 text-xs">
                          {lead.source ? getSourceDisplayName(lead.source) : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        {lead.country ? (
                          <div className="flex items-center text-sm">
                            <Globe className="w-3 h-3 mr-2 text-gray-500" />
                            {getCountryDisplayName(lead.country)}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        <Badge className={getStatusColor(lead.status || 'new')} variant="secondary">
                          {getStatusDisplayName(lead.status || 'new')}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3 text-sm">
                        {(() => {
                          const isConverted = Boolean((lead as any).isConverted || (lead as any).is_converted || convertedLeadIds.has(lead.id) || (lead.status === 'converted'));
                          const isLost = Boolean((lead as any).isLost || (lead as any).is_lost || (lead.status === 'lost'));
                          if (isConverted && !isLost) {
                            return <Badge className="bg-green-100 text-green-800 text-xs">Converted</Badge>;
                          }
                          if (!isConverted && isLost) {
                            return <Badge className="bg-red-100 text-red-800 text-xs">Lost</Badge>;
                          }
                          return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Active</Badge>;
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {!isLoading && pagination.total > pageSize && (
              <div className="mt-6 pt-4 border-t">
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
      <AddLeadModal
        open={addLeadOpen}
        onOpenChange={(open) => {
          setAddLeadOpen(open);
          if (!open && location === '/leads/new') {
            setLocation('/leads');
          }
        }}
        initialData={addLeadInitialData}
      />
      <LeadDetailsModal
        open={leadModalOpen}
        startInEdit={Boolean(matchEdit)}
        onOpenChange={(open) => {
          setLeadModalOpen(open);
          if (!open) {
            try { setLocation('/leads'); } catch {}
            setSelectedLead(null);
          }
        }}
        lead={selectedLead}
        onLeadUpdate={(updated) => {
          setSelectedLead(updated);
          queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
        }}
        onOpenConvert={(lead) => {
          setConvertLead(lead);
          setLocation(`/leads/${lead.id}/student`);
          try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setShowConvertModal(true)); } catch { setShowConvertModal(true); }
        }}
      />

      <ConvertToStudentModal open={showConvertModal} onOpenChange={(open) => {
        setShowConvertModal(open);
        if (!open) {
          if (matchConvert && convertParams?.id) setLocation(`/leads/${convertParams.id}`);
          setConvertLead(null);
        }
      }} lead={convertLead} />
    </Layout>
  );
}
