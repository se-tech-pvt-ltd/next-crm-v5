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
import { MultiSelect } from './multi-select';
import { type Lead, type User } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatStatus } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Edit, Save, X, UserPlus, Calendar, Users2 } from 'lucide-react';

interface LeadDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

export function LeadDetailsModal({ open, onOpenChange, lead }: LeadDetailsModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  useEffect(() => {
    if (lead) {
      setEditData(lead);
      setCurrentStatus(lead.status);
    }
  }, [lead]);

  const updateLeadMutation = useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const response = await apiRequest('PUT', `/api/leads/${lead?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setIsEditing(false);
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

  // Check if lead is already converted
  const { data: students } = useQuery({
    queryKey: ['/api/students'],
    select: (data: any[]) => data.filter((student: any) => student.leadId === lead?.id),
  });

  // Get counselors for dropdown
  const { data: counselors } = useQuery<User[]>({
    queryKey: ['/api/users'],
    select: (data: User[]) => data.filter(user => user.role === 'counselor')
  });

  const isAlreadyConverted = students && students.length > 0;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest('PUT', `/api/leads/${lead?.id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Success",
        description: "Lead status updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    },
  });

  // Mark as Lost mutation
  const markAsLostMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      const response = await apiRequest('PUT', `/api/leads/${lead?.id}`, { 
        status: 'lost',
        lostReason: reason 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setShowMarkAsLostModal(false);
      setLostReason('');
      toast({
        title: "Success",
        description: "Lead marked as lost.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark lead as lost.",
        variant: "destructive",
      });
    },
  });

  if (!lead) return null;

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

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const handleSave = () => {
    updateLeadMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData(lead);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (status: string) => {
    setCurrentStatus(status);
    updateStatusMutation.mutate(status);
  };

  // Options for dropdowns
  const countryOptions = [
    { label: 'Canada', value: 'canada' },
    { label: 'United States', value: 'usa' },
    { label: 'United Kingdom', value: 'uk' },
    { label: 'Australia', value: 'australia' },
    { label: 'New Zealand', value: 'new-zealand' },
    { label: 'Germany', value: 'germany' },
    { label: 'France', value: 'france' },
    { label: 'Netherlands', value: 'netherlands' },
    { label: 'Sweden', value: 'sweden' },
    { label: 'Denmark', value: 'denmark' },
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-[90vh]">
          {/* Main Content - Left Side */}
          <div className="flex-1 overflow-y-auto p-6">
            <DialogHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <DialogTitle className="text-xl font-semibold">
                    {lead.name}
                  </DialogTitle>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Status dropdown - editable without edit mode */}
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm font-medium">Status:</Label>
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
                  </div>
                  
                  {/* Convert to Student and Mark as Lost buttons */}
                  <div className="flex space-x-2">
                    {!isAlreadyConverted && (
                      <Button size="sm" onClick={() => setShowConvertModal(true)}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Convert to Student
                      </Button>
                    )}
                    {isAlreadyConverted && (
                      <Badge variant="secondary">Already Converted</Badge>
                    )}
                    
                    {/* Mark as Lost button */}
                    {lead.status !== 'lost' && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => setShowMarkAsLostModal(true)}
                      >
                        Mark as Lost
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Lead Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <UserIcon className="w-5 h-5 mr-2" />
                      Lead Information
                    </CardTitle>
                    {/* Edit/Save buttons in header */}
                    <div className="flex space-x-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleSave} disabled={updateLeadMutation.isPending}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Lead
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">{lead.name}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">{lead.email}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">{lead.phone}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="source">Source</Label>
                      {isEditing ? (
                        <Select value={editData.source || ''} onValueChange={(value) => handleInputChange('source', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {sourceOptions.find(opt => opt.value === lead.source)?.label || lead.source || 'N/A'}
                        </div>
                      )}
                    </div>
                    
                    {/* Multi-select for Target Countries */}
                    <div>
                      <Label>Target Countries</Label>
                      {isEditing ? (
                        <MultiSelect
                          options={countryOptions}
                          value={Array.isArray(editData.country) ? editData.country : (editData.country ? [editData.country] : [])}
                          onChange={(value) => handleInputChange('country', value)}
                          placeholder="Select countries..."
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {Array.isArray(lead.country) 
                            ? lead.country.map(c => countryOptions.find(opt => opt.value === c)?.label || c).join(', ')
                            : (lead.country ? countryOptions.find(opt => opt.value === lead.country)?.label || lead.country : 'N/A')
                          }
                        </div>
                      )}
                    </div>

                    {/* Multi-select for Program Interests */}
                    <div>
                      <Label>Program Interests</Label>
                      {isEditing ? (
                        <MultiSelect
                          options={programOptions}
                          value={Array.isArray(editData.program) ? editData.program : (editData.program ? [editData.program] : [])}
                          onChange={(value) => handleInputChange('program', value)}
                          placeholder="Select programs..."
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {Array.isArray(lead.program) 
                            ? lead.program.map(p => programOptions.find(opt => opt.value === p)?.label || p).join(', ')
                            : (lead.program ? programOptions.find(opt => opt.value === lead.program)?.label || lead.program : 'N/A')
                          }
                        </div>
                      )}
                    </div>

                    {/* New Expectation field */}
                    <div>
                      <Label htmlFor="expectation">Expectation</Label>
                      {isEditing ? (
                        <Select value={editData.expectation || ''} onValueChange={(value) => handleInputChange('expectation', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expectation..." />
                          </SelectTrigger>
                          <SelectContent>
                            {expectationOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {lead.expectation ? expectationOptions.find(opt => opt.value === lead.expectation)?.label || lead.expectation : 'N/A'}
                        </div>
                      )}
                    </div>

                    {/* New Type field */}
                    <div>
                      <Label htmlFor="type">Type</Label>
                      {isEditing ? (
                        <Select value={editData.type || ''} onValueChange={(value) => handleInputChange('type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {typeOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {lead.type ? typeOptions.find(opt => opt.value === lead.type)?.label || lead.type : 'N/A'}
                        </div>
                      )}
                    </div>

                    {/* New Counselor field */}
                    <div>
                      <Label htmlFor="counselor">Counselor</Label>
                      {isEditing ? (
                        <Select value={editData.counselorId || ''} onValueChange={(value) => handleInputChange('counselorId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select counselor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {counselors?.map(counselor => (
                              <SelectItem key={counselor.id} value={counselor.id}>
                                {counselor.firstName && counselor.lastName 
                                  ? `${counselor.firstName} ${counselor.lastName}` 
                                  : counselor.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {lead.counselorId 
                            ? counselors?.find(c => c.id === lead.counselorId)?.firstName && counselors?.find(c => c.id === lead.counselorId)?.lastName
                              ? `${counselors.find(c => c.id === lead.counselorId)?.firstName} ${counselors.find(c => c.id === lead.counselorId)?.lastName}`
                              : counselors?.find(c => c.id === lead.counselorId)?.email || 'Unknown'
                            : 'N/A'
                          }
                        </div>
                      )}
                    </div>
                  </div>



                  {/* Date fields at the bottom */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(lead.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Last Updated: {formatDate(lead.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* No action buttons at the bottom - Close removed, Convert moved to top */}
            </div>
          </div>

          {/* Activity Sidebar - Right Side - Increased width */}
          <div className="w-96 border-l bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <ActivityTracker
                entityType="lead"
                entityId={lead.id}
                entityName={lead.name}
              />
            </div>
          </div>
        </div>
        
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
      </DialogContent>
    </Dialog>
  );
}