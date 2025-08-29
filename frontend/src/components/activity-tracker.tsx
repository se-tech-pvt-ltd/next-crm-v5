import { useState, useRef, KeyboardEvent } from "react";
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
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface ActivityTrackerProps {
  entityType: string;
  entityId: string | number;
  entityName?: string;
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

export function ActivityTracker({ entityType, entityId, entityName }: ActivityTrackerProps) {
  const [newActivity, setNewActivity] = useState("");
  const [activityType, setActivityType] = useState("comment");
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: [`/api/activities/${entityType}/${entityId}`],
    enabled: !!entityId,
  });

  // Fetch users to get current profile images
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  // Create a lookup function for user profile images
  const getUserProfileImage = (userId: string) => {
    const user = users.find((u: UserType) => u.id === userId);
    return user?.profileImageUrl || null;
  };

  const addActivityMutation = useMutation({
    mutationFn: async (data: { type: string; content: string }) => {
      console.log('Adding activity:', { entityType, entityId, data });
      const response = await apiRequest('POST', '/api/activities', {
        entityType,
        entityId,
        activityType: data.type,
        title: `${ACTIVITY_TYPES.find(t => t.value === data.type)?.label || 'Activity'} added`,
        description: data.content,
      });
      const result = await response.json();
      console.log('Activity created:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Activity mutation success:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${entityType}/${entityId}`] });
      // Trigger a refetch to immediately show the new activity
      refetch();
      setNewActivity("");
      setActivityType("comment");
      setIsAddingActivity(false);
    },
    onError: (error) => {
      console.error('Activity mutation error:', error);
    },
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

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-center py-4 text-gray-500">Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
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
    <div className="space-y-4 p-4">
        {/* Debug Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          Entity: {entityType}/{entityId} | Activities: {activities.length}
          <Button size="sm" variant="ghost" onClick={() => refetch()} className="ml-2 h-5 px-2">
            Refresh
          </Button>
        </div>

        {/* Add Activity Section with Blue Gradient Background */}
        <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
          {!isAddingActivity ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingActivity(true)}
              className="w-full"
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

        {/* Activities List */}
        <div className="space-y-5 pl-1">
          {(activities as Activity[]).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities yet</p>
              <p className="text-sm">Activities and comments will appear here</p>
            </div>
          ) : (
            (activities as Activity[]).map((activity: Activity, idx: number, arr: Activity[]) => {
              const isLast = idx === arr.length - 1;
              const profileImage = activity.userId ? getUserProfileImage(activity.userId) : activity.userProfileImage;
              return (
                <div key={activity.id} className="relative flex gap-3">
                  {/* Timeline rail */}
                  <div className="relative w-5 flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${getDotColor(activity.activityType)} ring-2 ring-white shadow mt-2`} />
                    {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>

                  {/* Card */}
                  <div className="flex-1 rounded-md border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-1.5">
                      {/* Line 1: User */}
                      <div className="text-sm font-semibold text-gray-900">
                        {activity.userName || "Unknown User"}
                      </div>
                      {/* Line 2: Type */}
                      <div className="text-xs text-gray-700 capitalize">
                        {activity.activityType.replace('_', ' ')}
                      </div>
                      {/* Line 3: Date */}
                      <div className="text-xs text-gray-500">
                        {format(new Date(activity.createdAt!), 'MMM d, h:mm a')}
                      </div>
                      {/* Line 4: Message */}
                      {(activity.description || activity.title) && (
                        <div className="pt-1 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {activity.description || activity.title}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
    </div>
  );
}
