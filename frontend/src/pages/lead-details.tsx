import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleCard } from '@/components/collapsible-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SearchableSelectV2 as SearchableSelect } from '@/components/ui/searchable-select-v2';
import { SearchableComboboxV3 as SearchableCombobox } from '@/components/ui/searchable-combobox-v3';
import { MultiSelectV4 as MultiSelect } from '@/components/ui/multi-select-v4';
import { ActivityTracker } from '@/components/activity-tracker';
import { Layout } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { type Lead, type User, type Student } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import * as LeadsService from '@/services/leads';
import * as DropdownsService from '@/services/dropdowns';
import * as UsersService from '@/services/users';
import { formatStatus } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  User as UserIcon,
  Edit,
  Save,
  X,
  UserPlus,
  Calendar,
  Users2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Globe,
  FileText,
  Users,
  Target,
  BookOpen
} from 'lucide-react';

export default function LeadDetails() {
  const { user: authUser } = useAuth();
  const [match, params] = useRoute('/leads/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  // Fast loading with optimistic caching
  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['/api/leads', params?.id],
    queryFn: async () => LeadsService.getLead(params?.id),
    enabled: !!params?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Get dropdown data for Leads module
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Leads')
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: convertedStudent } = useQuery<Student | null>({
    queryKey: ['/api/students/by-lead', params?.id],
    queryFn: async () => LeadsService.getStudentByLeadId(params?.id),
    enabled: !!params?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (lead) {
      // Handle conversion from arrays/JSON strings to single strings for select compatibility
      const processedLead = {
        ...lead,
        country: parseFieldValue(lead.country),
        program: parseFieldValue(lead.program)
      };
      setEditData(processedLead);
      setCurrentStatus(lead.status);
    }
  }, [lead]);

  // Helper function to parse field values that might be arrays, JSON strings, or regular strings
  const parseFieldValue = (value: any): string[] => {
    if (!value) return [];
    
    // If it's already an array, return it
    if (Array.isArray(value)) {
      return value;
    }
    
    // If it's a simple string that doesn't look like JSON, return as single item array
    if (typeof value === 'string' && !value.startsWith('[')) {
      return [value];
    }
    
    // If it's a JSON string, try to parse it
    if (typeof value === 'string' && value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // Handle nested JSON strings
          return parsed.map(item => {
            if (typeof item === 'string' && item.startsWith('[')) {
              try {
                const nestedParsed = JSON.parse(item);
                return Array.isArray(nestedParsed) ? nestedParsed[0] || '' : item;
              } catch (e) {
                return item;
              }
            }
            return item;
          }).filter(Boolean);
        }
        return [value];
      } catch (e) {
        return [value];
      }
    }
    
    return [String(value)];
  };

  const updateLeadMutation = useMutation({
    mutationFn: async (data: Partial<Lead>) => LeadsService.updateLead(params?.id, data),
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.setQueryData(['/api/leads', params?.id], updatedLead);
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsLostMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => LeadsService.markLeadAsLost(params?.id, reason),
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.setQueryData(['/api/leads', params?.id], updatedLead);
      toast({
        title: "Success",
        description: "Lead marked as lost",
      });
      setShowMarkAsLostModal(false);
      setLostReason('');
      setCurrentStatus('lost');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const deepEqual = (a: any, b: any) => {
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
        return true;
      }
      return a === b;
    };

    const normalize = (key: string, val: any) => {
      if (key === 'country' || key === 'program') {
        if (val == null) return [] as any[];
        return Array.isArray(val) ? val : [val].filter(Boolean);
      }
      return val;
    };

    const payload: any = {};
    const keys = Object.keys(editData || {});
    for (const key of keys) {
      const newVal = normalize(key, (editData as any)[key]);
      const oldVal = normalize(key, (lead as any)?.[key]);
      if (!deepEqual(newVal, oldVal)) {
        let valueToSend = newVal;
        if (key === 'counselorId') valueToSend = newVal === 'unassigned' ? null : newVal;
        if (key === 'type') valueToSend = newVal === 'not_specified' ? null : newVal;
        (payload as any)[key] = valueToSend;
      }
    }

    if (Object.keys(payload).length === 0) {
      toast({ title: 'No changes', description: 'Nothing to update.' });
      setIsEditing(false);
      return;
    }

    updateLeadMutation.mutate(payload);
  };


  // Build status sequence from dropdown API (ordered by sequence)
  const statusSequence = useMemo<string[]>(() => {
    const list: any[] = (dropdownData as any)?.Status || [];
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.map((o: any) => o.key || o.id || o.value).filter(Boolean);
  }, [dropdownData]);

  const getStatusDisplayName = (statusId: string) => {
    const list: any[] = (dropdownData as any)?.Status || [];
    const byId = list.find((o: any) => o.id === statusId);
    if (byId?.value) return byId.value;
    const byKey = list.find((o: any) => o.key === statusId);
    if (byKey?.value) return byKey.value;
    const byValue = list.find((o: any) => o.value === statusId);
    if (byValue?.value) return byValue.value;
    return formatStatus(statusId);
  };

  const getCurrentStatusIndex = () => {
    const list: any[] = (dropdownData as any)?.Status || [];
    if (!Array.isArray(list) || list.length === 0 || !currentStatus) return -1;

    const option = list.find((o: any) => o.key === currentStatus || o.id === currentStatus || o.value === currentStatus);
    if (!option) return -1;

    return statusSequence.findIndex((id) => id === (option.key || option.id));
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatusKey: string) => LeadsService.updateLead(params?.id, { status: newStatusKey }),
    onMutate: async (newStatusKey: string) => {
      await queryClient.cancelQueries({ queryKey: ['/api/leads', params?.id] });
      const previousLead = queryClient.getQueryData(['/api/leads', params?.id]);
      const previousStatus = currentStatus;
      setCurrentStatus(newStatusKey);
      if (previousLead && typeof previousLead === 'object') {
        queryClient.setQueryData(['/api/leads', params?.id], { ...(previousLead as any), status: newStatusKey });
      }
      return { previousLead, previousStatus } as { previousLead: any; previousStatus: string };
    },
    onError: (error: any, _newStatusKey, context) => {
      if (context?.previousStatus) setCurrentStatus(context.previousStatus);
      if (context?.previousLead) queryClient.setQueryData(['/api/leads', params?.id], context.previousLead);
      toast({ title: 'Error', description: error.message || 'Failed to update status', variant: 'destructive' });
    },
    onSuccess: (updatedLead) => {
      setCurrentStatus(updatedLead.status);
      queryClient.setQueryData(['/api/leads', params?.id], updatedLead);
      toast({ title: 'Status updated', description: `Lead status set to ${getStatusDisplayName(updatedLead.status)}` });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/lead/${params?.id}`] });
      queryClient.refetchQueries({ queryKey: [`/api/activities/lead/${params?.id}`] });
    },
  });

  const StatusProgressBar = () => {
    const currentIndex = getCurrentStatusIndex();
    console.log('Using index:', currentIndex, 'for status:', currentStatus);

    return (
      <div className="w-full bg-gray-100 rounded-md p-1.5 mb-3">
        <div className="flex items-center justify-between relative">
          {statusSequence.map((statusId, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index <= currentIndex;
            const statusName = getStatusDisplayName(statusId);

            const handleClick = () => {
              if (updateStatusMutation.isPending) return;
              if (!lead) return;
              const targetKey = statusId;
              if (currentStatus === targetKey) return;
              updateStatusMutation.mutate(targetKey);
            };

            return (
              <div
                key={statusId}
                className="flex flex-col items-center relative flex-1 cursor-pointer select-none"
                onClick={handleClick}
                role="button"
                aria-label={`Set status to ${statusName}`}
              >
                {/* Status Circle */}
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'
                }`}>
                  {isCompleted && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  {!isCompleted && <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                </div>

                {/* Status Label */}
                <span className={`mt-1 text-xs font-medium text-center ${
                  isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                }`}>
                  {statusName}
                </span>

                {/* Connector Line */}
                {index < statusSequence.length - 1 && (
                  <div className={`absolute top-2.5 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                  }`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!match) {
    return <div>Lead not found</div>;
  }

  if (error) {
    return (
      <Layout title="Lead Details">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error Loading Lead</h3>
              <p className="text-sm text-gray-600 mt-2">
                {error instanceof Error ? error.message : 'Failed to load lead details'}
              </p>
              <Button 
                onClick={() => setLocation('/leads')}
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout
      title={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/leads')}
          className="p-1 h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      }
      subtitle={undefined}
      helpText="View and edit lead information, track activities, and convert qualified leads to students."
    >
      <div className="text-xs md:text-[12px]">
        {/* Status Progress Bar */}
        {!isLoading && !convertedStudent && statusSequence.length > 0 && <StatusProgressBar />}

        <div className="flex gap-0 min-h-[calc(100vh-12rem)] w-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col space-y-4 min-w-0 w-full">
          {/* Personal Information Section */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Personal Information</CardTitle>
                <div className="flex items-center space-x-2">
                  {!isEditing ? (
                    convertedStudent ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full px-2 md:px-3 [&_svg]:size-5"
                        onClick={() => setLocation(`/students?studentId=${convertedStudent.id}`)}
                        disabled={isLoading}
                        title="View Student"
                      >
                        <UserIcon className="mr-0 md:mr-1" />
                        <span className="hidden lg:inline">View Student</span>
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="xs"
                          className="rounded-full px-2 [&_svg]:size-3"
                          onClick={() => setIsEditing(true)}
                          disabled={isLoading}
                          title="Edit"
                        >
                          <Edit />
                          <span className="hidden lg:inline">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          className="rounded-full px-2 [&_svg]:size-3"
                          onClick={() => setLocation(`/leads/${params?.id}/convert`)}
                          disabled={isLoading || currentStatus === 'converted'}
                          title="Convert to Student"
                        >
                          <UserPlus />
                          <span className="hidden lg:inline">Convert</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          className="rounded-full px-2 [&_svg]:size-3"
                          onClick={() => setShowMarkAsLostModal(true)}
                          disabled={isLoading || currentStatus === 'lost'}
                          title="Mark as Lost"
                        >
                          <XCircle />
                          <span className="hidden lg:inline">Lost</span>
                        </Button>
                      </>
                    )
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateLeadMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData(lead);
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4" />
                    <span>Full Name</span>
                  </Label>
                  <Input
                    id="name"
                    value={isEditing ? (editData.name || '') : (lead?.name || '')}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? (editData.email || '') : (lead?.email || '')}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={isEditing ? (editData.phone || '') : (lead?.phone || '')}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>City</span>
                  </Label>
                  <Input
                    id="city"
                    value={isEditing ? (editData.city || '') : (lead?.city || '')}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    disabled={!isEditing}
                    className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}
            </CardContent>
          </Card>

          {/* Lead Management Section */}
          <CollapsibleCard
            persistKey={`lead-details:${authUser?.id || 'anon'}:lead-information`}
            header={
              <CardTitle className="text-sm flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Lead Information</span>
              </CardTitle>
            }
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {/* Type */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Lead Type</span>
                  </Label>
                  <SearchableSelect
                    value={isEditing ? (editData.type || '') : (lead?.type || '')}
                    onValueChange={(value) => setEditData({ ...editData, type: value })}
                    placeholder="Select type"
                    searchPlaceholder="Search types..."
                    options={dropdownData?.Type?.map((option: any) => ({
                      value: option.key,
                      label: option.value
                    })) || []}
                    emptyMessage="No types found"
                    disabled={!isEditing}
                    className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Lead Source</span>
                  </Label>
                  <SearchableSelect
                    value={isEditing ? (editData.source || '') : (lead?.source || '')}
                    onValueChange={(value) => setEditData({ ...editData, source: value })}
                    placeholder="Select source"
                    searchPlaceholder="Search sources..."
                    options={dropdownData?.Source?.map((option: any) => ({
                      value: option.key,
                      label: option.value
                    })) || []}
                    emptyMessage="No sources found"
                    disabled={!isEditing}
                    className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Counselor */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4" />
                    <span>Admission Officer</span>
                  </Label>
                  <SearchableSelect
                    value={isEditing ? (editData.counselorId || '') : (lead?.counselorId || '')}
                    onValueChange={(value) => setEditData({ ...editData, counselorId: value })}
                    placeholder="Select officer"
                    searchPlaceholder="Search officers..."
                    options={users?.map((user: any) => ({
                      value: user.id,
                      label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
                    })) || []}
                    emptyMessage="No officers found"
                    disabled={!isEditing}
                    className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}
          </CollapsibleCard>

          {/* Academic Interests Section */}
          <CollapsibleCard
            persistKey={`lead-details:${authUser?.id || 'anon'}:academic-interests`}
            header={
              <CardTitle className="text-sm flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Academic Interests</span>
              </CardTitle>
            }
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                {/* Interested Country - Multi-Select */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Interested Countries</span>
                  </Label>
                  {isEditing ? (
                    <MultiSelect
                      value={Array.isArray(editData.country) ? editData.country : parseFieldValue(editData.country)}
                      onValueChange={(values) => setEditData({ ...editData, country: values })}
                      placeholder="Select countries"
                      searchPlaceholder="Search countries..."
                      options={dropdownData?.["Interested Country"]?.map((option: any) => ({
                        value: option.key,
                        label: option.value
                      })) || []}
                      emptyMessage="No countries found"
                      maxDisplayItems={3}
                      className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(function() {
                        const values = parseFieldValue(lead?.country);
                        const labels = (dropdownData?.["Interested Country"] || [])
                          .filter((opt: any) => values.includes(opt.key) || values.includes(opt.id) || values.includes(opt.value))
                          .map((opt: any) => opt.value);
                        return labels.length ? (
                          labels.map((label: string) => (
                            <span key={label} className="px-2 py-0.5 rounded-full border border-red-500 text-red-600 text-xs">
                              {label}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">Not specified</span>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Study Level */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>Study Level</span>
                  </Label>
                  <SearchableSelect
                    value={isEditing ? (editData.studyLevel || '') : (lead?.studyLevel || '')}
                    onValueChange={(value) => setEditData({ ...editData, studyLevel: value })}
                    placeholder="Select study level"
                    searchPlaceholder="Search study levels..."
                    options={dropdownData?.["Study Level"]?.map((option: any) => ({
                      value: option.key,
                      label: option.value
                    })) || []}
                    emptyMessage="No study levels found"
                    disabled={!isEditing}
                    className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Study Plan */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Study Plan</span>
                  </Label>
                  <SearchableSelect
                    value={isEditing ? (editData.studyPlan || '') : (lead?.studyPlan || '')}
                    onValueChange={(value) => setEditData({ ...editData, studyPlan: value })}
                    placeholder="Select study plan"
                    searchPlaceholder="Search study plans..."
                    options={dropdownData?.["Study Plan"]?.map((option: any) => ({
                      value: option.key,
                      label: option.value
                    })) || []}
                    emptyMessage="No study plans found"
                    disabled={!isEditing}
                    className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* ELT */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>English Language Test Completed</span>
                  </Label>
                  <ToggleGroup
                    type="single"
                    value={isEditing ? (editData.elt || '') : (lead?.elt || '')}
                    onValueChange={(value) => value && setEditData({ ...editData, elt: value })}
                    className="justify-start gap-2"
                  >
                    <ToggleGroupItem
                      value="yes"
                      disabled={!isEditing}
                      variant="outline"
                      size="sm"
                      className="rounded-full px-3 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-400"
                      aria-label="Yes"
                    >
                      Yes
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="no"
                      disabled={!isEditing}
                      variant="outline"
                      size="sm"
                      className="rounded-full px-3 data-[state=on]:bg-red-100 data-[state=on]:text-red-700 data-[state=on]:border-red-400"
                      aria-label="No"
                    >
                      No
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            )}
          </CollapsibleCard>

        </div>

        {/* Activity Sidebar */}
        <div className="w-[30rem] flex-shrink-0 bg-gray-50 rounded-lg p-3 flex flex-col min-h-full">
          <h3 className="text-sm font-semibold mb-2 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Activity Timeline
          </h3>
          {isLoading ? (
            <div className="space-y-4 flex-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ActivityTracker
                entityType="lead"
                entityId={params?.id || ''}
                initialInfo={lead?.notes}
                initialInfoDate={lead?.createdAt as any}
                initialInfoUserName={(function() {
                  const creatorId = (lead as any)?.createdBy || lead?.counselorId || null;
                  const user = (users as any[])?.find?.((u: any) => u.id === creatorId);
                  const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : null;
                  return name || undefined;
                })()}
                canAdd={!convertedStudent}
              />
            </div>
          )}
        </div>
      </div>
      </div>


      {/* Mark as Lost Modal */}
      <Dialog open={showMarkAsLostModal} onOpenChange={setShowMarkAsLostModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Lead as Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for marking as lost</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason why this lead was lost..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMarkAsLostModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => markAsLostMutation.mutate({ reason: lostReason })}
                disabled={!lostReason.trim() || markAsLostMutation.isPending}
              >
                {markAsLostMutation.isPending ? 'Marking...' : 'Mark as Lost'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
