import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityTracker } from './activity-tracker';
import { HelpTooltip } from './help-tooltip';
import { ConvertToStudentModal } from './convert-to-student-modal';
import { type Lead } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User, Edit, Save, X, UserPlus } from 'lucide-react';

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

  useEffect(() => {
    if (lead) {
      setEditData(lead);
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

  const isAlreadyConverted = students && students.length > 0;

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

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-[90vh]">
          {/* Main Content - Left Side */}
          <div className="flex-1 overflow-y-auto p-6">
            <DialogHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DialogTitle className="text-xl font-semibold">
                    {lead.name}
                  </DialogTitle>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Convert to Student button in top right */}
                  {!isAlreadyConverted && (
                    <Button size="sm" onClick={() => setShowConvertModal(true)}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Convert to Student
                    </Button>
                  )}
                  {isAlreadyConverted && (
                    <Badge variant="secondary">Already Converted</Badge>
                  )}
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
                  <HelpTooltip content="Detailed view of lead information. Track progress and convert to students when qualified." />
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Lead Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="w-5 h-5 mr-2" />
                    Lead Information
                  </CardTitle>
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
                      <Label htmlFor="country">Target Country</Label>
                      {isEditing ? (
                        <Input
                          id="country"
                          value={editData.country || ''}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">{lead.country}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="program">Program Interest</Label>
                      {isEditing ? (
                        <Input
                          id="program"
                          value={editData.program || ''}
                          onChange={(e) => handleInputChange('program', e.target.value)}
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">{lead.program}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="source">Lead Source</Label>
                      {isEditing ? (
                        <Select value={editData.source || ''} onValueChange={(value) => handleInputChange('source', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="education_fair">Education Fair</SelectItem>
                            <SelectItem value="partner_agent">Partner Agent</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">{lead.source}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      {isEditing ? (
                        <Select value={editData.status || ''} onValueChange={(value) => handleInputChange('status', value)}>
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
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Created Date</Label>
                      <div className="p-2 bg-gray-50 rounded border">{formatDate(lead.createdAt)}</div>
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
      </DialogContent>
    </Dialog>
  );
}