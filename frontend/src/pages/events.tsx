import { Link, useLocation, useRoute } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DetailsDialogLayout } from '@/components/ui/details-dialog';
import { CollapsibleCard } from '@/components/collapsible-card';
import * as RegionsService from '@/services/regions';
import * as BranchesService from '@/services/branches';
import * as BranchEmpsService from '@/services/branchEmps';
import * as UsersService from '@/services/users';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { toast } from '@/hooks/use-toast';
import * as EventsService from '@/services/events';
import * as RegService from '@/services/event-registrations';
import * as DropdownsService from '@/services/dropdowns';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, UserPlus, Users, Trash2, Calendar, Upload, MapPin, Clock, ArrowRight, ChevronLeft, Filter, Search, X, Target } from 'lucide-react';
import AddLeadForm from '@/components/add-lead-form';
import { AddLeadModal } from '@/components/add-lead-modal';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';


const FIFTEEN_MINUTE_STEP = 15;
const TIME_STEP_SECONDS = FIFTEEN_MINUTE_STEP * 60;

const formatDateTimeLocalValue = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getNextIntervalDate = (base: Date, stepMinutes = FIFTEEN_MINUTE_STEP) => {
  const result = new Date(base);
  result.setSeconds(0, 0);
  const remainder = result.getMinutes() % stepMinutes;
  if (remainder > 0) {
    result.setMinutes(result.getMinutes() + (stepMinutes - remainder));
  }
  if (result.getTime() < base.getTime()) {
    result.setMinutes(result.getMinutes() + stepMinutes);
  }
  return result;
};

const parseDateTimeParts = (value: string) => {
  const [datePart = '', timePart = ''] = value.split('T');
  return { date: datePart, time: timePart.slice(0, 5) };
};

