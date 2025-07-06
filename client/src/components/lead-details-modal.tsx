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
      setEditData(lead);
      setCurrentStatus(lead.status);
    }
  }, [lead]);

  const updateLeadMutation = useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const response = await apiRequest('PUT', `/api/leads/${lead?.id}`, data);
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
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
    updateLeadMutation.mutate(editData);
  };

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    updateLeadMutation.mutate({ status: newStatus });
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
          
          {/* Close Button - Top Right Corner */}
          <div className="absolute top-4 right-4 z-20">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full hover:bg-gray-100"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Header with Fixed Position */}
          <div className="absolute top-0 left-0 right-0 bg-white border-b p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{lead.name}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={lead.status === 'qualified' ? 'default' : 'secondary'}>
                  {formatStatus(lead.status)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConvertModal(true)}
                  className="flex items-center gap-2"
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
              </div>
            </div>
          </div>

          <div className="flex h-[90vh]">
            {/* Main Content - Left Side */}
            <div className="flex-1 overflow-y-auto p-6 pt-20">
              <div className="space-y-6">
                {/* Lead Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Lead Information
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
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={editData.country || ''}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, country: value }))}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="program">Program</Label>
                        <Select
                          value={editData.program || ''}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, program: value }))}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programOptions.map((program) => (
                              <SelectItem key={program.value} value={program.value}>
                                {program.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={editData.status || ''}
                          onValueChange={(value) => {
                            setEditData(prev => ({ ...prev, status: value }));
                            setCurrentStatus(value);
                          }}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
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
            <div className="w-80 bg-gray-50 border-l overflow-hidden">
              <div className="p-4 border-b bg-white">
                <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
              </div>
              <div className="overflow-y-auto h-full">
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