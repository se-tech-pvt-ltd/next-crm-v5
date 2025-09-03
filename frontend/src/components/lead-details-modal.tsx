import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as DropdownsService from '@/services/dropdowns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ActivityTracker } from './activity-tracker';
import { StabilizedResizeObserver } from '@/lib/resize-observer-polyfill';
import { CollapsibleCard } from '@/components/collapsible-card';
import { HelpTooltip } from './help-tooltip';
import { ConvertToStudentModal } from './convert-to-student-modal';
import { CommandMultiSelect } from './command-multi-select';
import { type Lead, type User } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import * as LeadsService from '@/services/leads';
import * as UsersService from '@/services/users';
import { formatStatus } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Edit, Save, X, UserPlus, Calendar, Users2, Users, XCircle, Mail, Phone, MapPin, Target, GraduationCap, Globe, BookOpen } from 'lucide-react';

interface LeadDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onLeadUpdate?: (updatedLead: Lead) => void;
}

export function LeadDetailsModal({ open, onOpenChange, lead, onLeadUpdate }: LeadDetailsModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const update = () => setHeaderHeight(headerRef.current?.offsetHeight || 0);
    update();
    const ro = new StabilizedResizeObserver(() => update(), 100);
    if (headerRef.current) ro.observe(headerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
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
    mutationFn: async (data: Partial<Lead>) => LeadsService.updateLead(lead?.id, data),
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
    mutationFn: async ({ reason }: { reason: string }) => LeadsService.markLeadAsLost(lead?.id, reason),
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
    queryFn: async () => UsersService.getUsers(),
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

  // Dropdowns for status mapping like the page
  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Leads')
  });

  const getStatusDisplayName = (statusId: string) => {
    const list: any[] = (dropdownData as any)?.Status || [];
    const byId = list.find((o: any) => o.id === statusId);
    if (byId?.value) return byId.value;
    const byKey = list.find((o: any) => o.key === statusId);
    if (byKey?.value) return byKey.value;
    const byValue = list.find((o: any) => o.value === statusId);
    if (byValue?.value) return byValue.value;
    return statusId;
  };

  const statusSequence = useMemo<string[]>(() => {
    const list: any[] = (dropdownData as any)?.Status || [];
    if (!Array.isArray(list) || list.length === 0) return [];
    return list.map((o: any) => o.key || o.id || o.value).filter(Boolean);
  }, [dropdownData]);

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => LeadsService.updateLead(lead?.id, { status }),
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      onLeadUpdate?.(updatedLead);
      toast({
        title: 'Status updated',
        description: `Lead status set to ${getStatusDisplayName(updatedLead.status)}`,
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
        <DialogContent className="max-w-[95vw] h-[95vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">Lead Details</DialogTitle>

          {/* Header matching page style */}
          <div ref={headerRef} className="absolute top-0 left-0 right-0 bg-white border-b p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-bold">{lead.name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  className="rounded-full px-2 [&_svg]:size-3"
                  onClick={() => setIsEditing(true)}
                  disabled={false}
                  title="Edit"
                >
                  <Edit />
                  <span className="hidden lg:inline">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="rounded-full px-2 [&_svg]:size-3"
                  onClick={() => setShowConvertModal(true)}
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
                  title="Mark as Lost"
                >
                  <XCircle />
                  <span className="hidden lg:inline">Lost</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-8 h-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Status progress bar from page */}
            {statusSequence.length > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-100 rounded-md p-1.5">
                  <div className="flex items-center justify-between relative">
                    {statusSequence.map((statusId, index) => {
                      const isActive = (currentStatus === statusId);
                      const currentIndex = statusSequence.indexOf(currentStatus);
                      const isCompleted = index <= currentIndex;
                      const statusName = getStatusDisplayName(statusId);

                      const handleClick = () => {
                        if (statusUpdateMutation.isPending) return;
                        const targetKey = statusId;
                        if (currentStatus === targetKey) return;
                        statusUpdateMutation.mutate(targetKey);
                      };

                      return (
                        <div
                          key={statusId}
                          className="flex flex-col items-center relative flex-1 cursor-pointer select-none"
                          onClick={handleClick}
                          role="button"
                          aria-label={`Set status to ${statusName}`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'
                          }`}>
                            {isCompleted && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            {!isCompleted && <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                          </div>
                          <span className={`mt-1 text-xs font-medium text-center ${
                            isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                          }`}>
                            {statusName}
                          </span>
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
              </div>
            )}
          </div>

          <div className="flex h-[90vh]">
            {/* Main Content - Left Side */}
            <div className="flex-1 overflow-y-auto p-4" style={{ paddingTop: headerHeight }}>
              <div className="space-y-4">
                {/* Personal Information (matching page) */}
                <Card className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Personal Information</CardTitle>
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={handleSaveChanges}>
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
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center space-x-2">
                          <UserIcon className="w-4 h-4" />
                          <span>Full Name</span>
                        </Label>
                        <Input id="name" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Email Address</span>
                        </Label>
                        <Input id="email" type="email" value={editData.email || ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Phone Number</span>
                        </Label>
                        <Input id="phone" type="tel" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>City</span>
                        </Label>
                        <Input id="city" value={editData.city || ''} onChange={(e) => setEditData({ ...editData, city: e.target.value })} disabled={!isEditing} className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lead Information section matching page */}
                <CollapsibleCard
                  persistKey={`lead-details:modal:${lead.id}:lead-information`}
                  header={<CardTitle className="text-sm flex items-center space-x-2"><Target className="w-5 h-5 text-primary" /><span>Lead Information</span></CardTitle>}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Lead Type</span>
                      </Label>
                      <Select value={editData.type || ''} onValueChange={(value) => setEditData({ ...editData, type: value })} disabled={!isEditing}>
                        <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* map from dropdownData if available */}
                          {((dropdownData as any)?.Type || []).map((option: any) => (
                            <SelectItem key={option.key} value={option.key}>{option.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Lead Source</span>
                      </Label>
                      <Select value={editData.source || ''} onValueChange={(value) => setEditData({ ...editData, source: value })} disabled={!isEditing}>
                        <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {((dropdownData as any)?.Source || []).map((option: any) => (
                            <SelectItem key={option.key} value={option.key}>{option.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>Study Level</span>
                      </Label>
                      <Select value={(editData as any).studyLevel || ''} onValueChange={(value) => setEditData({ ...editData, studyLevel: value })} disabled={!isEditing}>
                        <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select study level" />
                        </SelectTrigger>
                        <SelectContent>
                          {((dropdownData as any)?.['Study Level'] || []).map((option: any) => (
                            <SelectItem key={option.key} value={option.key}>{option.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Study Plan</span>
                      </Label>
                      <Select value={(editData as any).studyPlan || ''} onValueChange={(value) => setEditData({ ...editData, studyPlan: value })} disabled={!isEditing}>
                        <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select study plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {((dropdownData as any)?.['Study Plan'] || []).map((option: any) => (
                            <SelectItem key={option.key} value={option.key}>{option.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Interested Countries</span>
                      </Label>
                      <CommandMultiSelect
                        options={((dropdownData as any)?.['Interested Country'] || []).map((o: any) => ({ label: o.value, value: o.key }))}
                        value={Array.isArray(editData.country) ? editData.country : (editData.country ? [editData.country] : [])}
                        onChange={(values) => setEditData(prev => ({ ...prev, country: values }))}
                        placeholder="Select countries"
                        searchPlaceholder="Search countries..."
                        className={!isEditing ? 'pointer-events-none opacity-50' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Admission Officer</span>
                      </Label>
                      <Select value={editData.counselorId || ''} onValueChange={(value) => setEditData({ ...editData, counselorId: value })} disabled={!isEditing}>
                        <SelectTrigger className="h-8 text-xs transition-all focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select officer" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleCard>
              </div>
            </div>

            {/* Right Sidebar - Activity Timeline (match colors) */}
            <div className="w-96 bg-white border-l overflow-hidden">
              <div className="px-4 py-3 border-b bg-white">
                <h2 className="text-sm font-semibold">Activity Timeline</h2>
              </div>
              <div className="overflow-y-auto h-full pt-2">
                <ActivityTracker entityType="lead" entityId={lead.id} entityName={lead.name} />
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
