import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, MapPin, GraduationCap, Users, FileText, Clock, Edit } from "lucide-react";
import { Lead } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface LeadDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

export function LeadDetailsModal({ open, onOpenChange, lead }: LeadDetailsModalProps) {
  const [currentStatus, setCurrentStatus] = useState<string>(lead?.status || 'new');
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!lead) return;
      return apiRequest('PUT', `/api/leads/${lead.id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  if (!lead) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'website': return '🌐';
      case 'referral': return '👥';
      case 'social-media': return '📱';
      case 'advertisement': return '📢';
      case 'event': return '🎪';
      default: return '📋';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Lead Details
            </DialogTitle>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900">{lead.name}</h2>
              <p className="text-lg text-gray-600 mt-1">{lead.email}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Lead ID:</span> #{lead.id}
                </div>
                {lead.phone && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Phone:</span> {lead.phone}
                  </div>
                )}
              </div>
            </div>
            <div className="ml-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Status
              </label>
              <Select value={currentStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{lead.country}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academic Interest */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Interest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.program && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <span>{lead.program}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Source */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Lead Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.source && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSourceIcon(lead.source)}</span>
                  <span className="capitalize">{lead.source.replace('-', ' ')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{format(new Date(lead.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
              {lead.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span>{format(new Date(lead.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}