export default function EventsPage() {
  const [isAddRegOpen, setIsAddRegOpen] = useState(false);
  const [isEditRegOpen, setIsEditRegOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<any | null>(null);
  const [isViewRegOpen, setIsViewRegOpen] = useState(false);
  const [viewReg, setViewReg] = useState<any | null>(null);
  const [filterEventId, setFilterEventId] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingView, setIsEditingView] = useState(false);
  const [viewEditData, setViewEditData] = useState<Partial<RegService.RegistrationPayload>>({});
  const [showList, setShowList] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canUseNativePicker = useMemo(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    try {
      if (window.self !== window.top) return false;
    } catch {
      return false;
    }
    const testInput = document.createElement('input');
    return typeof (testInput as HTMLInputElement).showPicker === 'function';
  }, []);

  const openNativePicker = useCallback((element: HTMLInputElement | null) => {
    if (!canUseNativePicker || !element) return;
    try {
      element.showPicker?.();
    } catch {}
  }, [canUseNativePicker]);

  // Import CSV wizard state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importErrors, setImportErrors] = useState<{ row: number; message: string }[]>([]);
  const [importValidRows, setImportValidRows] = useState<RegService.RegistrationPayload[]>([]);
  const [importAllRows, setImportAllRows] = useState<Array<{ row: number; name: string; number: string; email: string; city: string; source: string; status: string; errors: string[] }>>([]);
  const [isImporting, setIsImporting] = useState(false);

  const isValidEmail = (s?: string) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || '');

  const StatusProgressBarReg = () => {
    if (!viewReg) return null;
    const sequence = statusOptions.map(s => s.value);
    const currentIndex = sequence.findIndex(v => v === viewReg.status);

    const getLabel = (value: string) => getStatusLabel(value) || value;

    const handleClick = async (target: string) => {
      if (!viewReg) return;
      if (target === viewReg.status) return;
      const prev = viewReg.status;
      setViewReg({ ...viewReg, status: target });
      try {
        // @ts-ignore mutateAsync exists on useMutation
        await updateRegMutation.mutateAsync({ id: viewReg.id, data: { status: target } });
      } catch {
        setViewReg(v => (v ? { ...v, status: prev } : v));
      }
    };

    return (
      <div className="w-full bg-gray-100 rounded-md p-1 mb-2">
        <div className="flex items-center justify-between relative">
          {sequence.map((statusId, index) => {
            const isActive = index === currentIndex;
            const isCompleted = currentIndex >= 0 && index <= currentIndex;
            const statusName = getLabel(statusId);
            return (
              <div
                key={statusId}
                className="flex flex-col items-center relative flex-1 cursor-pointer select-none"
                onClick={() => handleClick(statusId)}
                role="button"
                aria-label={`Set status to ${statusName}`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-blue-600'
                }`}>
                  {isCompleted ? <div className="w-1 h-1 bg-white rounded-full" /> : <div className="w-1 h-1 bg-gray-300 rounded-full" />}
                </div>
                <span className={`mt-1 text-[11px] font-medium text-center ${
                  isCompleted ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}>
                  {statusName}
                </span>
                {index < sequence.length - 1 && (
                  <div className={`absolute top-2 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${
                    index < currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['/api/events'],
    queryFn: EventsService.getEvents,
  });

  const { data: registrations, refetch: refetchRegs } = useQuery({
    queryKey: ['/api/event-registrations', filterEventId],
    queryFn: async () =>
      filterEventId && filterEventId !== 'all'
        ? RegService.getRegistrationsByEvent(filterEventId)
        : RegService.getRegistrations(),
  });

  const { data: eventsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Events'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Events'),
  });

  const sourceOptions = useMemo(() => {
    const dd: any = eventsDropdowns as any;
    let list: any[] = dd?.Source || dd?.Sources || dd?.source || [];
    if (!Array.isArray(list)) list = [];
    list = [...list].sort((a: any, b: any) => {
      const sa = typeof a.sequence === 'number' ? a.sequence : Number(a.sequence ?? 0);
      const sb = typeof b.sequence === 'number' ? b.sequence : Number(b.sequence ?? 0);
      return sa - sb;
    });
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
  }, [eventsDropdowns]);

  const statusOptions = useMemo(() => {
    const dd: any = eventsDropdowns as any;
    let list: any[] = dd?.Status || dd?.Statuses || dd?.status || [];
    if (!Array.isArray(list)) list = [];
    list = [...list].sort((a: any, b: any) => (Number(a.sequence ?? 0) - Number(b.sequence ?? 0)));
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value, isDefault: Boolean(o.isDefault || o.is_default) }));
  }, [eventsDropdowns]);

  const getStatusLabel = useMemo(() => {
    const dd: any = eventsDropdowns as any;
    let list: any[] = dd?.Status || dd?.Statuses || dd?.status || [];
    if (!Array.isArray(list)) list = [];
    const map = new Map<string, string>();
    for (const o of list) {
      if (o?.id) map.set(String(o.id), o.value);
      if (o?.key) map.set(String(o.key), o.value);
      if (o?.value) map.set(String(o.value), o.value);
    }
    return (val?: string) => (val ? (map.get(String(val)) || val) : '');
  }, [eventsDropdowns]);

  const getSourceLabel = useMemo(() => {
    const dd: any = eventsDropdowns as any;
    let list: any[] = dd?.Source || dd?.Sources || dd?.source || [];
    if (!Array.isArray(list)) list = [];
    const map = new Map<string, string>();
    for (const o of list) {
      if (o?.id) map.set(String(o.id), o.value);
      if (o?.key) map.set(String(o.key), o.value);
      if (o?.value) map.set(String(o.value), o.value);
    }
    return (val?: string) => (val ? (map.get(String(val)) || val) : '');
  }, [eventsDropdowns]);

  const [location, navigate] = useLocation();
  const [isCreateRoute] = useRoute('/events/new');
  const [isEditRoute, editParams] = useRoute('/events/:id/edit');
  const [isRegsRoute, regsParams] = useRoute('/events/:id/registrations');
  const [isRegDetailRoute, regDetailParams] = useRoute('/events/:id/registrations/:regId');
  const [isLeadRoute, leadParams] = useRoute('/events/:id/registrations/:regId/lead');
  const [pendingRegId, setPendingRegId] = useState<string | null>(null);
  const [pendingOpenLeadId, setPendingOpenLeadId] = useState<string | null>(null);

  const addEventMutation = useMutation({
    mutationFn: EventsService.createEvent,
    onSuccess: () => { toast({ title: 'Event created' }); refetchEvents(); navigate('/events'); },
    onError: () => toast({ title: 'Failed to create event', variant: 'destructive' }),
  });

  const addRegMutation = useMutation({
    mutationFn: (data: RegService.RegistrationPayload) => RegService.createRegistration(data),
    onSuccess: () => { toast({ title: 'Registration added' }); refetchRegs(); setIsAddRegOpen(false); },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || 'Failed to add registration';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const updateRegMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RegService.RegistrationPayload> }) => RegService.updateRegistration(id, data),
    onSuccess: () => { toast({ title: 'Updated' }); refetchRegs(); setIsEditRegOpen(false); setEditingReg(null); },
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  });

  const deleteRegMutation = useMutation({
    mutationFn: (id: string) => RegService.deleteRegistration(id),
    onSuccess: () => { toast({ title: 'Deleted' }); refetchRegs(); },
    onError: () => toast({ title: 'Delete failed', variant: 'destructive' }),
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventsService.EventPayload> }) => EventsService.updateEvent(id, data),
    onSuccess: () => { toast({ title: 'Event updated' }); refetchEvents(); navigate('/events'); },
    onError: () => toast({ title: 'Failed to update event', variant: 'destructive' }),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => RegService.convertToLead(id),
    onSuccess: () => {
      toast({ title: 'Converted to Lead' });
      try { queryClient.invalidateQueries({ queryKey: ['/api/leads'] }); queryClient.invalidateQueries({ queryKey: ['/api/event-registrations'] }); } catch {}
      refetchRegs?.();
      setShowList(true);
      setIsViewRegOpen(false);
      setIsAddRegOpen(false);
      setIsEditRegOpen(false);
      setAddLeadModalOpen(false);
      setViewReg(null);
    },
    onError: () => toast({ title: 'Conversion failed', variant: 'destructive' }),
  });

  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [leadInitialData, setLeadInitialData] = useState<any | null>(null);

  const openConvertToLeadModal = (reg: any) => {
    setLeadInitialData({
      name: reg.name,
      email: reg.email,
      phone: reg.number,
      city: reg.city,
      // ensure source defaults to Events for conversion flow
      source: 'Events',
      status: 'new',
      eventRegId: reg.id,
    });

    // close the registration details modal first
    try { setIsViewRegOpen(false); } catch {}

    // navigate to /lead route for this registration
    try {
      const eventId = selectedEvent?.id || reg.eventId || reg.event_id;
      navigate(`/events/${eventId}/registrations/${reg.id}/lead`);
    } catch {}

    // open the Add Lead modal after a short delay so the view modal closes first
    const openModalFn = () => {
      try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setAddLeadModalOpen(true)); } catch { setAddLeadModalOpen(true); }
    };
    setTimeout(openModalFn, 150);
  };

  // Keep URL in sync when the Add Lead modal opens/closes
  useEffect(() => {
    if (addLeadModalOpen) return; // when open, already set by openConvertToLeadModal
    // when modal closes, revert URL to registration detail or registrations list
    try {
      const regId = (leadInitialData && leadInitialData.eventRegId) || (regDetailParams && regDetailParams.regId) || pendingRegId || (leadParams && leadParams.regId);
      const eventId = (regDetailParams && regDetailParams.id) || (regsParams && regsParams.id) || (leadParams && leadParams.id) || (selectedEvent && selectedEvent.id) || (leadInitialData && leadInitialData.eventId) || null;
      if (eventId && regId) {
        navigate(`/events/${eventId}/registrations/${regId}`);
      } else if (eventId) {
        navigate(`/events/${eventId}/registrations`);
      }
    } catch {}
  }, [addLeadModalOpen]);

  const [newEvent, setNewEvent] = useState({ name: '', type: '', date: '', venue: '', time: '' });
  const [editEvent, setEditEvent] = useState({ name: '', type: '', date: '', venue: '', time: '' });
  const [editEventAccess, setEditEventAccess] = useState<{ regionId: string; branchId: string; counsellorId?: string; admissionOfficerId?: string }>({ regionId: '', branchId: '', counsellorId: '', admissionOfficerId: '' });

  const minEventDateTime = formatDateTimeLocalValue(getNextIntervalDate(new Date()));

  const handleNewEventDateTimeChange = (value: string) => {
    if (!value) {
      setNewEvent((prev) => ({ ...prev, date: '', time: '' }));
      return;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      setNewEvent((prev) => ({ ...prev, date: '', time: '' }));
      return;
    }

    const normalized = getNextIntervalDate(parsed);
    const now = new Date();

    if (normalized.getTime() < now.getTime()) {
      const fallback = getNextIntervalDate(now);
      toast({ title: 'Event date cannot be in the past.', variant: 'destructive' });
      const fallbackParts = parseDateTimeParts(formatDateTimeLocalValue(fallback));
      setNewEvent((prev) => ({ ...prev, ...fallbackParts }));
      return;
    }

    const parts = parseDateTimeParts(formatDateTimeLocalValue(normalized));
    setNewEvent((prev) => ({ ...prev, ...parts }));
  };

  const handleEditEventDateTimeChange = (value: string) => {
    if (!value) {
      setEditEvent((prev) => ({ ...prev, date: '', time: '' }));
      return;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      setEditEvent((prev) => ({ ...prev, date: '', time: '' }));
      return;
    }

    const normalized = getNextIntervalDate(parsed);
    const now = new Date();

    if (normalized.getTime() < now.getTime()) {
      const fallback = getNextIntervalDate(now);
      toast({ title: 'Event date cannot be in the past.', variant: 'destructive' });
      const fallbackParts = parseDateTimeParts(formatDateTimeLocalValue(fallback));
      setEditEvent((prev) => ({ ...prev, ...fallbackParts }));
      return;
    }

    const parts = parseDateTimeParts(formatDateTimeLocalValue(normalized));
    setEditEvent((prev) => ({ ...prev, ...parts }));
  };

  const { user, accessByRole } = useAuth() as any;
  // Parse token payload once for fallback ids
  const tokenPayload = React.useMemo(() => {
    try {
      const t = localStorage.getItem('auth_token');
      if (!t) return null;
      const parts = String(t).split('.');
      if (parts.length < 2) return null;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
      const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(json) as any;
    } catch { return null; }
  }, []);
  const tokenSub = String((tokenPayload && (tokenPayload.sub || tokenPayload.user?.id)) || '');

  const normalizeModule = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const singularize = (s: string) => s.replace(/s$/i, '');
  const canCreateEvent = useMemo(() => {
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalizeModule(a.moduleName ?? a.module_name)) === 'event');
    if (entries.length === 0) return true;
    return entries.some((e: any) => (e.canCreate ?? e.can_create) === true);
  }, [accessByRole]);
  const canUpdateEvent = useMemo(() => {
    const normRole = String((user as any)?.role || (user as any)?.role_name || '').toLowerCase();
    if (normRole === 'admin' || normRole === 'super_admin' || normRole === 'superadmin') return true;
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalizeModule(a.moduleName ?? a.module_name)) === 'event');
    if (entries.length === 0) return true;
    return entries.some((e: any) => {
      const can = (e.canUpdate ?? e.can_update ?? e.canEdit ?? e.can_edit ?? e.canManage ?? e.can_manage ?? e.manage ?? e.update ?? e.edit);
      return can === true || can === 1 || can === '1';
    });
  }, [accessByRole, user]);
  const [eventAccess, setEventAccess] = useState<{ regionId: string; branchId: string; counsellorId?: string; admissionOfficerId?: string }>({ regionId: '', branchId: '', counsellorId: '', admissionOfficerId: '' });

  // Role access view level for Events module
  const eventViewLevel = useMemo(() => {
    const entries = (Array.isArray(accessByRole) ? accessByRole : []).filter((a: any) => singularize(normalizeModule(a.moduleName ?? a.module_name)) === 'event');
    const levels = entries.map((e: any) => String(e.viewLevel ?? e.view_level ?? '').trim().toLowerCase());
    if (levels.some((v: string) => v === 'none')) return 'none' as const; // sidebar already hides module
    if (levels.some((v: string) => v === 'all')) return 'all' as const; // nothing disabled
    if (levels.some((v: string) => v === 'assigned')) return 'assigned' as const;
    if (levels.some((v: string) => v === 'branch')) return 'branch' as const;
    if (levels.some((v: string) => v === 'region')) return 'region' as const;
    return '' as const;
  }, [accessByRole]);
  const disableByView = useMemo(() => {
    const d = { region: false, branch: false, counsellor: false, admissionOfficer: false };
    if (eventViewLevel === 'region') d.region = true;
    else if (eventViewLevel === 'branch') { d.region = true; d.branch = true; }
    else if (eventViewLevel === 'assigned') { d.region = true; d.branch = true; d.counsellor = true; d.admissionOfficer = true; }
    // Allow some roles (admission officer, counsellor) to have these fields enabled even if 'assigned' view
    try {
      const tokenRole = tokenPayload?.role_details?.role_name || tokenPayload?.role_name || '';
      const rawRole = (user as any)?.role || (user as any)?.role_name || (user as any)?.roleName || tokenRole || '';
      const roleNorm = String(rawRole || '').trim().toLowerCase().replace(/\s+/g, '_');
      const isAdmissionOfficer = roleNorm === 'admission_officer' || roleNorm === 'admission' || roleNorm === 'admissionofficer' || roleNorm === 'admission_officer' || roleNorm === 'admission officer';
      const isCounsellor = roleNorm === 'counselor' || roleNorm === 'counsellor';
      if (isAdmissionOfficer || isCounsellor) {
        d.counsellor = false;
        d.admissionOfficer = false;
      }
    } catch {}
    return d;
  }, [eventViewLevel, user]);

  const { data: regions = [] } = useQuery({ queryKey: ['/api/regions'], queryFn: () => RegionsService.listRegions() });

  useEffect(() => {
    if (!isCreateRoute) return;
    if (!user) return;

    let resolvedRegionId = '' as string;

    // 1) Try extracting from JWT (same approach as Leads form)
    try {
      const t = localStorage.getItem('auth_token');
      if (t) {
        const parts = String(t).split('.');
        if (parts.length >= 2) {
          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const pad = b64.length % 4;
          const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
          const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          const payload = JSON.parse(json) as any;
          const rd = payload?.role_details || payload?.roleDetails || {};
          const candidateRegion = rd.region_id ?? rd.regionId ?? payload?.region_id ?? payload?.regionId ?? payload?.region?.id ?? payload?.user?.region_id ?? payload?.user?.regionId;
          if (candidateRegion) resolvedRegionId = String(candidateRegion);
        }
      }
    } catch {}

    // 2) Fallback to current user object and assignments
    const norm = (r: string) => String(r || '').toLowerCase().replace(/\s+/g, '_');
    const roleName = norm(String(user.role || user.role_name || ''));
    if (!resolvedRegionId) {
      const userRegionId = String((user as any)?.regionId ?? (user as any)?.region_id ?? '');
      if (userRegionId) {
        resolvedRegionId = userRegionId;
      } else if (roleName === 'regional_manager') {
        const r = (Array.isArray(regions) ? regions : []).find((rr: any) => String(rr.regionHeadId ?? rr.region_head_id) === String((user as any)?.id));
        if (r?.id) resolvedRegionId = String(r.id);
      }
    }

    if (resolvedRegionId && !eventAccess.regionId) {
      setEventAccess((s) => ({ ...s, regionId: resolvedRegionId }));
    }
  }, [isCreateRoute, user, regions, eventAccess.regionId]);

    const { data: branches = [] } = useQuery({ queryKey: ['/api/branches'], queryFn: () => BranchesService.listBranches() });
  const { data: branchEmps = [] } = useQuery({ queryKey: ['/api/branch-emps'], queryFn: () => BranchEmpsService.listBranchEmps() });
  const { data: users = [] } = useQuery({ queryKey: ['/api/users'], queryFn: () => UsersService.getUsers() });


  // Auto-select branch for admission officers when creating events or on page load
  useEffect(() => {
    try {
      const roleNorm = normalizeRole((user as any)?.role || (user as any)?.role_name || (user as any)?.roleName);
      const isAdmissionOfficer = roleNorm === 'admission_officer' || roleNorm === 'admission' || roleNorm === 'admissionofficer' || roleNorm === 'admission officer';
      const isCounsellor = roleNorm === 'counselor' || roleNorm === 'counsellor';
      if (!isAdmissionOfficer && !isCounsellor) return;

      // If branch already selected, nothing to do
      if (eventAccess.branchId) {
        // still ensure role id selected
        setEventAccess((s) => ({
          ...s,
          counsellorId: s.counsellorId || (isCounsellor ? (String((user as any)?.id || tokenSub) || '') : s.counsellorId),
          admissionOfficerId: s.admissionOfficerId || (isAdmissionOfficer ? (String((user as any)?.id || tokenSub) || '') : s.admissionOfficerId),
        }));
        return;
      }

      // Try to read branch from JWT token role_details or payload
      let candidateBranch = '';
      try {
        const t = localStorage.getItem('auth_token');
        if (t) {
          const parts = String(t).split('.');
          if (parts.length >= 2) {
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const pad = b64.length % 4;
            const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
            const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const payload = JSON.parse(json) as any;
            const rd = payload?.role_details || payload?.roleDetails || {};
            candidateBranch = rd.branch_id ?? rd.branchId ?? payload?.branch_id ?? payload?.branchId ?? payload?.user?.branch_id ?? payload?.user?.branchId ?? '';
            if (candidateBranch) candidateBranch = String(candidateBranch);
          }
        }
      } catch {}

      // If not found in token, try user object
      if (!candidateBranch) {
        const uBranch = String((user as any)?.branchId ?? (user as any)?.branch_id ?? '');
        if (uBranch) candidateBranch = uBranch;
      }

      // If still not found, try branchEmps mapping: if user is mapped to exactly one branch, use it
      if (!candidateBranch && Array.isArray(branchEmps)) {
        const mappings = (branchEmps as any[]).filter((m: any) => String(m.userId ?? m.user_id) === String((user as any)?.id));
        if (mappings.length === 1) candidateBranch = String(mappings[0].branchId ?? mappings[0].branch_id);
      }

      if (candidateBranch) {
        // Ensure branch exists in list and optionally set region
        const b = Array.isArray(branches) ? (branches as any[]).find((x: any) => String(x.id) === String(candidateBranch) || String(x.id) === String(candidateBranch)) : null;
        const regionIdFromBranch = b ? String(b.regionId ?? b.region_id ?? '') : '';
        setEventAccess((s) => ({
          ...s,
          branchId: String(candidateBranch),
          regionId: s.regionId || regionIdFromBranch,
          counsellorId: s.counsellorId || (isCounsellor ? (String((user as any)?.id || tokenSub) || '') : s.counsellorId),
          admissionOfficerId: s.admissionOfficerId || (isAdmissionOfficer ? (String((user as any)?.id || tokenSub) || '') : s.admissionOfficerId),
        }));
      }
    } catch (err) {
      // ignore
    }
  }, [user, branches, branchEmps, eventAccess.branchId]);

  // Ensure admission officer is set automatically when opening Create modal
  useEffect(() => {
    if (!isCreateRoute) return;
    try {
      const roleNorm = normalizeRole((user as any)?.role || (user as any)?.role_name || tokenPayload?.role_details?.role_name || '');
      const isAdmissionOfficer = roleNorm === 'admission_officer' || roleNorm === 'admission' || roleNorm === 'admissionofficer' || roleNorm === 'admission officer';
      if (isAdmissionOfficer) {
        const id = String((user as any)?.id || tokenSub || '');
        if (id && (!eventAccess.admissionOfficerId || String(eventAccess.admissionOfficerId) !== id)) {
          setEventAccess((s) => ({ ...s, admissionOfficerId: id }));
        }
      }

      const isCounsellor = roleNorm === 'counselor' || roleNorm === 'counsellor';
      if (isCounsellor) {
        const id = String((user as any)?.id || tokenSub || '');
        if (id && (!eventAccess.counsellorId || String(eventAccess.counsellorId) !== id)) {
          setEventAccess((s) => ({ ...s, counsellorId: id }));
        }
      }
    } catch {}
  }, [isCreateRoute, user, tokenSub, eventAccess.admissionOfficerId, eventAccess.counsellorId]);

  // If branch selector is disabled by role/ACL, ensure a sensible branch is selected (prefer user's branch, or single mapping)
  useEffect(() => {
    if (!disableByView.branch) return;
    if (eventAccess.branchId) return;
    try {
      let candidateBranch = '';
      // Prefer eventAccess.regionId: try to find a branch in same region mapped to user
      if (eventAccess.regionId && Array.isArray(branchEmps) && Array.isArray(branches)) {
        const userMappings = (branchEmps as any[]).filter((m: any) => String(m.userId ?? m.user_id) === String((user as any)?.id));
        // find mapping where branch belongs to the selected region
        for (const m of userMappings) {
          const bid = String((m.branchId ?? m.branch_id) || '');
          const b = (branches as any[]).find((x: any) => String(x.id) === bid);
          if (b && String(b.regionId ?? b.region_id ?? '') === String(eventAccess.regionId)) { candidateBranch = bid; break; }
        }
        // if still not found and only one mapping, use it
        if (!candidateBranch && userMappings.length === 1) candidateBranch = String(userMappings[0].branchId ?? userMappings[0].branch_id);
      }
      // fallback: try token / user object
      if (!candidateBranch) {
        try {
          const t = localStorage.getItem('auth_token');
          if (t) {
            const parts = String(t).split('.');
            if (parts.length >= 2) {
              const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
              const pad = b64.length % 4;
              const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
              const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
              const payload = JSON.parse(json) as any;
              const rd = payload?.role_details || payload?.roleDetails || {};
              candidateBranch = rd.branch_id ?? rd.branchId ?? payload?.branch_id ?? payload?.branchId ?? payload?.user?.branch_id ?? payload?.user?.branchId ?? '';
              if (candidateBranch) candidateBranch = String(candidateBranch);
            }
          }
        } catch {}
      }
      if (!candidateBranch) {
        const uBranch = String((user as any)?.branchId ?? (user as any)?.branch_id ?? '');
        if (uBranch) candidateBranch = uBranch;
      }
      if (candidateBranch) {
        const b = Array.isArray(branches) ? (branches as any[]).find((x: any) => String(x.id) === String(candidateBranch)) : null;
        const regionIdFromBranch = b ? String(b.regionId ?? b.region_id ?? '') : '';
        const roleNorm = normalizeRole((user as any)?.role || (user as any)?.role_name || (user as any)?.roleName);
        const isAdmissionOfficer = roleNorm === 'admission_officer' || roleNorm === 'admission' || roleNorm === 'admissionofficer' || roleNorm === 'admission officer';
        const isCounsellor = roleNorm === 'counselor' || roleNorm === 'counsellor';
        setEventAccess((s) => ({
          ...s,
          branchId: String(candidateBranch),
          regionId: s.regionId || regionIdFromBranch,
          counsellorId: s.counsellorId || (isCounsellor ? (String((user as any)?.id || tokenSub) || '') : s.counsellorId),
          admissionOfficerId: s.admissionOfficerId || (isAdmissionOfficer ? (String((user as any)?.id || tokenSub) || '') : s.admissionOfficerId),
        }));
      }
    } catch {}
  }, [disableByView.branch, eventAccess.regionId, eventAccess.branchId, user, branches, branchEmps]);

  const [regForm, setRegForm] = useState<RegService.RegistrationPayload & { regionId?: string; branchId?: string; counsellorId?: string; admissionOfficerId?: string }>({ status: 'attending', name: '', number: '', email: '', city: '', source: '', eventId: '', regionId: '', branchId: '', counsellorId: '', admissionOfficerId: '' });
  const [emailError, setEmailError] = useState(false);

  const normalizeRole = (r?: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');
  const isRegionalManager = (() => {
    const rn = normalizeRole((user as any)?.role || (user as any)?.role_name || (user as any)?.roleName);
    return rn === 'regional_manager' || rn === 'region_manager' || rn === 'regionalmanager' || rn === 'regionmanager';
  })();

  const filteredBranches = Array.isArray(branches)
    ? branches.filter((b: any) => !eventAccess.regionId || String(b.regionId ?? b.region_id ?? '') === String(eventAccess.regionId))
    : [];

  // For Create modal (based on eventAccess)
  let counselorOptions = Array.isArray(users)
    ? users
        .filter((u: any) => {
          const r = normalizeRole(u.role || u.role_name || u.roleName);
          return r === 'counselor' || r === 'counsellor';
        })
        .filter((u: any) => {
          if (!eventAccess.branchId) return false;
          const links = Array.isArray(branchEmps) ? branchEmps : [];
          return links.some((be: any) => String(be.userId ?? be.user_id) === String(u.id) && String(be.branchId ?? be.branch_id) === String(eventAccess.branchId));
        })
    : [];

  // Ensure selected counsellor or current user (if counsellor) is present in options so Select shows it
  try {
    const sel = String(eventAccess.counsellorId || '');
    const currentId = String((user as any)?.id || tokenSub);
    if (sel && sel.trim()) {
      if (!counselorOptions.some((u: any) => String(u.id) === sel) && Array.isArray(users)) {
        const u = users.find((x: any) => String(x.id) === sel);
        if (u) counselorOptions = [u, ...counselorOptions];
      }
    }
    const roleNormU = normalizeRole((user as any)?.role || (user as any)?.role_name || (user as any)?.roleName);
    if ((roleNormU === 'counselor' || roleNormU === 'counsellor') && currentId) {
      if (!counselorOptions.some((u: any) => String(u.id) === currentId) && Array.isArray(users)) {
        const u = users.find((x: any) => String(x.id) === currentId);
        if (u) counselorOptions = [u, ...counselorOptions];
      }
    }
  } catch {}

  let admissionOfficerOptions = Array.isArray(users)
    ? users
        .filter((u: any) => {
          const r = normalizeRole(u.role || u.role_name || u.roleName);
          return r === 'admission_officer' || r === 'admission officer' || r === 'admissionofficer';
        })
        .filter((u: any) => {
          if (!eventAccess.branchId) return false;
          const links = Array.isArray(branchEmps) ? branchEmps : [];
          return links.some((be: any) => String(be.userId ?? be.user_id) === String(u.id) && String(be.branchId ?? be.branch_id) === String(eventAccess.branchId));
        })
    : [];

  // Ensure selected admission officer or current user (if admission officer) is present in options so Select shows it
  try {
    const selA = String(eventAccess.admissionOfficerId || '');
    const currentIdA = String((user as any)?.id || tokenSub);
    if (selA && selA.trim()) {
      if (!admissionOfficerOptions.some((u: any) => String(u.id) === selA) && Array.isArray(users)) {
        const u = users.find((x: any) => String(x.id) === selA);
        if (u) admissionOfficerOptions = [u, ...admissionOfficerOptions];
      }
    }
    const roleNormUA = normalizeRole((user as any)?.role || (user as any)?.role_name || (user as any)?.roleName);
    if ((roleNormUA === 'admission_officer' || roleNormUA === 'admission officer' || roleNormUA === 'admissionofficer') && currentIdA) {
      if (!admissionOfficerOptions.some((u: any) => String(u.id) === currentIdA) && Array.isArray(users)) {
        const u = users.find((x: any) => String(x.id) === currentIdA);
        if (u) admissionOfficerOptions = [u, ...admissionOfficerOptions];
      }
    }
  } catch {}

  // For Edit modal (based on editEventAccess)
  const filteredBranchesEdit = Array.isArray(branches)
    ? branches.filter((b: any) => !editEventAccess.regionId || String(b.regionId ?? b.region_id ?? '') === String(editEventAccess.regionId))
    : [];

  const counselorOptionsEdit = Array.isArray(users)
    ? users
        .filter((u: any) => {
          const r = normalizeRole(u.role || u.role_name || u.roleName);
          return r === 'counselor' || r === 'counsellor';
        })
        .filter((u: any) => {
          if (!editEventAccess.branchId) return false;
          const links = Array.isArray(branchEmps) ? branchEmps : [];
          return links.some((be: any) => String(be.userId ?? be.user_id) === String(u.id) && String(be.branchId ?? be.branch_id) === String(editEventAccess.branchId));
        })
    : [];

  const admissionOfficerOptionsEdit = Array.isArray(users)
    ? users
        .filter((u: any) => {
          const r = normalizeRole(u.role || u.role_name || u.roleName);
          return r === 'admission_officer' || r === 'admission officer' || r === 'admissionofficer';
        })
        .filter((u: any) => {
          if (!editEventAccess.branchId) return false;
          const links = Array.isArray(branchEmps) ? branchEmps : [];
          return links.some((be: any) => String(be.userId ?? be.user_id) === String(u.id) && String(be.branchId ?? be.branch_id) === String(editEventAccess.branchId));
        })
    : [];

  // Auto-preselect for Edit: if only one branch/counsellor/officer is available and not already set
  useEffect(() => {
    if (!isEditRoute) return;
    if (editEventAccess.branchId) return;
    const list = filteredBranchesEdit;
    if (Array.isArray(list) && list.length === 1) {
      setEditEventAccess((s) => ({ ...s, branchId: String((list[0] as any).id) }));
    }
  }, [isEditRoute, filteredBranchesEdit, editEventAccess.branchId]);

  useEffect(() => {
    if (!isEditRoute) return;
    if (!editEventAccess.branchId) return;
    if (!editEventAccess.counsellorId && Array.isArray(counselorOptionsEdit) && counselorOptionsEdit.length === 1) {
      setEditEventAccess((s) => ({ ...s, counsellorId: String((counselorOptionsEdit[0] as any).id) }));
    }
    if (!editEventAccess.admissionOfficerId && Array.isArray(admissionOfficerOptionsEdit) && admissionOfficerOptionsEdit.length === 1) {
      setEditEventAccess((s) => ({ ...s, admissionOfficerId: String((admissionOfficerOptionsEdit[0] as any).id) }));
    }
  }, [isEditRoute, editEventAccess.branchId, editEventAccess.counsellorId, editEventAccess.admissionOfficerId, counselorOptionsEdit, admissionOfficerOptionsEdit]);

  const handleCreateEvent = () => {
    if (!newEvent.name || !newEvent.type || !newEvent.date || !newEvent.venue || !newEvent.time) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    const composed = `${newEvent.date}T${newEvent.time}`;
    const eventDate = new Date(composed);
    if (Number.isNaN(eventDate.getTime()) || eventDate.getTime() < Date.now()) {
      toast({ title: 'Choose a future date and time in 15-minute steps.', variant: 'destructive' });
      return;
    }

    if (!eventAccess.regionId || !eventAccess.branchId || !eventAccess.counsellorId || !eventAccess.admissionOfficerId) {
      toast({ title: 'Select region, branch, counsellor, and admission officer.', variant: 'destructive' });
      return;
    }

    const payload = {
      ...newEvent,
      regionId: String(eventAccess.regionId),
      branchId: String(eventAccess.branchId),
      counsellorId: String(eventAccess.counsellorId),
      admissionOfficerId: String(eventAccess.admissionOfficerId),
    } as any;
    addEventMutation.mutate(payload);
  };

  const openAddRegistration = () => {
    if (!filterEventId || filterEventId === 'all') {
      toast({ title: 'Select an Event first', variant: 'destructive' });
      return;
    }
    const defaultStatus = statusOptions.find((o: any) => o.isDefault);
    const defaultSource = sourceOptions.find((o: any) => o.isDefault);
    // find the linked event (selected event)
    const ev = (Array.isArray(visibleEvents) ? visibleEvents : []).find((e: any) => String(e.id) === String(filterEventId)) || selectedEvent;

    const initial: any = {
      status: defaultStatus ? defaultStatus.value : '',
      name: '',
      number: '',
      email: '',
      city: '',
      source: defaultSource ? String(defaultSource.value) : '',
      eventId: filterEventId,
    };

    if (ev) {
      if (ev.regionId || ev.region_id) initial.regionId = String(ev.regionId ?? ev.region_id);
      if (ev.branchId || ev.branch_id) initial.branchId = String(ev.branchId ?? ev.branch_id);
      if (ev.counsellorId || ev.counsellor_id) initial.counsellorId = String(ev.counsellorId ?? ev.counsellor_id ?? ev.counselorId ?? ev.counselor_id);
      if (ev.admissionOfficerId || ev.admission_officer_id) initial.admissionOfficerId = String(ev.admissionOfficerId ?? ev.admission_officer_id);
    }

    setRegForm(initial);
    try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsAddRegOpen(true)); } catch { setIsAddRegOpen(true); }
  };

  const handleImportClick = () => {
    if (!filterEventId || filterEventId === 'all') {
      toast({ title: 'Select an Event to import into', variant: 'destructive' });
      return;
    }
    try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsImportOpen(true)); } catch { setIsImportOpen(true); }
    setImportStep(1);
    setImportFileName('');
    setImportErrors([]);
    setImportValidRows([]);
  };

  useEffect(() => {
    if (viewReg) {
      setViewEditData({
        name: viewReg.name,
        number: viewReg.number,
        email: viewReg.email,
        city: viewReg.city,
        source: viewReg.source,
        eventId: viewReg.eventId,
        status: viewReg.status,
      });
      setIsEditingView(false);
    }
  }, [viewReg]);

  const downloadSampleCsv = () => {
    const wb = XLSX.utils.book_new();
    // Sheet: registrations sample with only required fields
    const registrationsAOA = [
      ['name','number','email','city'],
      ['John Doe','+11234567890','john@example.com','New York'],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(registrationsAOA);
    XLSX.utils.book_append_sheet(wb, ws1, 'registrations');

    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event-registrations-sample.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const normalizeStatus = (s: string) => {
    const v = String(s || '').trim();
    if (!v) return '';
    const byValue = statusOptions.find(o => String(o.value).toLowerCase() === v.toLowerCase());
    if (byValue) return byValue.value;
    const byLabel = statusOptions.find(o => String(o.label).toLowerCase() === v.toLowerCase());
    return byLabel ? byLabel.value : '';
  };

  const validateCsvText = async (file: File) => {
    const isExcel = /\.xlsx?$/i.test(file.name) || /sheet|excel/i.test(file.type || '');
    let matrix: any[][] = [];
    if (isExcel) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      matrix = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    } else {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      matrix = lines.map(l => l.split(',').map(s => s.trim()));
    }

    const errors: { row: number; message: string }[] = [];
    const valid: RegService.RegistrationPayload[] = [];
    if (matrix.length === 0) {
      setImportErrors([{ row: 0, message: 'Empty file' }]);
      setImportValidRows([]);
      return;
    }

    const header = (matrix[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
    const need = ['name', 'number', 'email', 'city'];
    for (const col of need) if (!header.includes(col)) errors.push({ row: 0, message: `Missing column: ${col}` });
    if (errors.length > 0) { setImportErrors(errors); setImportValidRows([]); setImportAllRows([]); return; }

    const idx = (k: string) => header.indexOf(k);
    const nameIdx = idx('name');
    const numberIdx = idx('number');
    const emailIdx = idx('email');
    const cityIdx = idx('city');

    const seenEmails = new Map<string, number>();
    const seenNumbers = new Map<string, number>();

    // Use fixed defaults for imports as requested
    const defaultStatusValue = 'a576fe6c-8d7e-11f0-a5b5-92e8d4b3e6a5'; // NOT SURE
    const defaultSourceValue = 'b75b4253-840f-11f0-a5b5-92e8d4b3yy5'; // Events

    const allRows: Array<{ row: number; name: string; number: string; email: string; city: string; source: string; status: string; errors: string[] }> = [];

    for (let i = 1; i < matrix.length; i++) {
      const rowNo = i + 1;
      const cols = matrix[i] || [];
      const name = String(cols[nameIdx] ?? '').trim();
      const number = String(cols[numberIdx] ?? '').trim();
      const email = String(cols[emailIdx] ?? '').trim();
      const city = String(cols[cityIdx] ?? '').trim();

      // Do NOT read status/source from sheet; use defaults
      const status = defaultStatusValue;
      const source = defaultSourceValue;

      const rowErrors: string[] = [];
      if (!name) rowErrors.push('Name is required');
      if (!number) rowErrors.push('Number is required');
      if (!email) rowErrors.push('Email is required');
      if (!city) rowErrors.push('City is required');
      if (email && !isValidEmail(email)) rowErrors.push('Email is invalid');

      const emailKey = email.toLowerCase();
      if (seenEmails.has(emailKey)) {
        const firstRow = seenEmails.get(emailKey)!;
        rowErrors.push(`Duplicate email within file (Row ${firstRow})`);
      } else {
        seenEmails.set(emailKey, rowNo);
      }
      if (seenNumbers.has(number)) {
        const firstRowN = seenNumbers.get(number)!;
        rowErrors.push(`Duplicate number within file (Row ${firstRowN})`);
      } else {
        seenNumbers.set(number, rowNo);
      }

      const existsEmail = (registrations || []).some((r: any) => r.eventId === filterEventId && r.email && email && String(r.email).toLowerCase() === emailKey);
      const existsNumber = (registrations || []).some((r: any) => r.eventId === filterEventId && r.number && number && String(r.number) === String(number));
      if (existsEmail) rowErrors.push('Duplicate email in this event');
      if (existsNumber) rowErrors.push('Duplicate number in this event');

      const rowObj = { row: rowNo, name, number, email, city, source, status, errors: rowErrors };

      if (rowErrors.length > 0) {
        errors.push({ row: rowNo, message: rowErrors.join('; ') });
      } else {
        valid.push({ status, name, number, email, city, source, eventId: filterEventId } as RegService.RegistrationPayload);
      }

      allRows.push(rowObj);
    }

    setImportErrors(errors);
    setImportValidRows(valid);
    setImportAllRows(allRows);
  };

  const performImport = async () => {
    setIsImporting(true);
    let success = 0; let failed = 0;
    try {
      for (const row of importValidRows) {
        try {
          const targetEventId = row.eventId || filterEventId || selectedEvent?.id;
          const ev = (Array.isArray(visibleEvents) ? visibleEvents : []).find((e: any) => String(e.id) === String(targetEventId));
          const payload: any = { ...row };
          if (ev) {
            if (ev.regionId || ev.region_id) payload.regionId = String(ev.regionId ?? ev.region_id);
            if (ev.branchId || ev.branch_id) payload.branchId = String(ev.branchId ?? ev.branch_id);
            if (ev.counsellorId || ev.counsellor_id) payload.counsellorId = String(ev.counsellorId ?? ev.counsellor_id);
            if (ev.admissionOfficerId || ev.admission_officer_id) payload.admissionOfficerId = String(ev.admissionOfficerId ?? ev.admission_officer_id);
          }
          await RegService.createRegistration(payload);
          success++;
        } catch (e) {
          try { await RegService.createRegistration(row); success++; } catch { failed++; }
        }
      }
    } finally {
      setIsImporting(false);
    }
    toast({ title: 'Import finished', description: `${success} added, ${failed} failed` });
    setIsImportOpen(false);
    setImportStep(1);
    setImportErrors([]);
    setImportValidRows([]);
    setImportFileName('');
    refetchRegs();
  };

  const normalizeRoleList = (r?: string) => String(r || '').trim().toLowerCase().replace(/\s+/g, '_');
  const isRegionalManagerList = (() => {
    const rn = normalizeRoleList((user as any)?.role || (user as any)?.role_name || (user as any)?.roleName);
    return rn === 'regional_manager' || rn === 'region_manager' || rn === 'regionalmanager' || rn === 'regionmanager';
  })();

  const myRegionId = useMemo(() => {
    let rid = '' as string;
    try {
      const t = localStorage.getItem('auth_token');
      if (t) {
        const parts = String(t).split('.');
        if (parts.length >= 2) {
          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const pad = b64.length % 4;
          const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
          const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          const payload = JSON.parse(json) as any;
          const rd = payload?.role_details || payload?.roleDetails || {};
          const candidateRegion = rd.region_id ?? rd.regionId ?? payload?.region_id ?? payload?.regionId ?? payload?.region?.id ?? payload?.user?.region_id ?? payload?.user?.regionId;
          if (candidateRegion) rid = String(candidateRegion);
        }
      }
    } catch {}
    if (!rid) {
      const uRid = String((user as any)?.regionId ?? (user as any)?.region_id ?? '');
      if (uRid) rid = uRid;
    }
    if (!rid && isRegionalManagerList) {
      const r = (Array.isArray(regions) ? regions : []).find((rr: any) => String(rr.regionHeadId ?? rr.region_head_id) === String((user as any)?.id));
      if (r?.id) rid = String(r.id);
    }
    return rid;
  }, [user, regions, isRegionalManagerList]);

  const visibleEvents = useMemo(() => {
    const all = Array.isArray(events) ? events : [];
    if (isRegionalManagerList && myRegionId) return all.filter((e: any) => String(e.regionId ?? e.region_id ?? '') === String(myRegionId));
    return all;
  }, [events, isRegionalManagerList, myRegionId]);

  const editingEvent = useMemo(() => visibleEvents.find((e: any) => String(e.id) === String(editParams?.id)), [visibleEvents, editParams?.id]);

  useEffect(() => {
    if (!isEditRoute) return;
    const ev: any = editingEvent;
    if (!ev) return;
    let dateStr = '';
    let timeStr = '';
    try {
      const d = (typeof ev.date === 'string' || typeof ev.date === 'number') ? new Date(ev.date) : new Date(ev.date);
      if (!Number.isNaN(d.getTime())) {
        dateStr = d.toISOString().slice(0, 10);
        if (ev.time && String(ev.time).includes(':')) {
          const [hh, mm = '00'] = String(ev.time).split(':');
          const h = String(hh).padStart(2, '0');
          const m = String(mm).padStart(2, '0');
          timeStr = `${h}:${m}`;
        } else if (d instanceof Date) {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          timeStr = `${h}:${m}`;
        }
      }
    } catch {}
    setEditEvent({ name: ev.name || '', type: ev.type || '', venue: ev.venue || '', date: dateStr, time: timeStr });
    setEditEventAccess({
      regionId: String(ev.regionId ?? ev.region_id ?? '') || '',
      branchId: String(ev.branchId ?? ev.branch_id ?? '') || '',
      counsellorId: String(ev.counsellorId ?? ev.counselorId ?? ev.counsellor_id ?? ev.counselor_id ?? '') || '',
      admissionOfficerId: String(ev.admissionOfficerId ?? ev.admission_officer_id ?? '') || '',
    });
  }, [isEditRoute, editingEvent]);

  // Helper: compute event datetime (moved above filters to avoid TDZ)
  const getEventDateTime = (e: any): Date | null => {
    if (!e || !e.date) return null;
    try {
      const d = (typeof e.date === 'string' || typeof e.date === 'number') ? new Date(e.date) : new Date(e.date);
      if (e.time) {
        const [hh, mm = '00'] = String(e.time).split(':');
        const h = Number(hh);
        const m = Number(mm);
        if (!Number.isNaN(h) && !Number.isNaN(m)) {
          d.setHours(h, m, 0, 0);
        }
      }
      return d;
    } catch {
      return null;
    }
  };

  // Filters for Events list (similar to Leads)
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    for (const e of Array.isArray(visibleEvents) ? visibleEvents : []) {
      const t = String(e.type || '').trim();
      if (t) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibleEvents]);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (Array.isArray(visibleEvents) ? visibleEvents : []).filter((e: any) => {
      const dt = getEventDateTime(e);
      const isUpcoming = dt ? dt.getTime() >= Date.now() : false;
      if (timeFilter === 'upcoming' && !isUpcoming) return false;
      if (timeFilter === 'past' && isUpcoming) return false;
      if (typeFilter !== 'all' && String(e.type || '') !== typeFilter) return false;
      if (term) {
        const hay = `${String(e.name || '')} ${String(e.venue || '')}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [visibleEvents, timeFilter, typeFilter, searchTerm]);

  useEffect(() => {
    // If the route explicitly requested an event registrations view, don't override it while events are loading
    if (isRegsRoute || isRegDetailRoute) return;
    if (filterEventId && filterEventId !== 'all') {
      const ok = visibleEvents.some((e: any) => String(e.id) === String(filterEventId));
      if (!ok) {
        setFilterEventId('all');
        setShowList(false);
      }
    }
  }, [visibleEvents, filterEventId, isRegsRoute, isRegDetailRoute]);

  // Sync state with /events/:id/registrations route
  useEffect(() => {
    if ((isRegsRoute && regsParams?.id) || (isRegDetailRoute && regDetailParams?.id) || (isLeadRoute && leadParams?.id)) {
      const id = String((regsParams?.id || regDetailParams?.id || leadParams?.id));
      setFilterEventId(id);
      setShowList(true);
      // if we have a regId in the detail route, mark it pending so we can open when data loads
      if (regDetailParams?.regId) setPendingRegId(String(regDetailParams.regId));
      if (isLeadRoute && leadParams?.regId) setPendingOpenLeadId(String(leadParams.regId));
    } else if (!isEditRoute && !isCreateRoute) {
      setShowList(false);
    }
  }, [isRegsRoute, regsParams?.id, isRegDetailRoute, regDetailParams?.id, regDetailParams?.regId, isLeadRoute, leadParams?.id, leadParams?.regId, isEditRoute, isCreateRoute]);

  // When registrations data loads, if there's a pendingRegId from the route, open the view modal for it
  useEffect(() => {
    if (!pendingRegId && !pendingOpenLeadId) return;
    const list = (registrations || []) as any[];
    if (pendingRegId) {
      const match = list.find(r => String(r.id) === String(pendingRegId) || String(r.eventRegId) === String(pendingRegId));
      if (match) {
        setViewReg(match);
        setIsViewRegOpen(true);
        setPendingRegId(null);
      }
    }

    if (pendingOpenLeadId) {
      const match2 = list.find(r => String(r.id) === String(pendingOpenLeadId) || String(r.eventRegId) === String(pendingOpenLeadId));
      if (match2) {
        // prepare initial data preferring 'Events' as source
        setLeadInitialData({
          name: match2.name,
          email: match2.email,
          phone: match2.number,
          city: match2.city,
          // ensure lead source is set to Events when opening via /lead route
          source: 'Events',
          status: 'new',
          eventRegId: match2.id,
        });
        setAddLeadModalOpen(true);
        setPendingOpenLeadId(null);
      }
    }
  }, [registrations, pendingRegId, pendingOpenLeadId]);

  const eventOptions = [{ label: 'All Events', value: 'all' }, ...(visibleEvents.map((e: any) => ({ label: `${e.name} (${e.date})`, value: e.id })))] as { label: string; value: string }[];
  const selectedEvent = useMemo(() => visibleEvents.find((e: any) => e.id === filterEventId), [visibleEvents, filterEventId]);

  // Reset pagination when filters change on registrations list
  useEffect(() => { setPage(1); }, [filterEventId, registrations]);

  const formatEventDate = (d: any) => {
    try {
      const date = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d;
      if (!date || Number.isNaN(date.getTime())) return String(d ?? '');
      return format(date, 'EEE, MMM d, yyyy');
    } catch {
      return String(d ?? '');
    }
  };

  const formatEventTime = (t?: string) => {
    if (!t) return '';
    const [hh, mm = '00'] = String(t).split(':');
    const h = Number(hh);
    if (Number.isNaN(h)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr12 = ((h % 12) || 12);
    return `${hr12}:${String(mm).padStart(2, '0')} ${ampm}`;
  };

  const getCountdownString = (target: Date | null) => {
    if (!target) return '';
    const now = new Date();
    let diff = Math.max(0, target.getTime() - now.getTime());
    if (diff === 0) return 'Starting now';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    const seconds = Math.floor(diff / 1000);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (days === 0 && hours === 0 && minutes === 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    if (parts.length === 0) return 'Less than a minute';
    if (parts.length === 1) return `In ${parts[0]}`;
    const last = parts.pop();
    return `In ${parts.join(', ')} and ${last}`;
  };

  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const update = () => {
      const dt = getEventDateTime(selectedEvent);
      setCountdown(getCountdownString(dt));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [selectedEvent]);

  const palettes = [
    { gradientFrom: 'from-rose-500/80',    gradientTo: 'to-rose-300/40',    text: 'text-rose-600',    cardBorder: 'border-rose-200',    badgeBg: 'bg-rose-50',    badgeText: 'text-rose-700',    badgeBorder: 'border-rose-200' },
    { gradientFrom: 'from-violet-500/80',  gradientTo: 'to-violet-300/40',  text: 'text-violet-600',  cardBorder: 'border-violet-200',  badgeBg: 'bg-violet-50',  badgeText: 'text-violet-700',  badgeBorder: 'border-violet-200' },
    { gradientFrom: 'from-emerald-500/80', gradientTo: 'to-emerald-300/40', text: 'text-emerald-600', cardBorder: 'border-emerald-200', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', badgeBorder: 'border-emerald-200' },
    { gradientFrom: 'from-amber-500/80',   gradientTo: 'to-amber-300/40',   text: 'text-amber-600',   cardBorder: 'border-amber-200',   badgeBg: 'bg-amber-50',   badgeText: 'text-amber-800',  badgeBorder: 'border-amber-200' },
    { gradientFrom: 'from-sky-500/80',     gradientTo: 'to-sky-300/40',     text: 'text-sky-600',     cardBorder: 'border-sky-200',     badgeBg: 'bg-sky-50',     badgeText: 'text-sky-700',     badgeBorder: 'border-sky-200' },
    { gradientFrom: 'from-fuchsia-500/80', gradientTo: 'to-fuchsia-300/40', text: 'text-fuchsia-600', cardBorder: 'border-fuchsia-200', badgeBg: 'bg-fuchsia-50', badgeText: 'text-fuchsia-700', badgeBorder: 'border-fuchsia-200' },
    { gradientFrom: 'from-cyan-500/80',    gradientTo: 'to-cyan-300/40',    text: 'text-cyan-600',    cardBorder: 'border-cyan-200',    badgeBg: 'bg-cyan-50',    badgeText: 'text-cyan-700',    badgeBorder: 'border-cyan-200' },
    { gradientFrom: 'from-lime-500/80',    gradientTo: 'to-lime-300/40',    text: 'text-lime-700',    cardBorder: 'border-lime-200',    badgeBg: 'bg-lime-50',    badgeText: 'text-lime-800',    badgeBorder: 'border-lime-200' },
  ] as const;

  const getPalette = (key?: string) => {
    const s = String(key ?? 'default');
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    const idx = hash % palettes.length;
    return palettes[idx];
  };

  return (
    <Layout title="Events" helpText="Manage events and registrations. Similar to Leads.">
      <div className="space-y-4">

        {!showList && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-2">
            <Card>
              <CardHeader className="pb-1 p-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  Total Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="text-base font-semibold">
                  {eventsLoading ? <Skeleton className="h-6 w-12" /> : visibleEvents.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 p-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-red-500" />
                  Past Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="text-base font-semibold text-red-600">
                  {eventsLoading ? <Skeleton className="h-6 w-12" /> : (visibleEvents.filter((e: any) => { const dt = getEventDateTime(e); return dt ? dt.getTime() < Date.now() : false; }).length)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 p-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <Clock className="w-3 h-3 text-green-500" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="text-base font-semibold text-blue-600">
                  {eventsLoading ? <Skeleton className="h-6 w-12" /> : (visibleEvents.filter((e: any) => { const dt = getEventDateTime(e); return dt ? dt.getTime() >= Date.now() : false; }).length)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!showList && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Filters:</span>
                </div>

                <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as any)}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
                  <SelectTrigger className="w-36 h-7 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search events" className="h-7 pl-7 text-xs w-44" />
                </div>

                {(timeFilter !== 'all' || typeFilter !== 'all' || searchTerm) && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setTimeFilter('all'); setTypeFilter('all'); setSearchTerm(''); }}>
                    Clear All
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canCreateEvent && (
                  <Link href="/events/new">
                    <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-primary text-white shadow ring-2 ring-primary/40 hover:ring-primary" title="Add Event">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {(Array.isArray(visibleEvents) && visibleEvents.length === 0) ? (
              <EmptyState
                icon={<Calendar className="h-10 w-10" />}
                title="No events found"
                description="There are no events at the moment."
                action={canCreateEvent ? (
                  <Link href="/events/new">
                    <Button className="h-8">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Event
                    </Button>
                  </Link>
                ) : undefined}
              />
            ) : (
              filteredEvents.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="h-10 w-10" />}
                  title="No matching events"
                  description="Try adjusting your filters."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvents.map((e: any) => { const p = getPalette(e.type); return (
                    <Card key={e.id} className={`group cursor-pointer rounded-xl border border-[#223E7D]/20 bg-white hover:shadow-md hover:-translate-y-0.5 transform-gpu transition overflow-hidden`} onClick={() => { navigate(`/events/${e.id}/registrations`); }}>
                      <div className="h-1 bg-gradient-to-r from-[#223E7D] to-[#223E7D]/30" />
                      <CardHeader className="pb-1">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm line-clamp-2">{e.name}</CardTitle>
                          {canUpdateEvent && (
                            <button
                              type="button"
                              aria-label="Edit event"
                              onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); navigate(`/events/${e.id}/edit`); }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#223E7D] hover:bg-[#223E7D]/10"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1 space-y-2">
                        <div className="flex items-center text-xs text-gray-700">
                          <Calendar className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          <span>{formatEventDate(e.date)}</span>
                          {e.time ? (<><span className="mx-2 text-gray-300">•</span><Clock className="w-3.5 h-3.5 mr-1 text-gray-500" /><span>{formatEventTime(e.time)}</span></>) : null}
                        </div>
                        <div className="flex items-center text-xs text-gray-700">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-gray-500" />
                          <span className="truncate">{e.venue}</span>
                        </div>
                        <div>
                          <span className="inline-flex items-center text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 border border-[#223E7D]/20 bg-[#223E7D]/5 text-[#223E7D]">{e.type}</span>
                        </div>
                        <div className="pt-1">
                          <div className="inline-flex items-center text-[11px] text-[#223E7D] group-hover:translate-x-0.5 transition">
                            View Registrations
                            <ArrowRight className="ml-1 w-3 h-3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ); })}
                </div>
              )
            )}
          </>
        )}

        {showList && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <Card>
                <CardHeader className="pb-1 p-2">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <Users className="w-3 h-3 text-gray-500" />
                    Total registrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="text-base font-semibold">{(registrations || []).length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1 p-2">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <UserPlus className="w-3 h-3 text-primary" />
                    Converted
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="text-base font-semibold text-green-600">{(registrations || []).filter((r:any) => ((r as any).isConverted === 1 || (r as any).isConverted === '1' || (r as any).is_converted === 1 || (r as any).is_converted === '1')).length}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => navigate('/events')} className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted/50">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <CardTitle className="text-sm flex items-center">Event Registrations</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {showList && selectedEvent && (
                    <span className="hidden sm:inline-flex items-center text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 mr-1" />
                      <span>{countdown}</span>
                    </span>
                  )}
                  {filterEventId && filterEventId !== 'all' && (
                    <>
                      <Button size="xs" variant="default" onClick={openAddRegistration} className="rounded-full px-3"><Plus className="w-3 h-3 mr-1" />Add Registration</Button>
                      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={async (e) => { const input = e.target as HTMLInputElement; const f = input.files?.[0]; input.value = ''; if (f) { setImportFileName(f.name); await validateCsvText(f); setImportStep(3); } }} />
                      <Button size="xs" variant="default" onClick={handleImportClick} className="rounded-full px-3"><Upload className="w-3 h-3 mr-1" />Import</Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const list = (registrations || []) as any[];
                const total = list.length;
                const convertedCount = list.filter((r:any) => ((r as any).isConverted === 1 || (r as any).isConverted === '1' || (r as any).is_converted === 1 || (r as any).is_converted === '1')).length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const safePage = Math.min(Math.max(1, page), totalPages);
                const start = (safePage - 1) * pageSize;
                const end = Math.min(start + pageSize, total);
                const pageItems = list.slice(start, end);
                if (safePage !== page) setPage(safePage);
                return (
                  <>
                    <div className="overflow-x-auto">
                      {((filterEventId && filterEventId !== 'all') && total === 0) ? (
                        <EmptyState
                          icon={<UserPlus className="h-10 w-10" />}
                          title="No registrations found"
                          description="There are no registrations for this event."
                        />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="h-8 px-2 text-[11px]">Registration ID</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Full Name</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Phone Number</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Email</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Status</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Converted</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">City</TableHead>
                              <TableHead className="h-8 px-2 text-[11px]">Source</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pageItems.map((r: any) => (
                              <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { const eventId = selectedEvent?.id || r.eventId || r.event_id; const target = `/events/${eventId}/registrations/${r.id}`; if (location === target) { setViewReg(r); try { const { useModalManager } = require('@/contexts/ModalManagerContext'); const { openModal } = useModalManager(); openModal(() => setIsViewRegOpen(true)); } catch { setIsViewRegOpen(true); } } else { navigate(target); } }}>
                                <TableCell className="p-2 text-xs">{r.registrationCode}</TableCell>
                                <TableCell className="p-2 text-xs">{r.name}</TableCell>
                                <TableCell className="p-2 text-xs">{r.number || '-'}</TableCell>
                                <TableCell className="p-2 text-xs">{r.email || '-'}</TableCell>
                                <TableCell className="p-2 text-xs">{getStatusLabel(r.status) || r.status}</TableCell>
                                <TableCell className="p-2 text-xs">{((r as any).isConverted === 1 || (r as any).isConverted === '1' || (r as any).is_converted === 1 || (r as any).is_converted === '1') ? 'Yes' : 'No'}</TableCell>
                                <TableCell className="p-2 text-xs">{r.city || '-'}</TableCell>
                                <TableCell className="p-2 text-xs">{getSourceLabel(r.source) || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    {((filterEventId && filterEventId !== 'all') && total === 0) ? null : (
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <div>Showing {total === 0 ? 0 : start + 1}-{end} of {total}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span>Rows:</span>
                            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                              <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="xs" variant="outline" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                            <div className="px-2">Page {safePage} of {totalPages}</div>
                            <Button size="xs" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
          </>
        )}

        {/* Create Registration Modal (lead-style) */}
        <DetailsDialogLayout
          open={isAddRegOpen}
          onOpenChange={(open) => { setIsAddRegOpen(open); if (!open) { /* reset form if needed */ } }}
          title="Add Registration"
          headerClassName="bg-[#223E7D] text-white"
          headerLeft={(
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold leading-tight truncate">Add Registration</div>
                <div className="text-xs opacity-90 truncate">Create a registration for the selected event</div>
              </div>
            </div>
          )}
          headerRight={(
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="px-3 h-8 text-xs bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                onClick={() => setIsAddRegOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="px-3 h-8 text-xs bg-[#0071B0] hover:bg-[#00649D] text-white rounded-md"
                onClick={() => {
                  // trigger submission programmatically
                  const formEl = document.querySelector('#add-registration-form') as HTMLFormElement | null;
                  if (formEl) formEl.requestSubmit();
                }}
                disabled={addRegMutation.isPending}
              >
                {addRegMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )}
          leftContent={(
            <div className="space-y-4">
              <div className="space-y-4">
                <Card className="w-full shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center"><UserPlus className="w-4 h-4 mr-2" />Registration Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      id="add-registration-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const missing = !regForm.name || !regForm.number || !regForm.email || !regForm.city;
                        if (missing) { toast({ title: 'Please fill required fields', variant: 'destructive' }); return; }
                        if (!isValidEmail(regForm.email)) { toast({ title: 'Invalid email', variant: 'destructive' }); return; }
                        const targetEventId = regForm.eventId || filterEventId || selectedEvent?.id;
                        const existsEmail = (registrations || []).some((r: any) => String(r.eventId) === String(targetEventId) && r.email && regForm.email && String(r.email).toLowerCase() === String(regForm.email).toLowerCase());
                        const existsNumber = (registrations || []).some((r: any) => String(r.eventId) === String(targetEventId) && r.number && regForm.number && String(r.number) === String(regForm.number));
                        if (existsEmail || existsNumber) {
                          const msg = existsEmail && existsNumber ? 'Duplicate email and number for this event' : existsEmail ? 'Duplicate email for this event' : 'Duplicate number for this event';
                          toast({ title: msg, variant: 'destructive' });
                          return;
                        }

                        try {
                          const ev = (Array.isArray(visibleEvents) ? visibleEvents : []).find((e: any) => String(e.id) === String(targetEventId));
                          const payload: any = { ...regForm };
                          if (ev) {
                            if (ev.regionId || ev.region_id) payload.regionId = String(ev.regionId ?? ev.region_id);
                            if (ev.branchId || ev.branch_id) payload.branchId = String(ev.branchId ?? ev.branch_id);
                            if (ev.counsellorId || ev.counsellor_id) payload.counsellorId = String(ev.counsellorId ?? ev.counsellor_id);
                            if (ev.admissionOfficerId || ev.admission_officer_id) payload.admissionOfficerId = String(ev.admissionOfficerId ?? ev.admission_officer_id);
                          }
                          addRegMutation.mutate(payload);
                        } catch (e) {
                          addRegMutation.mutate(regForm);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <Label className="mb-1">Full Name</Label>
                          <Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} className="h-9" />
                        </div>

                        <div className="flex flex-col">
                          <Label className="mb-1">City</Label>
                          <Input value={regForm.city} onChange={(e) => setRegForm({ ...regForm, city: e.target.value })} className="h-9" />
                        </div>

                        <div className="flex flex-col">
                          <Label className="mb-1">Phone Number</Label>
                          <PhoneInput
                            value={regForm.number || ''}
                            onChange={(val) => setRegForm({ ...regForm, number: val })}
                            defaultCountry="in"
                            className="w-full"
                            inputClassName="w-full h-9 text-sm"
                            buttonClassName="h-9"
                          />
                        </div>

                        <div className="flex flex-col">
                          <Label className="mb-1">Email Address</Label>
                          <Input type="email" inputMode="email" autoComplete="email" value={regForm.email} onChange={(e) => { setRegForm({ ...regForm, email: e.target.value }); setEmailError(!isValidEmail(e.target.value)); }} className="h-9" />
                          {emailError && <div className="text-xs text-red-600 mt-1">Please enter a valid email address</div>}
                        </div>

                      </div>

                    </form>
                  </CardContent>
                </Card>

                <Card className="w-full shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center"><Users className="w-4 h-4 mr-2" />Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <Label className="mb-1">Region</Label>
                        <div className="text-xs px-2 py-2 rounded border bg-white">
                          {(() => {
                            const rid = (regForm as any).regionId || (selectedEvent as any)?.regionId || (selectedEvent as any)?.region_id || '';
                            const r = Array.isArray(regions) ? (regions as any[]).find((x: any) => String(x.id) === String(rid)) : null;
                            return r ? (r.regionName || (r as any).name || (r as any).id) : '—';
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <Label className="mb-1">Branch</Label>
                        <div className="text-xs px-2 py-2 rounded border bg-white">
                          {(() => {
                            const bid = (regForm as any).branchId || (selectedEvent as any)?.branchId || (selectedEvent as any)?.branch_id || '';
                            const b = Array.isArray(branches) ? (branches as any[]).find((x: any) => String(x.id) === String(bid)) : null;
                            return b ? ((b as any).branchName || (b as any).name || (b as any).code || (b as any).id) : '—';
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <Label className="mb-1">Counsellor</Label>
                        <div className="text-xs px-2 py-2 rounded border bg-white">
                          {(() => {
                            const cid = (regForm as any).counsellorId || (selectedEvent as any)?.counsellorId || (selectedEvent as any)?.counselorId || (selectedEvent as any)?.counsellor_id || (selectedEvent as any)?.counselor_id || '';
                            const u = Array.isArray(users) ? (users as any[]).find((x: any) => String(x.id) === String(cid)) : null;
                            if (!u) return '—';
                            const name = `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim();
                            return name || u.email || u.id;
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <Label className="mb-1">Admission Officer</Label>
                        <div className="text-xs px-2 py-2 rounded border bg-white">
                          {(() => {
                            const aid = (regForm as any).admissionOfficerId || (selectedEvent as any)?.admissionOfficerId || (selectedEvent as any)?.admission_officer_id || '';
                            const u = Array.isArray(users) ? (users as any[]).find((x: any) => String(x.id) === String(aid)) : null;
                            if (!u) return '—';
                            const name = `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim();
                            return name || u.email || u.id;
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        />

        {/* Edit Registration Modal */}
        <Dialog open={isEditRegOpen} onOpenChange={setIsEditRegOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4">
            <DialogHeader>
              <DialogTitle>Edit Registration</DialogTitle>
            </DialogHeader>
            {editingReg && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={editingReg.status} onValueChange={(v) => setEditingReg({ ...editingReg, status: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={editingReg.source || ''} onValueChange={(v) => setEditingReg({ ...editingReg, source: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Please select" /></SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Full Name</Label>
                  <Input value={editingReg.name || ''} onChange={(e) => setEditingReg({ ...editingReg, name: e.target.value })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={editingReg.city || ''} onChange={(e) => setEditingReg({ ...editingReg, city: e.target.value })} />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <PhoneInput
                    value={editingReg.number || ''}
                    onChange={(val) => setEditingReg({ ...editingReg, number: val })}
                    defaultCountry="in"
                    className="w-full"
                    inputClassName="w-full h-9 text-sm"
                    buttonClassName="h-9"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" inputMode="email" autoComplete="email" value={editingReg.email || ''} onChange={(e) => setEditingReg({ ...editingReg, email: e.target.value })} />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditRegOpen(false)}>Cancel</Button>
              <Button onClick={() => editingReg && updateRegMutation.mutate({ id: editingReg.id, data: { status: editingReg.status, name: editingReg.name, number: editingReg.number, email: editingReg.email, city: editingReg.city, source: editingReg.source } })} disabled={updateRegMutation.isPending || !editingReg?.name || (editingReg?.email ? !isValidEmail(editingReg.email) : false)}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Registration Modal - Redesigned to match Lead Details */}
        <DetailsDialogLayout
          open={isViewRegOpen}
          onOpenChange={(o) => {
            setIsViewRegOpen(o);
            if (!o) {
              const eventId = (regDetailParams && regDetailParams.id) || (regsParams && regsParams.id) || (selectedEvent && selectedEvent.id);
              setViewReg(null);
              if (eventId) navigate(`/events/${eventId}/registrations`);
            }
          }}
          title="Registration Details"
          headerClassName="bg-[#223E7D] text-white"
          statusBarWrapperClassName="px-4 py-2 bg-[#223E7D] text-white -mt-px"
          headerLeft={(
            <div className="text-base sm:text-lg font-semibold leading-tight truncate max-w-[60vw]">
              {viewReg ? (viewReg.name || 'Registration') : 'Registration'}
            </div>
          )}
          headerRight={(
            <div className="flex items-center gap-2">
              {viewReg && (() => {
                const converted = (viewReg as any).isConverted === 1 || (viewReg as any).isConverted === '1' || (viewReg as any).is_converted === 1 || (viewReg as any).is_converted === '1';
                if (converted) {
                  return (
                    <span className="px-2 py-1 rounded-md bg-green-600 text-white text-xs font-semibold uppercase tracking-wide border border-green-400 shadow-sm">Converted</span>
                  );
                }
                if (!isEditingView) {
                  return (
                    <>
                      <Button
                        variant="outline"
                        size="xs"
                        className="px-3 mr-2 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                        onClick={() => setIsEditingView(true)}
                        title="Edit"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="px-3 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
                        onClick={() => viewReg && openConvertToLeadModal(viewReg)}
                        disabled={convertMutation.isPending}
                        title="Convert to Lead"
                      >
                        {convertMutation.isPending ? 'Converting…' : 'Convert'}
                      </Button>
                    </>
                  );
                }
                return (
                  <>
                    <Button
                      size="xs"
                      className="bg-[#0071B0] hover:bg-[#00649D] text-white"
                      onClick={async () => {
                        if (!viewReg) return;
                        const payload = {
                          name: viewEditData.name || '',
                          number: viewEditData.number || '',
                          email: viewEditData.email || '',
                          city: viewEditData.city || '',
                          source: viewEditData.source || '',
                        } as Partial<RegService.RegistrationPayload>;
                        try {
                          // @ts-ignore mutateAsync exists
                          await updateRegMutation.mutateAsync({ id: viewReg.id, data: payload });
                          setIsEditingView(false);
                          setViewReg((prev: any) => prev ? { ...prev, ...payload } : prev);
                        } catch {}
                      }}
                      disabled={updateRegMutation.isPending || !viewEditData.name || (viewEditData.email ? !isValidEmail(viewEditData.email) : false)}
                      title="Save"
                    >
                      {updateRegMutation.isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      className="bg-white text-[#223E7D] hover:bg-white/90 border border-white"
                      onClick={() => { if (!viewReg) return; setIsEditingView(false); setViewEditData({
                        name: viewReg.name,
                        number: viewReg.number,
                        email: viewReg.email,
                        city: viewReg.city,
                        source: viewReg.source,
                        eventId: viewReg.eventId,
                        status: viewReg.status,
                      }); }}
                      title="Cancel"
                    >
                      Cancel
                    </Button>
                  </>
                );
              })()}
            </div>
          )}
          showDefaultClose
          autoHeight
          contentClassName="no-not-allowed max-w-3xl w-[90vw] p-0 rounded-xl shadow-xl"
          statusBar={viewReg ? <StatusProgressBarReg /> : undefined}
          leftContent={viewReg ? (
    <Card className="w-full shadow-md border border-gray-200 bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Registration Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label>Registration ID</Label>
            <div className="text-xs px-2 py-1.5 rounded border bg-white">{viewReg.registrationCode}</div>
          </div>
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            {isEditingView ? (
              <Input value={viewEditData.name || ''} onChange={(e) => setViewEditData(v => ({ ...v, name: e.target.value }))} className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white" />
            ) : (
              <div className="text-xs px-2 py-1.5 rounded border bg-white">{viewReg.name}</div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            {isEditingView ? (
              <PhoneInput
                value={viewEditData.number || ''}
                onChange={(val) => setViewEditData(v => ({ ...v, number: val }))}
                defaultCountry="in"
                className="w-full"
                inputClassName="w-full h-7 text-[11px]"
                buttonClassName="h-7"
              />
            ) : (
              <div className="relative phone-compact">
                <PhoneInput
                  value={String(viewReg.number || '')}
                  onChange={() => {}}
                  defaultCountry="in"
                  className="w-full"
                  inputClassName="w-full h-7 text-[11px]"
                  buttonClassName="h-7"
                  inputStyle={{ height: '28px' }}
                  buttonStyle={{ height: '28px' }}
                  disabled
                />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            {isEditingView ? (
              <Input type="email" inputMode="email" autoComplete="email" value={viewEditData.email || ''} onChange={(e) => setViewEditData(v => ({ ...v, email: e.target.value }))} className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white" />
            ) : (
              <div className="text-xs px-2 py-1.5 rounded border bg-white">{viewReg.email || '-'}</div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            {isEditingView ? (
              <Input value={viewEditData.city || ''} onChange={(e) => setViewEditData(v => ({ ...v, city: e.target.value }))} className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white" />
            ) : (
              <div className="text-xs px-2 py-1.5 rounded border bg-white">{viewReg.city || '-'}</div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Source</Label>
            {isEditingView ? (
              <Select value={viewEditData.source || ''} onValueChange={(v) => setViewEditData(d => ({ ...d, source: v }))}>
                <SelectTrigger className="h-7 text-[11px] shadow-sm border border-gray-300 bg-white"><SelectValue placeholder="Please select" /></SelectTrigger>
                <SelectContent>
                  {sourceOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs px-2 py-1.5 rounded border bg-white">{getSourceLabel(viewReg.source) || '-'}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  ) : undefined}
        />

        {/* Add Lead Modal (used for converting registrations) - use same UI as /leads/new */}
        <AddLeadModal
          open={addLeadModalOpen}
          onOpenChange={(open) => {
            setAddLeadModalOpen(open);
            if (!open) {
              try { queryClient.invalidateQueries({ queryKey: ['/api/leads'] }); queryClient.invalidateQueries({ queryKey: ['/api/event-registrations'] }); } catch {}
              refetchRegs?.();
              setShowList(true);
              setIsViewRegOpen(false);
              setIsAddRegOpen(false);
              setIsEditRegOpen(false);
              setViewReg(null);
            }
          }}
          initialData={leadInitialData || undefined}
        />

        {/* Import CSV Wizard */}
        <Dialog open={isImportOpen} onOpenChange={(o) => { setIsImportOpen(o); if (!o) { setImportStep(1); setImportErrors([]); setImportValidRows([]); setImportFileName(''); } }}>
          <DialogContent hideClose className="max-w-6xl w-[90vw] max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl flex flex-col">
            <DialogTitle className="sr-only">Import Registrations (CSV/Excel)</DialogTitle>
            <DialogHeader className="p-0">
              <div className="px-4 py-3 flex items-center justify-between bg-[#223E7D] text-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-semibold leading-tight truncate">Import Registrations</div>
                    <div className="text-xs opacity-90 truncate">CSV/Excel — validate and insert registrations</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {importStep === 2 && (
                    <>
                      <Button size="xs" variant="outline" className="bg-white text-black" onClick={() => setImportStep(1)}>Back</Button>
                      <Button size="xs" className="bg-white text-[#0071B0]" onClick={() => setImportStep(3)} disabled={!importFileName}>Next</Button>
                    </>
                  )}
                  {importStep === 3 && (
                    <>
                      <Button size="xs" variant="outline" className="bg-white text-black" onClick={() => setImportStep(2)}>Back</Button>
                      <Button size="xs" className="bg-[#0071B0] text-white" onClick={() => performImport()} disabled={isImporting || importValidRows.length === 0}>{isImporting ? 'Importing…' : `Insert ${importValidRows.length} rows`}</Button>
                    </>
                  )}
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setIsImportOpen(false)}
                    className="rounded-full w-8 h-8 inline-flex items-center justify-center bg-white/80 text-gray-700 hover:bg-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </DialogHeader>
            <div className="p-4 space-y-4 overflow-auto pb-24">
              <div className="flex items-center justify-between text-xs">
                <div className={`flex-1 px-2 py-1 rounded border ${importStep>=1?'border-primary text-primary':'border-gray-200 text-gray-500'}`}>1. Prepare</div>
                <div className="w-6 h-[1px] bg-gray-200" />
                <div className={`flex-1 px-2 py-1 rounded border ${importStep>=2?'border-primary text-primary':'border-gray-200 text-gray-500'}`}>2. Upload</div>
                <div className="w-6 h-[1px] bg-gray-200" />
                <div className={`flex-1 px-2 py-1 rounded border ${importStep>=3?'border-primary text-primary':'border-gray-200 text-gray-500'}`}>3. Validate & Insert</div>
              </div>

              {importStep === 1 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">Download the sample CSV, fill it, then proceed to upload. Event will be set to the currently selected event.</p>
                  <div className="flex gap-2">
                    <Button size="xs" onClick={downloadSampleCsv}>Download Sample Excel</Button>
                    <Button size="xs" variant="outline" onClick={() => { setImportStep(2); }}>Next</Button>
                  </div>
                </div>
              )}

              {importStep === 2 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Choose your CSV or Excel file to validate. No data will be inserted yet.</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
                    <span className="text-sm text-gray-700 truncate">{importFileName || 'No file selected'}</span>
                  </div>

                  {/* Preview of uploaded rows (if parsed) */}
                  {importValidRows && importValidRows.length > 0 ? (
                    <div className="border rounded p-2 bg-white">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-600">
                            <th className="px-2 py-1">#</th>
                            <th className="px-2 py-1">Name</th>
                            <th className="px-2 py-1">Phone</th>
                            <th className="px-2 py-1">Email</th>
                            <th className="px-2 py-1">City</th>
                            <th className="px-2 py-1">Source</th>
                            <th className="px-2 py-1">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importValidRows.map((r: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1 align-top text-[12px]">{i+1}</td>
                              <td className="px-2 py-1 align-top">{String(r.name || '')}</td>
                              <td className="px-2 py-1 align-top">{String(r.number || '')}</td>
                              <td className="px-2 py-1 align-top">{String(r.email || '')}</td>
                              <td className="px-2 py-1 align-top">{String(r.city || '')}</td>
                              <td className="px-2 py-1 align-top">{String(r.source || '')}</td>
                              <td className="px-2 py-1 align-top">{String(r.status || '')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No preview available. Select a file to see rows here.</div>
                  )}

                </div>
              )}

              {importStep === 3 && (
                <div className="space-y-3">
                  <div className="text-sm">
                    <div>File: <span className="font-medium">{importFileName || 'N/A'}</span></div>
                    <div className="mt-1">Validation: <span className={importErrors.length === 0 ? 'text-blue-600' : 'text-red-600'}>{importErrors.length === 0 ? 'No errors found' : `${importErrors.length} error(s)`}</span></div>
                    <div className="mt-1">Ready to insert: <span className="font-medium">{importValidRows.length}</span></div>
                  </div>

                  {/* Show all parsed rows in a large list view */}
                  <div className="border rounded p-2 bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-600">
                          <th className="px-2 py-1">#</th>
                          <th className="px-2 py-1">Name</th>
                          <th className="px-2 py-1">Phone</th>
                          <th className="px-2 py-1">Email</th>
                          <th className="px-2 py-1">City</th>
                          <th className="px-2 py-1">Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importAllRows.map((r: any, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1 align-top text-[12px]">{r.row}</td>
                            <td className="px-2 py-1 align-top">{String(r.name || '')}</td>
                            <td className="px-2 py-1 align-top">{String(r.number || '')}</td>
                            <td className="px-2 py-1 align-top">{String(r.email || '')}</td>
                            <td className="px-2 py-1 align-top">{String(r.city || '')}</td>
                            <td className="px-2 py-1 align-top text-red-600 text-[12px]">
                              {Array.isArray(r.errors) && r.errors.length > 0 ? r.errors.map((er: string, idx: number) => <div key={idx}>{er}</div>) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Show errors that don't map to row numbers (if any) */}
                    {importErrors.length > 0 && (
                      <div className="mt-2 text-xs text-red-700">
                        <div className="font-medium">Other errors:</div>
                        {importErrors.filter(e => !e.row).map((e, i) => <div key={i}>{e.message}</div>)}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Event Modal */}
        <DetailsDialogLayout
          open={Boolean(isEditRoute)}
          onOpenChange={(open) => navigate(open ? `/events/${editParams?.id}/edit` : (isRegsRoute && editParams?.id ? `/events/${editParams.id}/registrations` : '/events'))}
          title="Edit Event"
          headerClassName="bg-[#223E7D] text-white"
          headerLeft={(<div className="text-base font-semibold">Edit Event</div>)}
          headerRight={(
            <Button
              size="xs"
              className="px-3 mr-2 [&_svg]:size-3 bg-white text-black hover:bg-gray-100 border border-gray-300 rounded-md"
              onClick={() => {
                if (!editParams?.id) return;
                if (!editEvent.name || !editEvent.type || !editEvent.date || !editEvent.venue || !editEvent.time) {
                  toast({ title: 'Please fill all fields', variant: 'destructive' });
                  return;
                }

                const composed = `${editEvent.date}T${editEvent.time}`;
                const eventDate = new Date(composed);
                if (Number.isNaN(eventDate.getTime()) || eventDate.getTime() < Date.now()) {
                  toast({ title: 'Choose a future date and time in 15-minute steps.', variant: 'destructive' });
                  return;
                }

                if (!editEventAccess.regionId || !editEventAccess.branchId || !editEventAccess.counsellorId || !editEventAccess.admissionOfficerId) {
                  toast({ title: 'Select region, branch, counsellor, and admission officer.', variant: 'destructive' });
                  return;
                }

                const payload = {
                  ...editEvent,
                  regionId: String(editEventAccess.regionId),
                  branchId: String(editEventAccess.branchId),
                  counsellorId: String(editEventAccess.counsellorId),
                  admissionOfficerId: String(editEventAccess.admissionOfficerId),
                } as any;
                updateEventMutation.mutate({ id: String(editParams.id), data: payload });
              }}
              disabled={updateEventMutation.isPending}
            >
              {updateEventMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          )}
          showDefaultClose
          contentClassName="no-not-allowed max-w-3xl w-[90vw] max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl"
          leftContent={(
            <div className="space-y-4">
              <CollapsibleCard
                persistKey={`events:edit:${editParams?.id}:details`}
                header={<CardTitle className="flex items-center space-x-2"><Calendar className="w-4 h-4 text-primary" /><span>Event Details</span></CardTitle>}
                cardClassName="shadow-md border border-gray-200 bg-white"
                defaultOpen
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Event Name</Label>
                    <Input
                      value={editEvent.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        const sanitized = v.replace(/[^a-zA-Z\s]/g, '');
                        const singleSpaced = sanitized.replace(/\s+/g, ' ');
                        const trimmed = singleSpaced.replace(/^\s+/, '');
                        const title = trimmed.replace(/(^|\s)([a-z])/g, (_m, p1, p2) => p1 + String(p2).toUpperCase());
                        setEditEvent({ ...editEvent, name: title });
                      }}
                      inputMode="text"
                      pattern="[A-Za-z]+(?: [A-Za-z]+)*"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Input
                      value={editEvent.type}
                      onChange={(e) => {
                        const v = e.target.value;
                        const sanitized = v.replace(/[^a-zA-Z\s]/g, '');
                        const singleSpaced = sanitized.replace(/\s+/g, ' ');
                        const trimmed = singleSpaced.replace(/^\s+/, '');
                        const title = trimmed.replace(/(^|\s)([a-z])/g, (_m, p1, p2) => p1 + String(p2).toUpperCase());
                        setEditEvent({ ...editEvent, type: title });
                      }}
                      inputMode="text"
                      pattern="[A-Za-z]+(?: [A-Za-z]+)*"
                    />
                  </div>
                  <div>
                    <Label>Date & Time</Label>
                    <Input
                      type="datetime-local"
                      step={TIME_STEP_SECONDS}
                      min={minEventDateTime}
                      value={editEvent.date && editEvent.time ? `${editEvent.date}T${editEvent.time}` : ''}
                      onChange={(e) => handleEditEventDateTimeChange(e.target.value)}
                      readOnly={canUseNativePicker}
                      onFocus={(e) => openNativePicker(e.currentTarget)}
                      onClick={(e) => openNativePicker(e.currentTarget)}
                    />
                  </div>
                  <div>
                    <Label>Venue</Label>
                    <Input
                      value={editEvent.venue}
                      onChange={(e) => {
                        const v = e.target.value;
                        const sanitized = v.replace(/[^a-zA-Z\s]/g, '');
                        const singleSpaced = sanitized.replace(/\s+/g, ' ');
                        const trimmed = singleSpaced.replace(/^\s+/, '');
                        const title = trimmed.replace(/(^|\s)([a-z])/g, (_m, p1, p2) => p1 + String(p2).toUpperCase());
                        setEditEvent({ ...editEvent, venue: title });
                      }}
                      inputMode="text"
                      pattern="[A-Za-z]+(?: [A-Za-z]+)*"
                    />
                  </div>
                </div>
              </CollapsibleCard>

              <CollapsibleCard
                persistKey={`events:edit:${editParams?.id}:access`}
                header={<CardTitle className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-primary" /><span>Event Access</span></CardTitle>}
                cardClassName="shadow-md border border-gray-200 bg-white"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Region</Label>
                    <Select value={editEventAccess.regionId} onValueChange={(v) => setEditEventAccess((a) => ({ ...a, regionId: v, branchId: '', counsellorId: '', admissionOfficerId: '' }))}>
                      <SelectTrigger className="h-8 text-sm" disabled={disableByView.region}><SelectValue placeholder="Select region" /></SelectTrigger>
                      <SelectContent>
                        {Array.isArray(regions) && regions.map((r: any) => (
                          <SelectItem key={r.id} value={String(r.id)}>{r.regionName || r.name || r.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <Select value={editEventAccess.branchId} onValueChange={(v) => setEditEventAccess((a) => ({ ...a, branchId: v, counsellorId: '', admissionOfficerId: '' }))}>
                      <SelectTrigger className="h-8 text-sm" disabled={disableByView.branch}><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        {filteredBranchesEdit.map((b: any) => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.branchName || b.name || b.code || b.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Counsellor</Label>
                    <Select value={editEventAccess.counsellorId || ''} onValueChange={(v) => setEditEventAccess((a) => ({ ...a, counsellorId: v }))}>
                      <SelectTrigger className="h-8 text-sm" disabled={disableByView.counsellor}><SelectValue placeholder="Select counsellor" /></SelectTrigger>
                      <SelectContent>
                        {counselorOptionsEdit.map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>{`${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || (u.email || 'User')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Admission Officer</Label>
                    <Select value={editEventAccess.admissionOfficerId || ''} onValueChange={(v) => setEditEventAccess((a) => ({ ...a, admissionOfficerId: v }))}>
                      <SelectTrigger className="h-8 text-sm" disabled={disableByView.admissionOfficer}><SelectValue placeholder="Select officer" /></SelectTrigger>
                      <SelectContent>
                        {admissionOfficerOptionsEdit.map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>{`${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || (u.email || 'User')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleCard>

            </div>
          )}
        />

        {/* Create Event Modal */}
        <DetailsDialogLayout
          open={Boolean(isCreateRoute)}
          onOpenChange={(open) => navigate(open ? '/events/new' : '/events')}
          title="Create Event"
          headerClassName="bg-[#223E7D] text-white"
          headerLeft={(<div className="text-base font-semibold">Create Event</div>)}
          headerRight={(
            <Button
              size="xs"
              className="px-3 mr-2 [&_svg]:size-3 bg-[#0071B0] hover:bg-[#00649D] text-white"
              onClick={handleCreateEvent}
              disabled={addEventMutation.isPending}
            >
              {addEventMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          )}
          showDefaultClose
          contentClassName="no-not-allowed max-w-3xl w-[90vw] max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-xl"
          leftContent={(
            <div className="space-y-4">
              <CollapsibleCard
                persistKey={`events:new:details`}
                header={<CardTitle className="flex items-center space-x-2"><Calendar className="w-4 h-4 text-primary" /><span>Event Details</span></CardTitle>}
                cardClassName="shadow-md border border-gray-200 bg-white"
                defaultOpen
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Event Name</Label>
                    <Input
                      value={newEvent.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        const sanitized = v.replace(/[^a-zA-Z\s]/g, '');
                        const singleSpaced = sanitized.replace(/\s+/g, ' ');
                        const trimmed = singleSpaced.replace(/^\s+/, '');
                        const title = trimmed.replace(/(^|\s)([a-z])/g, (_m, p1, p2) => p1 + String(p2).toUpperCase());
                        setNewEvent({ ...newEvent, name: title });
                      }}
                      inputMode="text"
                      pattern="[A-Za-z]+(?: [A-Za-z]+)*"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Input
                      value={newEvent.type}
                      onChange={(e) => {
                        const v = e.target.value;
                        const sanitized = v.replace(/[^a-zA-Z\s]/g, '');
                        const singleSpaced = sanitized.replace(/\s+/g, ' ');
                        const trimmed = singleSpaced.replace(/^\s+/, '');
                        const title = trimmed.replace(/(^|\s)([a-z])/g, (_m, p1, p2) => p1 + String(p2).toUpperCase());
                        setNewEvent({ ...newEvent, type: title });
                      }}
                      inputMode="text"
                      pattern="[A-Za-z]+(?: [A-Za-z]+)*"
                    />
                  </div>
                  <div>
                    <Label>Date & Time</Label>
                    <Input
                      type="datetime-local"
                      step={TIME_STEP_SECONDS}
                      min={minEventDateTime}
                      value={newEvent.date && newEvent.time ? `${newEvent.date}T${newEvent.time}` : ''}
                      onChange={(e) => handleNewEventDateTimeChange(e.target.value)}
                      readOnly={canUseNativePicker}
                      onFocus={(e) => openNativePicker(e.currentTarget)}
                      onClick={(e) => openNativePicker(e.currentTarget)}
                    />
                  </div>
                  <div>
                    <Label>Venue</Label>
                    <Input
                      value={newEvent.venue}
                      onChange={(e) => {
                        const v = e.target.value;
                        const sanitized = v.replace(/[^a-zA-Z\s]/g, '');
                        const singleSpaced = sanitized.replace(/\s+/g, ' ');
                        const trimmed = singleSpaced.replace(/^\s+/, '');
                        const title = trimmed.replace(/(^|\s)([a-z])/g, (_m, p1, p2) => p1 + String(p2).toUpperCase());
                        setNewEvent({ ...newEvent, venue: title });
                      }}
                      inputMode="text"
                      pattern="[A-Za-z]+(?: [A-Za-z]+)*"
                    />
                  </div>
                </div>
              </CollapsibleCard>

              <CollapsibleCard
                persistKey={`events:new:access`}
                header={<CardTitle className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-primary" /><span>Event Access</span></CardTitle>}
                cardClassName="shadow-md border border-gray-200 bg-white"
                defaultOpen
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Region</Label>
                    <Select value={eventAccess.regionId} onValueChange={(v) => setEventAccess((a) => ({ ...a, regionId: v, branchId: '', counsellorId: '', admissionOfficerId: '' }))}>
                      <SelectTrigger className="h-8 text-sm" disabled={disableByView.region}><SelectValue placeholder="Select region" /></SelectTrigger>
                      <SelectContent>
                        {Array.isArray(regions) && regions.map((r: any) => (
                          <SelectItem key={r.id} value={String(r.id)}>{r.regionName || r.name || r.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <Select value={eventAccess.branchId} onValueChange={(v) => setEventAccess((a) => ({ ...a, branchId: v, counsellorId: '', admissionOfficerId: '' }))}>
                      <SelectTrigger className="h-8 text-sm" disabled={disableByView.branch}><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        {filteredBranches.map((b: any) => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.branchName || b.name || b.code || b.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Counsellor</Label>
                    <Select value={eventAccess.counsellorId || ''} onValueChange={(v) => setEventAccess((a) => ({ ...a, counsellorId: v }))}>
                      <SelectTrigger className="h-8 text-sm" disabled={disableByView.counsellor && !( ( (String((user as any)?.role || (user as any)?.role_name || tokenPayload?.role_details?.role_name || '')).toLowerCase().includes('counsel') ) && isCreateRoute ) }><SelectValue placeholder="Select counsellor" /></SelectTrigger>
                      <SelectContent>
                        {counselorOptions.map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>{`${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || (u.email || 'User')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Admission Officer</Label>
                    <Select value={eventAccess.admissionOfficerId || ''} onValueChange={(v) => setEventAccess((a) => ({ ...a, admissionOfficerId: v }))}>
                      <SelectTrigger className="h-8 text-sm" disabled={disableByView.admissionOfficer && !( ( (String((user as any)?.role || (user as any)?.role_name || tokenPayload?.role_details?.role_name || '')).toLowerCase().includes('admission') ) && isCreateRoute ) }><SelectValue placeholder="Select officer" /></SelectTrigger>
                      <SelectContent>
                        {admissionOfficerOptions.map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>{`${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || (u.email || 'User')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleCard>

            </div>
          )}
        />
      </div>
    </Layout>
  );
}
