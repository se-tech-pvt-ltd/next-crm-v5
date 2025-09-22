import { useState, useRef, useEffect, KeyboardEvent } from "react";
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTooltip } from "./help-tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Activity as ActivityIcon, Plus, User as UserIcon, Calendar, Clock, Info, Upload, Bot, Check, Edit, UserPlus, FileText, Award, Settings, AlertCircle, Users } from "lucide-react";
import { Activity, User as UserType } from "@/lib/types";
import * as DropdownsService from "@/services/dropdowns";
import * as ActivitiesService from "@/services/activities";
import { format } from "date-fns";
import { useAuth } from '@/contexts/AuthContext';

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
  { value: 'update', label: 'Update', icon: Edit },
  { value: 'status_change', label: 'Status Change', icon: AlertCircle },
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'follow_up', label: 'Follow Up', icon: Calendar },
  { value: 'call', label: 'Call', icon: UserIcon },
  { value: 'meeting', label: 'Meeting', icon: Users },
];

export function ActivityTracker({ entityType, entityId, entityName, initialInfo, initialInfoDate, initialInfoUserName, canAdd = true }: ActivityTrackerProps) {
  const [newActivity, setNewActivity] = useState("");
  const [activityType, setActivityType] = useState("comment");
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

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

  // Generic dropdown label resolution
  const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const getOptionsForField = (fieldName?: string): any[] => {
    if (!fieldName || !moduleDropdowns) return [];
    const target = normalize(fieldName);
    const entry = Object.entries(moduleDropdowns as any).find(([k]) => normalize(String(k)) === target);
    return (entry?.[1] as any[]) || [];
  };
  const getLabelForField = (fieldName?: string | null, value?: string | null) => {
    if (!fieldName) return value || '';
    if (!value) return '';
    if (normalize(fieldName) === 'status') return getStatusLabel(value);
    const options = getOptionsForField(fieldName);
    const hit = options.find((opt: any) => opt.id === value || opt.key === value || opt.value === value);
    return hit?.value || value;
  };

  // Create a lookup function for user profile images
  const getUserProfileImage = (userId: string) => {
    const user = users.find((u: UserType) => u.id === userId);
    return user?.profileImageUrl || null;
  };

  const { user } = useAuth();
  const addActivityMutation = useMutation({
    mutationFn: async (data: { type: string; content: string }) => {
      console.log('Adding activity:', { entityType, entityId, data });
      const result = await ActivitiesService.createActivity({
        entityType,
        entityId: String(entityId),
        activityType: data.type,
        content: data.content,
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
        createdAt,
        isOptimistic: true,
      };

      await queryClient.cancelQueries({ queryKey: [`/api/activities/${entityType}/${entityId}`] });
      const previous = queryClient.getQueryData<Activity[]>([`/api/activities/${entityType}/${entityId}`]);
      queryClient.setQueryData<Activity[]>([`/api/activities/${entityType}/${entityId}`], (old = []) => [optimisticActivity as any, ...(Array.isArray(old) ? old : [])]);
      setNewActivity('');
      setActivityType('comment');
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
    if (newActivity.trim()) {
      addActivityMutation.mutate({ type: activityType, content: newActivity.trim() });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddActivity();
    }
  };

  const getActivityIcon = (activityType: string, size: string = "h-4 w-4") => {
    switch (activityType) {
      case 'created': return <Plus className={`${size} text-green-500`} />;
      case 'updated': return <ActivityIcon className={`${size} text-blue-500`} />;
      case 'status_changed': return <ActivityIcon className={`${size} text-orange-500`} />;
      case 'comment': return <MessageSquare className={`${size} text-purple-500`} />;
      case 'deleted': return <ActivityIcon className={`${size} text-red-500`} />;
      default: return <ActivityIcon className={`${size} text-gray-500`} />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'created': return 'bg-green-100 text-green-700';
      case 'updated': return 'bg-blue-100 text-blue-700';
      case 'status_changed': return 'bg-orange-100 text-orange-700';
      case 'comment': return 'bg-purple-100 text-purple-700';
      case 'deleted': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDotColor = (activityType: string) => {
    switch (activityType) {
      case 'created': return 'bg-green-500';
      case 'updated': return 'bg-blue-500';
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
        return `Status changed from "${fromLabel}" to "${toLabel}"`;
      });
    }
    return text.replace(/[0-9a-fA-F-]{36}/g, (token) => getStatusLabel(token));
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
                  <Select value={activityType} onValueChange={setActivityType}>
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
                      disabled={!newActivity.trim() || addActivityMutation.isPending}
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
            let list: Activity[] = Array.isArray(activities) ? [...(activities as Activity[])] : [];
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

            if (list.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No activities yet</p>
                  <p className="text-sm">Activities and comments will appear here</p>
                </div>
              );
            }

            return list.map((activity: Activity, idx: number) => {
              const isLast = idx === list.length - 1;
              const profileImage = (activity as any).userProfileImage || ((activity as any).userId ? getUserProfileImage((activity as any).userId as any) : null);
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
                          <Avatar className="h-7 w-7 rounded-none">
                            <AvatarImage className="object-cover" src={profileImage || ''} alt={activity.userName || 'User'} />
                            <AvatarFallback className="rounded-none">{(activity.userName || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-gray-900">{activity.userName || 'Unknown User'}</span>
                            <span className="text-gray-600 capitalize">{activity.activityType.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <span className="text-gray-500">{format(new Date(activity.createdAt as any), 'MMM d, h:mm a')}</span>
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
                            if ((moduleDropdowns as any)?.Status) {
                              return mapStatusIdsInText(activity.description || (activity as any).title);
                            }
                            return (activity.description || (activity as any).title);
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>

    </div>
  );
}
