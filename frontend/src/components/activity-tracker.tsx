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
  entityId: number;
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

  const { data: activities = [], isLoading } = useQuery({
    queryKey: [`/api/activities/${entityType}/${entityId}`],
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
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'status_changed': return 'bg-orange-100 text-orange-800';
      case 'comment': return 'bg-purple-100 text-purple-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading activities...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 p-4">
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
              
              <p className="text-xs text-gray-600">
                Press Enter to submit, Shift+Enter for new line
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Activities List */}
        <div className="space-y-4">
          {(activities as Activity[]).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities yet</p>
              <p className="text-sm">Activities and comments will appear here</p>
            </div>
          ) : (
            (activities as Activity[]).map((activity: Activity) => (
              <div key={activity.id} className="flex gap-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                {/* User Avatar - Larger and more prominent */}
                <div className="flex-shrink-0">
                  <Avatar className="h-12 w-12 border-2 border-blue-100">
                    {(() => {
                      // Use dynamic profile image lookup first, then fall back to stored image
                      const profileImage = activity.userId ? getUserProfileImage(activity.userId) : activity.userProfileImage;
                      return profileImage ? (
                        <AvatarImage src={profileImage} alt={activity.userName || "User"} />
                      ) : (
                        <AvatarFallback className="bg-blue-50 text-blue-600">
                          {activity.userName === "Next Bot" ? (
                            <Bot className="h-6 w-6" />
                          ) : (
                            <UserIcon className="h-6 w-6" />
                          )}
                        </AvatarFallback>
                      );
                    })()}
                  </Avatar>
                </div>
                
                <div className="flex-grow min-w-0">
                  {/* User Name - Most prominent */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-base text-gray-900">
                      {activity.userName || "Unknown User"}
                    </h4>
                    {/* Activity type and time - Less prominent */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        {getActivityIcon(activity.activityType, "h-3 w-3")}
                        {activity.activityType.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(activity.createdAt!), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Activity Title - Secondary prominence */}
                  {activity.title && (
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      {activity.title}
                    </p>
                  )}
                  
                  {/* Comment/Description - Main focus */}
                  {activity.description && (
                    <p className="text-gray-800 text-sm mb-3 whitespace-pre-wrap leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                  
                  {/* Field changes - Minimal styling */}
                  {(activity.oldValue || activity.newValue) && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                      {activity.fieldName && (
                        <span className="font-medium text-gray-600">{activity.fieldName}: </span>
                      )}
                      {activity.oldValue && (
                        <span className="line-through text-red-500">{activity.oldValue}</span>
                      )}
                      {activity.oldValue && activity.newValue && <span className="mx-1">→</span>}
                      {activity.newValue && (
                        <span className="text-green-600 font-medium">{activity.newValue}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
}
