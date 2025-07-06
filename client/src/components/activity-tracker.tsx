import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpTooltip } from "./help-tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Activity as ActivityIcon, Plus, User, Calendar, Clock, Info } from "lucide-react";
import { Activity } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface ActivityTrackerProps {
  entityType: string;
  entityId: number;
  entityName?: string;
}

export function ActivityTracker({ entityType, entityId, entityName }: ActivityTrackerProps) {
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: [`/api/activities/${entityType}/${entityId}`],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      return apiRequest('POST', '/api/activities', {
        entityType,
        entityId,
        activityType: 'comment',
        title: 'Comment added',
        description: comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${entityType}/${entityId}`] });
      setNewComment("");
      setIsAddingComment(false);
    },
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'created': return <Plus className="h-4 w-4 text-green-500" />;
      case 'updated': return <ActivityIcon className="h-4 w-4 text-blue-500" />;
      case 'status_changed': return <ActivityIcon className="h-4 w-4 text-orange-500" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'deleted': return <ActivityIcon className="h-4 w-4 text-red-500" />;
      default: return <ActivityIcon className="h-4 w-4 text-gray-500" />;
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="h-4 w-4" />
          Activity Timeline
          {entityName && <span className="text-sm font-normal text-gray-500">for {entityName}</span>}
          <HelpTooltip 
            content="Track all changes and interactions for this record. Add comments to collaborate with your team and view automatic change logs."
            className="ml-auto"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Section */}
        <div className="space-y-3">
          {!isAddingComment ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingComment(true)}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment about this record..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingComment(false);
                    setNewComment("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Activities List */}
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities yet</p>
              <p className="text-sm">Activities and comments will appear here</p>
            </div>
          ) : (
            activities.map((activity: Activity) => (
              <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.activityType)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <Badge className={getActivityColor(activity.activityType)} variant="secondary">
                      {activity.activityType.replace('_', ' ')}
                    </Badge>
                  </div>
                  {activity.description && (
                    <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
                      {activity.description}
                    </p>
                  )}
                  {(activity.oldValue || activity.newValue) && (
                    <div className="text-xs text-gray-500 mb-2">
                      {activity.fieldName && (
                        <span className="font-medium">{activity.fieldName}: </span>
                      )}
                      {activity.oldValue && (
                        <span className="line-through">{activity.oldValue}</span>
                      )}
                      {activity.oldValue && activity.newValue && <span> → </span>}
                      {activity.newValue && (
                        <span className="text-green-600">{activity.newValue}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {activity.createdAt && format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}