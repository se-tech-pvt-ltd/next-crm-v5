import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
console.log('[modal] loaded: frontend/src/components/lead-details-modal.tsx');
import * as DropdownsService from '@/services/dropdowns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityTracker } from './activity-tracker';
import { CollapsibleCard } from '@/components/collapsible-card';
import { CommandMultiSelect } from './command-multi-select';
import { type Lead } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import * as LeadsService from '@/services/leads';
import * as UsersService from '@/services/users';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, X, Mail, Phone, MapPin, Target, GraduationCap, Globe, BookOpen, Users, Edit, UserPlus, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onLeadUpdate?: (updatedLead: Lead) => void;
  onOpenConvert?: (lead: Lead | null) => void;
  startInEdit?: boolean;
}

export function LeadDetailsModal({ open, onOpenChange, lead, onLeadUpdate, onOpenConvert, startInEdit }: LeadDetailsModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  useEffect(() => {
    if (lead) {
      const processedLead = {
        ...lead,
        country: parseFieldValue(lead.country),
        program: parseFieldValue(lead.program)
      };
      setEditData(processedLead);
      setCurrentStatus(lead.status);
    }
  }, [lead]);

  useEffect(() => {
    if (open && startInEdit) {
      setIsEditing(true);
    }
  }, [open, startInEdit]);

  const parseFieldValue = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && !value.startsWith('[')) return [value];
    if (typeof value === 'string' && value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => {
            if (typeof item === 'string' && item.startsWith('[')) {
              try {
                const nestedParsed = JSON.parse(item);
                return Array.isArray(nestedParsed) ? nestedParsed[0] || '' : item;
              } catch {
                return item;
              }
            }
            return item;
          }).filter(Boolean);
        }
        return [value];
      } catch {
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
      toast({ title: 'Success', description: 'Lead updated successfully.' });
    },
    onError: (error: any) => {
      console.error('Update lead error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update lead. Please try again.', variant: 'destructive' });
    },
  });

  const markAsLostMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => LeadsService.markLeadAsLost(lead?.id, reason),
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setShowMarkAsLostModal(false);
      setLostReason('');
      onLeadUpdate?.(updatedLead);
      toast({ title: 'Success', description: 'Lead marked as lost.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to mark lead as lost. Please try again.', variant: 'destructive' });
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => UsersService.getUsers(),
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['/api/regions'],
    queryFn: async () => RegionsService.listRegions(),
    staleTime: 60_000,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: async () => BranchesService.listBranches(),
    staleTime: 60_000,
  });

  // Check if the lead has been converted to a student
  const { data: convertedStudent, isLoading: convertedLoading } = useQuery({
    queryKey: ['/api/students/by-lead', lead?.id],
    queryFn: async () => LeadsService.getStudentByLeadId(lead?.id),
    enabled: !!lead?.id,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (convertedStudent && isEditing) setIsEditing(false);
  }, [convertedStudent]);

  const handleSaveChanges = () => {
    if (!editData.name || !editData.email) {
      toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    const dataToSave = {
      ...editData,
      country: Array.isArray(editData.country) ? JSON.stringify(editData.country) : editData.country,
      program: Array.isArray(editData.program) ? JSON.stringify(editData.program) : editData.program,
    };
    updateLeadMutation.mutate(dataToSave);
  };

  const { data: dropdownData } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Leads'),
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
      toast({ title: 'Status updated', description: `Lead status set to ${getStatusDisplayName(updatedLead.status)}` });
    },
    onError: (error: any) => {
      setCurrentStatus(lead?.status || '');
      toast({ title: 'Error', description: error.message || 'Failed to update lead status.', variant: 'destructive' });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    statusUpdateMutation.mutate(newStatus);
  };

  if (!lead) return null;

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
        <DialogContent hideClose className="no-not-allowed max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl">
          <DialogTitle className="sr-only">Lead Details</DialogTitle>

          {/* Full-width top header */}
          <div className="sticky top-0 z-30 px-4 py-3 bg-[#223E7D] text-white flex items-center justify-between w-full rounded-t-xl">
            <div>
              <div className="text-base sm:text-lg font-semibold leading-tight truncate max-w-[75vw]">{lead.name || 'Lead'}</div>
            </div>
            <div className="flex items-center gap-2">
              {convertedLoading ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-24 bg-white/20" />
                  <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
                </div>
              ) : (
                <>
                  {convertedStudent ? (
                    <Button
                      variant="outline"
                      size="xs"
                      className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                      onClick={() => { onOpenChange(false); setLocation(`/students?studentId=${convertedStudent.id}`); }}
                      title="View Student"
                    >
                      View Student
                    </Button>
                  ) : (
                    <>
                      {!isEditing && (
                        <>
                          <Button
                            variant="outline"
                            size="xs"
                            className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                            onClick={() => {
                              try { onOpenChange(false); } catch {}
                              if (typeof onOpenConvert === 'function') onOpenConvert(lead); else setLocation(`/leads/${lead?.id}/student`);
                            }}
                            title="Convert to Student"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Convert to Student
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                            onClick={() => { setIsEditing(true); try { setLocation(`/leads/${lead?.id}/edit`); } catch {} }}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                            onClick={() => setShowMarkAsLostModal(true)}
                            title="Mark as Lost"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Lost
                          </Button>
                        </>
                      )}
                      {isEditing && (
                        <>
                          <Button
                            size="xs"
                            className="bg-[#0071B0] hover:bg-[#00649D] text-white"
                            onClick={handleSaveChanges}
                            title="Save"
                            disabled={updateLeadMutation.isPending}
                          >
                            {updateLeadMutation.isPending ? 'Saving…' : 'Save'}
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            className="bg-white text-[#223E7D] hover:bg-white/90 border border-white"
                            onClick={() => { setIsEditing(false); setEditData(lead); try { setLocation(`/leads/${lead?.id}`); } catch {} }}
                            title="Cancel"
                            disabled={updateLeadMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 bg-white text-[#223E7D] hover:bg-white/90" onClick={() => onOpenChange(false)} title="Close">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Full-width status bar */}
          <div className="px-4 pt-0 pb-2 bg-[#223E7D] text-white border-t border-white/20 -mt-3">
            {statusSequence.length > 0 && (
              <div className="w-full bg-gray-100 rounded-md p-1">
                <div className="flex items-center justify-between relative">
                  {statusSequence.map((statusId, index) => {
                    const currentIndex = statusSequence.indexOf(currentStatus);
                    const isCompleted = index <= currentIndex;
                    const statusName = getStatusDisplayName(statusId);
                    const handleClick = () => {
                      if (statusUpdateMutation.isPending) return;
                      if (currentStatus === statusId) return;
                      statusUpdateMutation.mutate(statusId);
                    };
                    return (
                      <div key={statusId} className="flex flex-col items-center relative flex-1 cursor-pointer select-none" onClick={handleClick} role="button" aria-label={`Set status to ${statusName}`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'}`}></div>
                        <span className={`mt-1 text-[11px] font-medium text-center ${isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>{statusName}</span>
                        {index < statusSequence.length - 1 && (
                          <div className={`absolute top-2 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[1fr_420px] h-[calc(90vh-92px)] min-h-0">
            {/* Left: Content */}
            <div className="flex flex-col min-h-0">
              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                <Card className="w-full shadow-md border border-gray-200 bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>Personal Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Full Name</span></Label>
                        <Input id="name" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} disabled={!isEditing || updateLeadMutation.isPending} className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center space-x-2"><Mail className="w-4 h-4" /><span>Email Address</span></Label>
                        <Input id="email" type="email" value={editData.email || ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} disabled={!isEditing || updateLeadMutation.isPending} className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center space-x-2"><Phone className="w-4 h-4" /><span>Phone Number</span></Label>
                        <Input id="phone" type="tel" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} disabled={!isEditing || updateLeadMutation.isPending} className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>City</span></Label>
                        <Input id="city" value={editData.city || ''} onChange={(e) => setEditData({ ...editData, city: e.target.value })} disabled={!isEditing || updateLeadMutation.isPending} className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <CollapsibleCard persistKey={`lead-details:modal:${lead.id}:lead-information`} header={<CardTitle className="flex items-center space-x-2"><Target className="w-4 h-4 text-primary" /><span>Lead Information</span></CardTitle>} cardClassName="shadow-md border border-gray-200 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><Users className="w-4 h-4" /><span>Lead Type</span></Label>
                      <Select value={editData.type || ''} onValueChange={(value) => setEditData({ ...editData, type: value })} disabled={!isEditing || updateLeadMutation.isPending}>
                        <SelectTrigger className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {((dropdownData as any)?.Type || []).map((option: any) => (
                            <SelectItem key={option.key} value={option.key}>{option.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><Globe className="w-4 h-4" /><span>Lead Source</span></Label>
                      <Select value={editData.source || ''} onValueChange={(value) => setEditData({ ...editData, source: value })} disabled={!isEditing || updateLeadMutation.isPending}>
                        <SelectTrigger className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white"><SelectValue placeholder="Select source" /></SelectTrigger>
                        <SelectContent>
                          {((dropdownData as any)?.Source || []).map((option: any) => (
                            <SelectItem key={option.key} value={option.key}>{option.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><GraduationCap className="w-4 h-4" /><span>Study Level</span></Label>
                      <Select value={(editData as any).studyLevel || ''} onValueChange={(value) => setEditData({ ...editData, studyLevel: value })} disabled={!isEditing || updateLeadMutation.isPending}>
                        <SelectTrigger className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white"><SelectValue placeholder="Select study level" /></SelectTrigger>
                        <SelectContent>
                          {((dropdownData as any)?.['Study Level'] || []).map((option: any) => (
                            <SelectItem key={option.key} value={option.key}>{option.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Study Plan</span></Label>
                      <Select value={(editData as any).studyPlan || ''} onValueChange={(value) => setEditData({ ...editData, studyPlan: value })} disabled={!isEditing || updateLeadMutation.isPending}>
                        <SelectTrigger className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white"><SelectValue placeholder="Select study plan" /></SelectTrigger>
                        <SelectContent>
                          {((dropdownData as any)?.['Study Plan'] || []).map((option: any) => (
                            <SelectItem key={option.key} value={option.key}>{option.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center space-x-2"><Globe className="w-4 h-4" /><span>Interested Countries</span></Label>
                      <CommandMultiSelect
                        options={((dropdownData as any)?.['Interested Country'] || []).map((o: any) => ({ label: o.value, value: o.key }))}
                        value={Array.isArray(editData.country) ? editData.country : (editData.country ? [editData.country] : [])}
                        onChange={(values) => setEditData(prev => ({ ...prev, country: values }))}
                        placeholder="Select countries"
                        searchPlaceholder="Search countries..."
                        className={!isEditing || updateLeadMutation.isPending ? 'pointer-events-none opacity-50' : ''}
                      />
                    </div>

                  </div>
                </CollapsibleCard>

                <CollapsibleCard persistKey={`lead-details:modal:${lead.id}:lead-access`} header={<CardTitle className="flex items-center space-x-2"><Users className="w-4 h-4 text-primary" /><span>Lead Access</span></CardTitle>} cardClassName="shadow-md border border-gray-200 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Region</span></Label>
                      <div className="text-xs px-2 py-1.5 rounded border bg-white">
                        {(() => {
                          const regionId = (lead as any).regionId || (editData as any).regionId;
                          const r = Array.isArray(regions) ? regions.find((x: any) => String(x.id) === String(regionId)) : null;
                          if (!r) return '—';
                          const regionName = r.regionName || r.name || r.id;
                          const head = Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(r.regionHeadId || '')) : null;
                          const headName = head ? ([head.firstName || head.first_name, head.lastName || head.last_name].filter(Boolean).join(' ').trim() || head.email || head.id) : '';
                          const headEmail = head?.email || '';
                          return (
                            <div>
                              <div className="font-medium text-xs">{`${regionName}${headName ? ` - Head: ${headName}` : ''}`}</div>
                              {headEmail ? <div className="text-[11px] text-muted-foreground">{headEmail}</div> : null}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Branch</span></Label>
                      <div className="text-xs px-2 py-1.5 rounded border bg-white">
                        {(() => {
                          const branchId = (lead as any).branchId || (editData as any).branchId;
                          const b = Array.isArray(branches) ? branches.find((x: any) => String(x.id) === String(branchId)) : null;
                          if (!b) return '—';
                          const branchName = b.branchName || b.name || b.code || b.id;
                          const headId = b.branchHeadId || b.managerId || null;
                          const head = headId && Array.isArray(users) ? (users as any[]).find((u: any) => String(u.id) === String(headId)) : null;
                          const headName = head ? ([head.firstName || head.first_name, head.lastName || head.last_name].filter(Boolean).join(' ').trim() || head.email || head.id) : '';
                          const headEmail = head?.email || '';
                          return (
                            <div>
                              <div className="font-medium text-xs">{`${branchName}${headName ? ` - Head: ${headName}` : ''}`}</div>
                              {headEmail ? <div className="text-[11px] text-muted-foreground">{headEmail}</div> : null}
                            </div>
                          );
                        })()}
                      </div>
                    </div>


                    <div className="space-y-1.5">
                      <Label className="flex items-center space-x-2"><Users className="w-4 h-4" /><span>Admission Officer</span></Label>
                      <div className="text-xs px-2 py-1.5 rounded border bg-white">
                        {(() => {
                          const norm = (v: string) => String(v || '').toLowerCase().replace(/\s+/g,'_').replace(/-+/g,'_');
                          const branchId = (lead as any).branchId || (editData as any).branchId;
                          const officer = Array.isArray(users)
                            ? users.find((u: any) => (String(u.branchId || '') === String(branchId)) && norm(u.role) === 'admission_officer')
                            : null;
                          if (!officer) return '—';
                          const fullName = [officer.firstName || officer.first_name, officer.lastName || officer.last_name].filter(Boolean).join(' ').trim();
                          const email = officer.email || '';
                          return (
                            <div>
                              <div className="font-medium text-xs">{fullName || email || officer.id}</div>
                              {email ? <div className="text-[11px] text-muted-foreground">{email}</div> : null}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center space-x-2"><UserIcon className="w-4 h-4" /><span>Counselor</span></Label>
                      <div className="text-xs px-2 py-1.5 rounded border bg-white">
                        {(() => {
                          const cid = (lead as any).counselorId || (editData as any).counselorId;
                          const c = Array.isArray(users) ? users.find((u: any) => String(u.id) === String(cid)) : null;
                          if (!c) return '—';
                          const fullName = [c.firstName || c.first_name, c.lastName || c.last_name].filter(Boolean).join(' ').trim();
                          const email = c.email || '';
                          return (
                            <div>
                              <div className="font-medium text-xs">{fullName || email || c.id}</div>
                              {email ? <div className="text-[11px] text-muted-foreground">{email}</div> : null}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </CollapsibleCard>
              </div>
            </div>

            {/* Right: Timeline */}
            <div className="border-l bg-white flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0">
                <ActivityTracker entityType="lead" entityId={lead.id} entityName={lead.name} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMarkAsLostModal} onOpenChange={setShowMarkAsLostModal}>
        <DialogContent className="max-w-md">
          <DialogTitle>Mark Lead as Lost</DialogTitle>
          <div className="space-y-4">
            <p className="text-xs text-gray-600">Please select a reason why this lead is being marked as lost:</p>
            <Select value={lostReason} onValueChange={setLostReason}>
              <SelectTrigger className="shadow-sm border border-gray-300 bg-white">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {lostReasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMarkAsLostModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => markAsLostMutation.mutate({ reason: lostReason })} disabled={!lostReason || markAsLostMutation.isPending}>Mark as Lost</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
