import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ActivityTracker } from '@/components/activity-tracker';
import { ConvertToStudentModal } from '@/components/convert-to-student-modal';
import { CommandMultiSelect } from '@/components/command-multi-select';
import { Layout } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { type Lead, type User } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatStatus } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User as UserIcon, Edit, Save, X, UserPlus, Calendar, Users2, XCircle } from 'lucide-react';

export default function LeadDetails() {
  const [match, params] = useRoute('/leads/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  // Fast loading with optimistic caching
  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['/api/leads', params?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/leads/${params?.id}`);
      return response.json();
    },
    enabled: !!params?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
    mutationFn: async (data: Partial<Lead>) => {
      const response = await apiRequest('PUT', `/api/leads/${params?.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update lead');
      }
      return response.json();
    },
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
    mutationFn: async ({ reason }: { reason: string }) => {
      const response = await apiRequest('PUT', `/api/leads/${params?.id}`, {
        status: 'lost',
        lostReason: reason
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark lead as lost');
      }
      return response.json();
    },
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
    const updateData = {
      ...editData,
      country: Array.isArray(editData.country) ? editData.country : [editData.country].filter(Boolean),
      program: Array.isArray(editData.program) ? editData.program : [editData.program].filter(Boolean)
    };
    updateLeadMutation.mutate(updateData);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const prevStatus = currentStatus;
      // Optimistic update
      setCurrentStatus(newStatus);
      
      await updateLeadMutation.mutateAsync({ status: newStatus });
    } catch (error) {
      // Revert on error
      setCurrentStatus(currentStatus);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'qualified': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'converted': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'lost': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const countryOptions = [
    { value: 'USA', label: 'United States' },
    { value: 'Canada', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'Netherlands', label: 'Netherlands' },
    { value: 'Sweden', label: 'Sweden' },
    { value: 'Norway', label: 'Norway' },
    { value: 'Denmark', label: 'Denmark' },
    { value: 'Finland', label: 'Finland' },
    { value: 'Switzerland', label: 'Switzerland' },
    { value: 'Austria', label: 'Austria' },
    { value: 'Belgium', label: 'Belgium' },
    { value: 'Ireland', label: 'Ireland' },
    { value: 'New Zealand', label: 'New Zealand' },
    { value: 'Japan', label: 'Japan' },
    { value: 'South Korea', label: 'South Korea' },
    { value: 'Singapore', label: 'Singapore' },
    { value: 'Hong Kong', label: 'Hong Kong' },
  ];

  const programOptions = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Business Administration', label: 'Business Administration' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Medicine', label: 'Medicine' },
    { value: 'Law', label: 'Law' },
    { value: 'Psychology', label: 'Psychology' },
    { value: 'Economics', label: 'Economics' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Biology', label: 'Biology' },
    { value: 'Arts', label: 'Arts' },
    { value: 'Design', label: 'Design' },
    { value: 'Architecture', label: 'Architecture' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
    { value: 'Cybersecurity', label: 'Cybersecurity' },
    { value: 'International Relations', label: 'International Relations' },
    { value: 'Environmental Science', label: 'Environmental Science' },
    { value: 'Journalism', label: 'Journalism' },
  ];

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
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/leads')}
            className="p-1 h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <span>Lead Details - {lead?.name}</span>
            )}
          </div>
        </div>
      }
      subtitle={lead ? `Managing lead: ${lead.email}` : undefined}
      helpText="View and edit lead information, track activities, and convert qualified leads to students."
    >
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Main Content */}
        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Header Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{lead?.name}</h2>
                        <p className="text-sm text-gray-500">{lead?.email}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <Select value={currentStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge className={getStatusBadgeColor(currentStatus)}>
                        {formatStatus(currentStatus)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                {!isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      disabled={isLoading}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConvertModal(true)}
                      disabled={isLoading || currentStatus === 'converted'}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Convert to Student
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMarkAsLostModal(true)}
                      disabled={isLoading || currentStatus === 'lost'}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Mark as Lost
                    </Button>
                  </>
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
            </CardHeader>
          </Card>

          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={isEditing ? (editData.name || '') : (lead?.name || '')}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={isEditing ? (editData.email || '') : (lead?.email || '')}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={isEditing ? (editData.phone || '') : (lead?.phone || '')}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={isEditing ? (editData.source || '') : (lead?.source || '')}
                      onChange={(e) => setEditData({ ...editData, source: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Countries of Interest</Label>
                    <CommandMultiSelect
                      options={countryOptions}
                      value={isEditing ? (editData.country || []) : parseFieldValue(lead?.country)}
                      onChange={(values) => setEditData({ ...editData, country: values })}
                      placeholder="Select countries..."
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Programs of Interest</Label>
                    <CommandMultiSelect
                      options={programOptions}
                      value={isEditing ? (editData.program || []) : parseFieldValue(lead?.program)}
                      onChange={(values) => setEditData({ ...editData, program: values })}
                      placeholder="Select programs..."
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectation">Expectation</Label>
                    <Input
                      id="expectation"
                      value={isEditing ? (editData.expectation || '') : (lead?.expectation || '')}
                      onChange={(e) => setEditData({ ...editData, expectation: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={isEditing ? (editData.type || '') : (lead?.type || '')}
                      onValueChange={(value) => setEditData({ ...editData, type: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="undergraduate">Undergraduate</SelectItem>
                        <SelectItem value="postgraduate">Postgraduate</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="counselor">Assigned Counselor</Label>
                    <Select
                      value={isEditing ? (editData.counselorId || '') : (lead?.counselorId || '')}
                      onValueChange={(value) => setEditData({ ...editData, counselorId: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select counselor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No counselor assigned</SelectItem>
                        {users?.map((user: User) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {lead?.lostReason && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="lostReason">Lost Reason</Label>
                      <Textarea
                        id="lostReason"
                        value={lead.lostReason}
                        disabled
                        className="bg-red-50"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Sidebar */}
        <div className="w-96 bg-gray-50 rounded-lg p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Activity Timeline
          </h3>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ActivityTracker entityType="lead" entityId={params?.id || ''} />
          )}
        </div>
      </div>

      {/* Convert to Student Modal */}
      <ConvertToStudentModal
        open={showConvertModal}
        onOpenChange={setShowConvertModal}
        lead={lead}
        onSuccess={() => {
          setShowConvertModal(false);
          setCurrentStatus('converted');
          queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
        }}
      />

      {/* Mark as Lost Modal */}
      <Dialog open={showMarkAsLostModal} onOpenChange={setShowMarkAsLostModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Lead as Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
