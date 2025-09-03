import { useRoute, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleCard } from '@/components/collapsible-card';
import { Input } from '@/components/ui/input';
import { DobPicker } from '@/components/ui/dob-picker';
import { Label } from '@/components/ui/label';
import { ActivityTracker } from '@/components/activity-tracker';
import { AddAdmissionModal } from '@/components/add-admission-modal';
import { Layout } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { type Student, type User, type Application } from '@/lib/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import * as StudentsService from '@/services/students';
import * as DropdownsService from '@/services/dropdowns';
import * as UsersService from '@/services/users';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User as UserIcon, Edit, Save, X, Plus, Mail, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function StudentDetails() {
  const [match, params] = useRoute('/students/:id');
  const [, setLocation] = useLocation();

  if (!match) return null;

  return (
    <StudentProfileModal
      open={true}
      onOpenChange={(open) => {
        if (!open) setLocation('/students');
      }}
      studentId={params?.id || null}
    />
  );
}
