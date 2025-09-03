import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ActivityTracker } from './activity-tracker';
import { HelpTooltip } from './help-tooltip';
import { ConvertToStudentModal } from './convert-to-student-modal';
import { CommandMultiSelect } from './command-multi-select';
import { type Lead, type User } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatStatus } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Edit, Save, X, UserPlus, Calendar, Users2, XCircle } from 'lucide-react';

interface LeadDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onLeadUpdate?: (updatedLead: Lead) => void;
}

export function LeadDetailsModal({ open, onOpenChange, lead, onLeadUpdate }: LeadDetailsModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

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
      const response = await apiRequest('PUT', `/api/leads/${lead?.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update lead');
      }
      return response.json();
    },
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setIsEditing(false);
      onLeadUpdate?.(updatedLead);
      toast({
        title: "Success",
        description: "Lead updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Update lead error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const markAsLostMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      const response = await apiRequest('PUT', `/api/leads/${lead?.id}`, {
        status: 'lost',
        lostReason: reason
      });
      return response.json();
    },
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setShowMarkAsLostModal(false);
      setLostReason('');
      onLeadUpdate?.(updatedLead);
      toast({
        title: "Success",
        description: "Lead marked as lost.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark lead as lost. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return response.json();
    },
  });

  const handleSaveChanges = () => {
    if (!editData.name || !editData.email) {
      toast({
        title: "Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }
    
    // Convert arrays to JSON strings for backend storage
    const dataToSave = {
      ...editData,
      country: Array.isArray(editData.country) ? JSON.stringify(editData.country) : editData.country,
      program: Array.isArray(editData.program) ? JSON.stringify(editData.program) : editData.program
    };
    
    updateLeadMutation.mutate(dataToSave);
  };

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest('PUT', `/api/leads/${lead?.id}`, { status });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      onLeadUpdate?.(updatedLead);
      toast({
        title: "Success",
        description: "Lead status updated successfully.",
      });
    },
    onError: (error: any) => {
      // Revert the status change on error
      setCurrentStatus(lead?.status || '');
      toast({
        title: "Error",
        description: error.message || "Failed to update lead status.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    statusUpdateMutation.mutate(newStatus);
  };

  if (!lead) return null;

  const countryOptions = [
    { label: 'Canada', value: 'canada' },
    { label: 'United States', value: 'usa' },
    { label: 'United Kingdom', value: 'uk' },
    { label: 'Australia', value: 'australia' },
    { label: 'New Zealand', value: 'new-zealand' },
    { label: 'Germany', value: 'germany' },
    { label: 'France', value: 'france' },
    { label: 'Netherlands', value: 'netherlands' },
  ];

  const programOptions = [
    { label: 'Business Administration', value: 'business-admin' },
    { label: 'Computer Science', value: 'computer-science' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Medicine', value: 'medicine' },
    { label: 'Law', value: 'law' },
    { label: 'Arts & Humanities', value: 'arts-humanities' },
    { label: 'Social Sciences', value: 'social-sciences' },
    { label: 'Natural Sciences', value: 'natural-sciences' },
    { label: 'Education', value: 'education' },
    { label: 'Psychology', value: 'psychology' },
  ];

  const expectationOptions = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  const typeOptions = [
    { label: 'Undergraduate', value: 'undergraduate' },
    { label: 'Graduate', value: 'graduate' },
    { label: 'Postgraduate', value: 'postgraduate' },
    { label: 'PhD', value: 'phd' },
    { label: 'Certificate', value: 'certificate' },
    { label: 'Diploma', value: 'diploma' },
  ];

  const sourceOptions = [
    { label: 'Website', value: 'website' },
    { label: 'Referral', value: 'referral' },
    { label: 'Social Media', value: 'social_media' },
    { label: 'Education Fair', value: 'education_fair' },
    { label: 'Partner Agent', value: 'partner_agent' },
  ];

  const lostReasonOptions = [
    { label: 'No Response', value: 'no_response' },
    { label: 'Not Interested', value: 'not_interested' },
    { label: 'Budget Constraints', value: 'budget_constraints' },
    { label: 'Timing Issues', value: 'timing_issues' },
    { label: 'Chose Competitor', value: 'chose_competitor' },
    { label: 'Unqualified', value: 'unqualified' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Lead Details</DialogTitle>
          
          {/* Header with Fixed Position */}
          <div className="absolute top-0 left-0 right-0 bg-white border-b p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{lead.name}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <Label htmlFor="header-status" className="text-xs text-gray-500">Status</Label>
                  <Select
                    value={currentStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-32 h-8">
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
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowConvertModal(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="w-4 h-4" />
                  Convert to Student
                </Button>
                {lead.status !== 'lost' && (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setShowMarkAsLostModal(true)}
                  >
                    Mark as Lost
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="default"
                  className="w-10 h-10 p-0 rounded-full bg-black hover:bg-gray-800 text-white ml-2"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            

          </div>

          <div className="flex h-[90vh]">
            {/* Main Content - Left Side */}
            <div className="flex-1 overflow-y-auto p-6 pt-28">
              <div className="space-y-6">
                {/* Lead Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Lead Information</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editData.name || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={editData.email || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editData.phone || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="country">Countries of Interest</Label>
                        <CommandMultiSelect
                          options={countryOptions}
                          value={Array.isArray(editData.country) ? editData.country : (editData.country ? [editData.country] : [])}
                          onChange={(values) => setEditData(prev => ({ ...prev, country: values }))}
                          placeholder="Select countries..."
                          searchPlaceholder="Search countries..."
                          className={!isEditing ? "pointer-events-none opacity-50" : ""}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="program">Programs of Interest</Label>
                        <CommandMultiSelect
                          options={programOptions}
                          value={Array.isArray(editData.program) ? editData.program : (editData.program ? [editData.program] : [])}
                          onChange={(values) => setEditData(prev => ({ ...prev, program: values }))}
                          placeholder="Select programs..."
                          searchPlaceholder="Search programs..."
                          className={!isEditing ? "pointer-events-none opacity-50" : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="source">Source</Label>
                        <Select
                          value={editData.source || ''}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, source: value }))}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceOptions.map((source) => (
                              <SelectItem key={source.value} value={source.value}>
                                {source.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expectation">
                          Expectation
                          <HelpTooltip content="How likely is this lead to convert to a student?" />
                        </Label>
                        <Select
                          value={editData.expectation || ''}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, expectation: value }))}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select expectation" />
                          </SelectTrigger>
                          <SelectContent>
                            {expectationOptions.map((expectation) => (
                              <SelectItem key={expectation.value} value={expectation.value}>
                                {expectation.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={editData.type || ''}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, type: value }))}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {typeOptions.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="counselor">Counselor</Label>
                        <Select
                          value={editData.counselorId || ''}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, counselorId: value }))}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select counselor" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {currentStatus === 'lost' && (
                        <div>
                          <Label htmlFor="lostReason">Lost Reason</Label>
                          <Select
                            value={editData.lostReason || ''}
                            onValueChange={(value) => setEditData(prev => ({ ...prev, lostReason: value }))}
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select lost reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {lostReasonOptions.map((reason) => (
                                <SelectItem key={reason.value} value={reason.value}>
                                  {reason.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveChanges}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Sidebar - Activity Timeline */}
            <div className="w-96 bg-gradient-to-br from-blue-50 to-blue-100 border-l overflow-hidden">
              <div className="px-4 py-5 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <h2 className="text-lg font-semibold">Activity Timeline</h2>
              </div>
              <div className="overflow-y-auto h-full pt-2">
                <ActivityTracker
                  entityType="lead"
                  entityId={lead.id}
                  entityName={lead.name}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Student Modal */}
      <ConvertToStudentModal
        open={showConvertModal}
        onOpenChange={setShowConvertModal}
        lead={lead}
      />

      {/* Mark as Lost Modal */}
      <Dialog open={showMarkAsLostModal} onOpenChange={setShowMarkAsLostModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Lead as Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please select a reason why this lead is being marked as lost:
            </p>
            <Select value={lostReason} onValueChange={setLostReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {lostReasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMarkAsLostModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => markAsLostMutation.mutate({ reason: lostReason })}
                disabled={!lostReason || markAsLostMutation.isPending}
              >
                Mark as Lost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
