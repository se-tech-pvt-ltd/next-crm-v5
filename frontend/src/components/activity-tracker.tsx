import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTooltip } from "./help-tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { MessageSquare, Activity as ActivityIcon, Plus, User as UserIcon, Calendar as CalendarIcon, Clock, Info, Upload, Bot, Check, Edit, UserPlus, FileText, Award, Settings, AlertCircle, Users } from "lucide-react";
import { Activity, User as UserType } from "@/lib/types";
import * as DropdownsService from "@/services/dropdowns";
import * as ActivitiesService from "@/services/activities";
import * as UsersService from '@/services/users';
import * as LeadsService from '@/services/leads';
import { addMinutes, format } from "date-fns";
import { useAuth } from '@/contexts/AuthContext';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';

interface ActivityTrackerProps {
  entityType: string;
  entityId: string | number;
  entityName?: string;
  initialInfo?: string;
  initialInfoDate?: string | Date;
  initialInfoUserName?: string;
  canAdd?: boolean;
}

const ACTIVITY_TYPES = [
  { value: 'comment', label: 'Comment', icon: MessageSquare },
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'follow_up', label: 'Follow Up', icon: CalendarIcon },
  { value: 'call', label: 'Call', icon: UserIcon },
];

export function ActivityTracker({ entityType, entityId, entityName, initialInfo, initialInfoDate, initialInfoUserName, canAdd = true }: ActivityTrackerProps) {
  const [newActivity, setNewActivity] = useState("");
  const [activityType, setActivityType] = useState("comment");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [followUpTime, setFollowUpTime] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const today = React.useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }, []);

  const computeDefaultFollowUpTime = React.useCallback((selected: Date) => {
    const now = new Date();
    if (selected.toDateString() === now.toDateString()) {
      const nextSlot = addMinutes(now, 30);
      nextSlot.setSeconds(0, 0);
      return format(nextSlot, "HH:mm");
    }
    return "09:00";
  }, []);

  const computeMinTimeForDate = React.useCallback((selected: Date) => {
    const now = new Date();
    if (selected.toDateString() !== now.toDateString()) {
      return undefined;
    }
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  const followUpDateTime = React.useMemo(() => {
    if (!followUpDate) return undefined;
    if (!followUpTime) return undefined;
    const [hoursStr, minutesStr] = followUpTime.split(":");
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return undefined;
    }
    const combined = new Date(followUpDate.getTime());
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }, [followUpDate, followUpTime]);

  const minTimeForSelectedDate = React.useMemo(() => {
    if (!followUpDate) return undefined;
    return computeMinTimeForDate(followUpDate);
  }, [followUpDate, computeMinTimeForDate]);

  useEffect(() => {
    if (!followUpDate) return;
    if (!followUpTime) return;
    if (!minTimeForSelectedDate) return;
    if (followUpTime < minTimeForSelectedDate) {
      setFollowUpTime(minTimeForSelectedDate);
    }
  }, [followUpDate, followUpTime, minTimeForSelectedDate]);

  const handleActivityTypeChange = (value: string) => {
    setActivityType(value);
    if (value !== 'follow_up') {
      setFollowUpDate(undefined);
      setFollowUpTime("");
    }
    setComposerError(null);
  };

  // Extract conversion details like: "This record was converted from lead ID <uuid>. All previous..."
  const parseConversionDescription = (desc?: string): { fromType?: string; fromId?: string } => {
    if (!desc) return {};
    const m = desc.match(/converted from\s+([a-z_]+)\s+id\s+([a-z0-9-]+)/i);
    if (!m) return {};
    return { fromType: (m[1] || '').toLowerCase(), fromId: m[2] };
  };

  const ConversionFromLead = ({ id }: { id: string }) => {
    const { data: lead } = useQuery({
      queryKey: ["/api/leads", id],
      queryFn: () => LeadsService.getLead(id),
      staleTime: 5 * 60 * 1000,
    });
    const name = (lead as any)?.name || id;
    return (
      <span>
        This record was converted from <span className="font-medium">Lead</span> : {" "}
        <button
          type="button"
          className="text-blue-600 hover:underline"
          onClick={() => setLocation(`/leads/${id}`)}
        >
          {name}
        </button>
        . All previous activities have been preserved.
      </span>
    );
  };

  useEffect(() => {
    const handler = (e: any) => {
      const d = e?.detail || {};
      const match = String(d.entityType) === String(entityType) && String(d.entityId) === String(entityId);
      if (match) {
        setIsAddingActivity(true);
        setTimeout(() => textareaRef.current?.focus(), 0);
      }
    };
    window.addEventListener('open-activity-composer', handler as EventListener);
    return () => window.removeEventListener('open-activity-composer', handler as EventListener);
  }, [entityType, entityId]);

  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: [`/api/activities/${entityType}/${entityId}`],
    enabled: !!entityId,
  });

  // Fetch users to get current profile images
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  // Fetch module-specific dropdowns (for mapping status IDs/keys to display names)
  const moduleNameForEntity = (et: string) => {
    const t = (et || '').toLowerCase();
    switch (t) {
      case 'lead':
        return 'Leads';
      case 'student':
        return 'students';
      case 'application':
        return 'applications';
      case 'admission':
        return 'admissions';
      default:
        return t.endsWith('s') ? t : `${t}s`;
    }
  };
  const moduleName = moduleNameForEntity(entityType);
  const { data: moduleDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module', moduleName],
    queryFn: async () => DropdownsService.getModuleDropdowns(moduleName),
  });
  // Fallback: some shared options (like Country) may live under Leads module
  const { data: leadsModuleDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module', 'Leads'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Leads'),
  });
  // Global fallback: fetch all dropdowns to build an id->label map
  const { data: allDropdowns = [] } = useQuery({
    queryKey: ['/api/dropdowns'],
    queryFn: async () => DropdownsService.getAllDropdowns(),
    staleTime: 5 * 60 * 1000,
  });
  const globalLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    (allDropdowns as any[]).forEach((d: any) => {
      const k = String(d.id || d.key || '');
      if (k) map.set(k, String(d.value ?? ''));
    });
    return map;
  }, [allDropdowns]);

  // Generic dropdown label resolution
  const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Convert a value that may be an array, JSON stringified array, comma-separated string, or scalar into an array of strings
  const toArray = (val: any): string[] => {
    if (Array.isArray(val)) return val.map((v) => String(v));
    if (val == null) return [];
    const s = String(val).trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
    } catch {
      // not JSON; continue
    }
    if (s.startsWith('[') && s.endsWith(']')) {
      const inner = s.slice(1, -1);
      return inner
        .split(',')
        .map((t) => t.trim().replace(/^\"|\"$/g, '').replace(/^'|'$/g, ''))
        .filter(Boolean);
    }
    if (s.includes(',')) return s.split(',').map((t) => t.trim()).filter(Boolean);
    return [s];
  };

  // Normalize activity object keys (accept snake_case from backend)
  const normalizeActivity = (a: any) => {
    if (!a || typeof a !== 'object') return a;
    return {
      ...a,
      id: a.id ?? a.ID,
      entityType: a.entityType ?? a.entity_type,
      entityId: a.entityId ?? a.entity_id,
      activityType: a.activityType ?? a.activity_type ?? a.activityType,
      title: a.title ?? a.title,
      description: a.description ?? a.description,
      oldValue: a.oldValue ?? a.old_value,
      newValue: a.newValue ?? a.new_value,
      fieldName: a.fieldName ?? a.field_name,
      followUpAt: a.followUpAt ?? a.follow_up_at ?? null,
      userId: a.userId ?? a.user_id,
      userName: a.userName ?? a.user_name,
      userProfileImage: a.userProfileImage ?? a.user_profile_image,
      createdAt: a.createdAt ?? a.created_at,
    } as any;
  };
  const getOptionsForField = (fieldName?: string): any[] => {
    if (!fieldName) return [];
    const target = normalize(fieldName);
    const entries = moduleDropdowns ? Object.entries(moduleDropdowns as Record<string, any[]>) : [];
    const leadsEntries = leadsModuleDropdowns ? Object.entries(leadsModuleDropdowns as Record<string, any[]>) : [];

    const findIn = (ens: [string, any[]][]) => {
      let entry = ens.find(([k]) => normalize(String(k)) === target);
      if (entry) return entry[1] || [];
      const isCountryField = /country/.test(target) || target === 'targetcountry';
      if (isCountryField) {
        const candidates = ['target_country','targetcountry','target country','interested country','country'];
        const set = new Set(candidates.map(normalize));
        entry = ens.find(([k]) => set.has(normalize(String(k))));
        if (entry) return entry[1] || [];
      }
      const looksLikeOptions = (arr: any[]) => Array.isArray(arr) && arr.some((o) => o && (('id' in o) || ('key' in o)) && ('value' in o));
      const fallback = ens.find(([, v]) => looksLikeOptions(v));
      return (fallback?.[1] as any[]) || [];
    };

    const fromModule = findIn(entries);
    if (fromModule.length) return fromModule;
    const fromLeads = findIn(leadsEntries);
    if (fromLeads.length) return fromLeads;

    // Global fallback for country-like fields using all dropdowns
    const isCountryField = /country/.test(target) || target === 'targetcountry';
    if (isCountryField && Array.isArray(allDropdowns) && (allDropdowns as any[]).length) {
      const options = (allDropdowns as any[]).filter((d: any) => /country/i.test(String(d.fieldName || '')));
      return options as any[];
    }
    return [];
  };
  const getLabelForField = (fieldName?: string | null, value?: any) => {
    if (!fieldName) return value ?? '';
    if (value == null || value === '') return '';
    const field = normalize(fieldName);

    if (field === 'status') {
      const arr = toArray(value);
      return arr.map((v) => getStatusLabel(v)).join(', ');
    }

    const options = getOptionsForField(fieldName);
    const arr = toArray(value);
    const mapOne = (v: string) => {
      const hit = options.find((opt: any) => opt.id === v || opt.key === v || opt.value === v);
      if (hit && hit.value) return String(hit.value);
      if (globalLabelById.has(v)) return String(globalLabelById.get(v));
      return v;
    };
    if (arr.length > 1) return arr.map(mapOne).join(', ');
    return mapOne(arr[0] ?? '');
  };

  // Create a lookup function for user profile images
  const getUserProfileImage = (userId: string) => {
    const user = users.find((u: UserType) => String(u.id) === String(userId));
    return (user as any)?.profileImageUrl || (user as any)?.profileImage || null;
  };

  // Image viewer modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageOpen, setImageOpen] = useState(false);

  // Close overlay on Escape key
  useEffect(() => {
    if (!imageOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setImageOpen(false);
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imageOpen]);

  // Current authenticated user (used for optimistic fallback)
  const { user } = useAuth();

  // cache for fetched user profiles not present in the users list
  const [fetchedProfiles, setFetchedProfiles] = useState<Record<string, string | null>>({});

  const getCurrentUserProfileIfMatch = (activity: any) => {
    if (!user) return null;
    const displayName = ((user as any).name || (user as any).firstName || (user as any).email || '').toString().trim();
    const activityName = (activity?.userName || '').toString().trim();
    if (!activityName) return null;
    // compare lowercased substrings to be tolerant
    if (activityName.toLowerCase().includes(displayName.toLowerCase()) || displayName.toLowerCase().includes(activityName.toLowerCase())) {
      return (user as any).profileImageUrl || (user as any).profileImage || null;
    }
    return null;
  };

  // Fetch missing user profiles returned by activities (server often omits userProfileImage)
  useEffect(() => {
    const missingIds = Array.from(new Set(
      (Array.isArray(activities) ? activities.map(normalizeActivity) : [])
        .map((a: any) => a.userId)
        .filter(Boolean)
        .filter((id: string) => !getUserProfileImage(id) && !(id in fetchedProfiles))
    ));
    if (missingIds.length === 0) return;
    missingIds.forEach(async (id: string) => {
      try {
        const u = await UsersService.getUser(String(id));
        const img = (u as any)?.profileImageUrl || (u as any)?.profileImage || null;
        setFetchedProfiles(prev => ({ ...prev, [id]: img }));
      } catch (err) {
        setFetchedProfiles(prev => ({ ...prev, [id]: null }));
      }
    });
  }, [activities, users, fetchedProfiles]);

  const addActivityMutation = useMutation({
    mutationFn: async (data: { type: string; content: string; followUpAt?: string | null }) => {
      console.log('Adding activity:', { entityType, entityId, data });
      const result = await ActivitiesService.createActivity({
        entityType,
        entityId: String(entityId),
        activityType: data.type,
        content: data.content,
        followUpAt: data.followUpAt ?? null,
      });
      console.log('Activity created:', result);
      return result;
    },
    // Optimistic update: add a temporary activity to the cache immediately
    onMutate: async (data) => {
      const tempId = `temp-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const optimisticActivity: any = {
        id: tempId,
        entityType: String(entityType),
        entityId: String(entityId),
        activityType: data.type,
        title: '',
        description: data.content,
        userName: user?.firstName || user?.name || user?.email || 'You',
        userId: user?.id,
        userProfileImage: (user as any)?.profileImageUrl || (user as any)?.profileImage || null,
        followUpAt: data.followUpAt ?? null,
        createdAt,
        isOptimistic: true,
      };

      await queryClient.cancelQueries({ queryKey: [`/api/activities/${entityType}/${entityId}`] });
      const previous = queryClient.getQueryData<Activity[]>([`/api/activities/${entityType}/${entityId}`]);
      queryClient.setQueryData<Activity[]>([`/api/activities/${entityType}/${entityId}`], (old = []) => [optimisticActivity as any, ...(Array.isArray(old) ? old : [])]);
      setNewActivity('');
      setActivityType('comment');
      setFollowUpDate(undefined);
      setFollowUpTime('');
      setComposerError(null);
      setIsAddingActivity(false);
      return { previous, tempId };
    },
    onError: (err, variables, context: any) => {
      console.error('Activity mutation error:', err);
      if (context?.previous) {
        queryClient.setQueryData<Activity[]>([`/api/activities/${entityType}/${entityId}`], context.previous as any);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${entityType}/${entityId}`] });
      refetch();
    },
    onSuccess: (data, variables, context: any) => {
      // server will provide actual activity; ensure cache refreshed
      console.log('Activity mutation success:', data);
    }
  });

  const handleAddActivity = () => {
    const content = newActivity.trim();
    if (!content) {
      return;
    }
    if (activityType === 'follow_up') {
      if (!followUpDate || !followUpTime || !followUpDateTime) {
        setComposerError('Select follow-up date and time');
        return;
      }
      if (followUpDateTime.getTime() < Date.now()) {
        setComposerError('Follow-up must be scheduled in the future');
        return;
      }
    }
    setComposerError(null);
    addActivityMutation.mutate({
      type: activityType,
      content,
      followUpAt: followUpDateTime ? followUpDateTime.toISOString() : null,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddActivity();
    }
  };

  const getActivityIcon = (activityType: string, size: string = "h-4 w-4") => {
    switch (activityType) {
      case 'created': return <Plus className={`${size} text-blue-600`} />;
      case 'updated': return <ActivityIcon className={`${size} text-primary`} />;
      case 'status_changed': return <ActivityIcon className={`${size} text-orange-500`} />;
      case 'comment': return <MessageSquare className={`${size} text-purple-500`} />;
      case 'deleted': return <ActivityIcon className={`${size} text-red-500`} />;
      default: return <ActivityIcon className={`${size} text-gray-500`} />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'created': return 'bg-blue-100 text-blue-700';
      case 'updated': return 'bg-blue-100 text-blue-700';
      case 'status_changed': return 'bg-orange-100 text-orange-700';
      case 'comment': return 'bg-purple-100 text-purple-700';
      case 'deleted': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDotColor = (activityType: string) => {
    switch (activityType) {
      case 'created': return 'bg-blue-600';
      case 'updated': return 'bg-primary';
      case 'status_changed': return 'bg-orange-500';
      case 'comment': return 'bg-purple-500';
      case 'deleted': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Map status id/key/value to display label from dropdowns
  const getStatusLabel = (idOrKey?: string) => {
    if (!idOrKey || !moduleDropdowns?.Status) return idOrKey || '';
    const status = moduleDropdowns.Status.find((opt: any) =>
      opt.id === idOrKey || opt.key === idOrKey || (typeof opt.value === 'string' && typeof idOrKey === 'string' && opt.value.toLowerCase() === idOrKey.toLowerCase())
    );
    return status?.value || idOrKey;
  };

  // Replace raw status IDs in activity text with human-readable labels
  const mapStatusIdsInText = (text: string) => {
    if (!text) return '';
    const statusChangeRegex = /status changed from\s+"([^"]+)"\s+to\s+"([^"]+)"/i;
    if (statusChangeRegex.test(text)) {
      return text.replace(statusChangeRegex, (_m, fromId, toId) => {
        const fromLabel = getStatusLabel(fromId);
        const toLabel = getStatusLabel(toId);
        if ((fromLabel || '').toLowerCase().trim() === (toLabel || '').toLowerCase().trim()) return '';
        return `Status changed from "${fromLabel}" to "${toLabel}"`;
      });
    }
    return text.replace(/[0-9a-fA-F-]{36}/g, (token) => getStatusLabel(token));
  };

  // Determine if an activity is a redundant status change (same status before/after)
  const isRedundantStatusChange = (a: any) => {
    const an = normalizeActivity(a);
    const type = (an.activityType || '').toLowerCase();
    const field = normalize(an.fieldName || '');
    const hasValues = ((an.oldValue ?? '') !== '' || (an.newValue ?? '') !== '');
    if (!hasValues) return false;
    if (field === 'status' || type === 'status_changed') {
      const fromLabel = getLabelForField('status', String(an.oldValue || ''));
      const toLabel = getLabelForField('status', String(an.newValue || ''));
      if ((fromLabel || '').toLowerCase().trim() === (toLabel || '').toLowerCase().trim()) return true;
      if (String(an.oldValue || '') === String(an.newValue || '')) return true;
    }
    return false;
  };

  // Safely format dates that may be missing/invalid
  const safeFormatDate = (d: any) => {
    try {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '';
      return format(dt, 'MMM d, h:mm a');
    } catch {
      return '';
    }
  };

  const safeFormatFollowUpDate = (value: any) => {
    try {
      if (!value) return '';
      if (value instanceof Date) {
        return format(value, 'PPP');
      }
      const iso = String(value);
      const dateMatch = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        return format(date, 'PPP');
      }
      const parsed = new Date(iso);
      if (Number.isNaN(parsed.getTime())) return '';
      const midnight = parsed.getHours() === 0 && parsed.getMinutes() === 0 && parsed.getSeconds() === 0 && parsed.getMilliseconds() === 0;
      return format(parsed, midnight ? 'PPP' : 'PPP p');
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pt-0 px-3 pb-3">
        <div className="text-center py-4 text-gray-500">Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 pt-0 px-3 pb-3">
        <div className="text-center py-4">
          <div className="text-red-600 mb-2">Error loading activities</div>
          <div className="text-sm text-gray-500 mb-3">{error.message}</div>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-0 px-3 pb-3">

        {canAdd && (
          <>
            <div className="space-y-2.5 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
              {!isAddingActivity ? (
                <Button
                  size="sm"
                  onClick={() => setIsAddingActivity(true)}
                  className="w-full bg-[#0071B0] hover:bg-[#00649D] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              ) : (
                <div className="space-y-3">
                  <Select value={activityType} onValueChange={handleActivityTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {activityType === 'follow_up' && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-700">Follow-up date</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={`w-full justify-start text-sm font-normal ${followUpDate ? 'text-gray-900' : 'text-muted-foreground'}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {followUpDate ? format(followUpDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarPicker
                            mode="single"
                            selected={followUpDate}
                            onSelect={(date) => {
                              setFollowUpDate(date ?? undefined);
                              setComposerError(null);
                            }}
                            disabled={(date) => date < today}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {composerError && (
                    <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600">
                      {composerError}
                    </div>
                  )}

                  <Textarea
                    ref={textareaRef}
                    placeholder="Enter activity details... (Press Enter to submit, Shift+Enter for new line)"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[80px]"
                  />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddActivity}
                      disabled={!newActivity.trim() || addActivityMutation.isPending || (activityType === 'follow_up' && !followUpDate)}
                    >
                      {addActivityMutation.isPending ? "Adding..." : "Add Activity"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingActivity(false);
                        setNewActivity("");
                        setActivityType("comment");
                        setFollowUpDate(undefined);
                        setComposerError(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  {addActivityMutation.error && (
                    <div className="text-red-600 text-xs p-2 bg-red-50 rounded">
                      Error: {addActivityMutation.error.message}
                    </div>
                  )}

                  <p className="text-xs text-gray-600">
                    Press Enter to submit, Shift+Enter for new line
                  </p>
                </div>
              )}
            </div>

            <Separator />
          </>
        )}

        {/* Activities List */}
        <div className="space-y-5 pl-1">
          {(() => {
            let list: Activity[] = Array.isArray(activities) ? (activities as Activity[]).map(normalizeActivity) : [];
            if (initialInfo && initialInfo.trim().length > 0) {
              const createdActivity = list.find(a => a.activityType === 'created');
              const userName = initialInfoUserName || createdActivity?.userName || 'Admin User';
              const when = initialInfoDate || createdActivity?.createdAt || new Date(0).toISOString();
              const synthetic: any = {
                id: -1,
                entityType: String(entityType),
                entityId: String(entityId),
                activityType: 'note',
                title: 'Initial note',
                description: initialInfo,
                userName,
                userId: createdActivity?.userId,
                userProfileImage: createdActivity?.userProfileImage,
                createdAt: when,
              } as Activity;
              list = [...list, synthetic];
            }
            // Ordering: others (desc) at top, then notes, and "created" at the bottom
            const priority = (t: string) => (t === 'created' ? 2 : t === 'note' ? 1 : 0);
            list.sort((a: any, b: any) => {
              const pa = priority(a.activityType);
              const pb = priority(b.activityType);
              if (pa !== pb) return pa - pb;
              const da = new Date(a.createdAt as any).getTime();
              const db = new Date(b.createdAt as any).getTime();
              return db - da;
            });

            // If this entity is a student converted from a lead, the backend copies all lead activities
            // to the student record. To avoid showing those historical lead activities in the student's
            // activity feed, detect the conversion activity and hide any activities that occurred
            // before the conversion event (these are the copied lead activities).
            try {
              const convertedAct = list.find((a: any) => String((a.activityType || '').toLowerCase()) === 'converted');
              if (convertedAct) {
                const parsed = parseConversionDescription(convertedAct.description || convertedAct.title || '');
                if (parsed.fromType === 'lead') {
                  const cutoff = new Date(convertedAct.createdAt).getTime();
                  list = list.filter((a: any) => {
                    // Always keep the conversion activity itself
                    if (String((a.activityType || '').toLowerCase()) === 'converted' && a.id === convertedAct.id) return true;
                    const t = new Date(a.createdAt).getTime();
                    // Keep activities that occurred at or after conversion
                    return t >= cutoff;
                  });
                }
              }
            } catch (err) {
              // ignore parsing errors and fall back to showing all activities
            }

            // Remove any spurious "undefined decision" activity entries generated by some universities
            const isUndefinedDecisionActivity = (act: any) => {
              const desc = String(act?.description || act?.title || '').toLowerCase();
              if (desc.includes('undefined decision')) return true;
              // Common patterns: "decision received" with missing/undefined decision value
              if (/decision\s+received/.test(desc) && /undefined|null|^\s*$/.test(desc)) return true;
              // If activity explicitly references a decision field but value is empty or 'undefined'
              const field = (act?.fieldName || act?.field_name || '').toLowerCase();
              if (field === 'decision' || field === 'admissiondecision') {
                const nv = act?.newValue ?? act?.new_value ?? act?.value ?? '';
                if (nv === undefined || nv === null || String(nv).trim() === '' || String(nv).toLowerCase() === 'undefined') return true;
              }
              return false;
            };

            // Filter out undesired undefined decision activities
            list = list.filter((a: any) => !isUndefinedDecisionActivity(a));

            if (list.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No activities yet</p>
                  <p className="text-sm">Activities and comments will appear here</p>
                </div>
              );
            }

            list = list.filter((a) => !isRedundantStatusChange(a));
            return list.map((activity: Activity, idx: number) => {
              const isLast = idx === list.length - 1;
              const profileImage = (activity as any).userProfileImage || ((activity as any).userId ? (getUserProfileImage((activity as any).userId as any) || fetchedProfiles[(activity as any).userId]) : null) || getCurrentUserProfileIfMatch(activity);
              const followUpDisplay = safeFormatFollowUpDate((activity as any).followUpAt);
              return (
                <div key={`${activity.id}-${activity.createdAt}`} className="relative flex gap-3">
                  <div className="relative w-5 flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${getDotColor(activity.activityType)} ring-2 ring-white shadow mt-2`} />
                    {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 rounded-md border border-gray-200 bg-[#EDEDED] p-2.5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 rounded-none" onClick={() => { if (profileImage) { setSelectedImage(profileImage); setImageOpen(true); } }} style={{ cursor: profileImage ? 'pointer' : 'default' }}>
                            <AvatarImage className="object-cover" src={profileImage || undefined} alt={activity.userName || 'User'} />
                            <AvatarFallback className="rounded-none">{(activity.userName || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-gray-900">{activity.userName || 'Unknown User'}</span>
                            <span className="text-gray-600 capitalize">{(activity.activityType || '').replace('_', ' ')}</span>
                          </div>
                        </div>
                        <span className="text-gray-500">{safeFormatDate(activity.createdAt)}</span>
                      </div>
                      {(activity.description || (activity as any).title) && (
                        <div className="pt-1 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {(() => {
                            const hasValues = ((activity.oldValue ?? '') !== '' || (activity.newValue ?? '') !== '');
                            if (moduleDropdowns && activity.fieldName && hasValues) {
                              const fromLabel = getLabelForField(activity.fieldName, activity.oldValue || 'empty');
                              const toLabel = getLabelForField(activity.fieldName, activity.newValue || 'empty');
                              const fieldLabel = (activity.fieldName || '')
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, (str) => str.toUpperCase());
                              return `${fieldLabel} changed from "${fromLabel}" to "${toLabel}"`;
                            }
                            // Special handling for conversion activities to show clickable Lead name
                            if ((activity.activityType || '').toLowerCase() === 'converted') {
                              const { fromType, fromId } = parseConversionDescription(activity.description || '');
                              if (fromType === 'lead' && fromId) {
                                return <ConversionFromLead id={fromId} />;
                              }
                            }
                            if ((moduleDropdowns as any)?.Status) {
                              return mapStatusIdsInText(activity.description || (activity as any).title);
                            }
                            return (activity.description || (activity as any).title);
                          })()}
                        </div>
                      )}
                      {followUpDisplay && String(activity.activityType || '').toLowerCase() === 'follow_up' && (
                        <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>
                            Follow-up scheduled for <span className="font-semibold text-blue-900">{followUpDisplay}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>

      {imageOpen && selectedImage && (createPortal(
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 pointer-events-auto" onClick={() => { setImageOpen(false); setSelectedImage(null); }}>
          <button aria-label="Close image" className="absolute right-6 top-6 z-[100000] rounded-full bg-white text-black p-2 shadow-lg hover:opacity-90" onClick={() => { setImageOpen(false); setSelectedImage(null); }}>
            ×
          </button>
          <img src={String(selectedImage)} alt="Profile" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>,
        typeof document !== 'undefined' ? document.body : null
      ))}

    </div>
  );
}
