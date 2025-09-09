import { useEffect, useMemo, useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import * as EventsService from '@/services/events';
import * as RegService from '@/services/event-registrations';
import * as DropdownsService from '@/services/dropdowns';
import { Plus, Edit, UserPlus, Trash2, Calendar, Upload, MapPin, Clock, ArrowRight, ChevronLeft } from 'lucide-react';
import AddLeadForm from '@/components/add-lead-form';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';


export default function EventsPage() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
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

  // Import CSV wizard state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importErrors, setImportErrors] = useState<{ row: number; message: string }[]>([]);
  const [importValidRows, setImportValidRows] = useState<RegService.RegistrationPayload[]>([]);
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
                  isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500 hover:border-green-500'
                }`}>
                  {isCompleted ? <div className="w-1 h-1 bg-white rounded-full" /> : <div className="w-1 h-1 bg-gray-300 rounded-full" />}
                </div>
                <span className={`mt-1 text-[11px] font-medium text-center ${
                  isCompleted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                }`}>
                  {statusName}
                </span>
                {index < sequence.length - 1 && (
                  <div className={`absolute top-2 left-1/2 w-full h-0.5 transform -translate-y-1/2 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                  }`} style={{ marginLeft: '0.625rem', width: 'calc(100% - 1.25rem)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const { data: events, refetch: refetchEvents } = useQuery({
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

  const addEventMutation = useMutation({
    mutationFn: EventsService.createEvent,
    onSuccess: () => { toast({ title: 'Event created' }); refetchEvents(); setIsAddEventOpen(false); },
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

  const convertMutation = useMutation({
    mutationFn: (id: string) => RegService.convertToLead(id),
    onSuccess: () => toast({ title: 'Converted to Lead' }),
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
      source: reg.source,
      status: 'new',
      eventRegId: reg.id,
    });
    setAddLeadModalOpen(true);
  };

  const [newEvent, setNewEvent] = useState({ name: '', type: '', date: '', venue: '', time: '' });
  const [regForm, setRegForm] = useState<RegService.RegistrationPayload>({ status: 'attending', name: '', number: '', email: '', city: '', source: '', eventId: '' });
  const [emailError, setEmailError] = useState(false);

  const handleCreateEvent = () => {
    if (!newEvent.name || !newEvent.type || !newEvent.date || !newEvent.venue || !newEvent.time) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    addEventMutation.mutate(newEvent);
  };

  const openAddRegistration = () => {
    if (!filterEventId || filterEventId === 'all') {
      toast({ title: 'Select an Event first', variant: 'destructive' });
      return;
    }
    const defaultStatus = statusOptions.find((o: any) => o.isDefault);
    const defaultSource = sourceOptions.find((o: any) => o.isDefault);
    setRegForm({ status: defaultStatus ? defaultStatus.value : '', name: '', number: '', email: '', city: '', source: defaultSource ? String(defaultSource.value) : '', eventId: filterEventId });
    setIsAddRegOpen(true);
  };

  const handleImportClick = () => {
    if (!filterEventId || filterEventId === 'all') {
      toast({ title: 'Select an Event to import into', variant: 'destructive' });
      return;
    }
    setIsImportOpen(true);
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
    // Sheet 1: registrations sample
    const registrationsAOA = [
      ['name','number','email','city','source','status'],
      ['John Doe','+11234567890','john@example.com','New York','Website','attending'],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(registrationsAOA);
    XLSX.utils.book_append_sheet(wb, ws1, 'registrations');

    // Sheet 2: dropdowns (allowed values)
    const allowedStatus = statusOptions.map(o => [o.label, o.value]);
    const allowedSources = (sourceOptions && sourceOptions.length > 0)
      ? sourceOptions.map((o: any) => [o.label, o.value])
      : [['Website','Website']];
    const aoa: any[][] = [];
    aoa.push(['Status - Allowed values']);
    aoa.push(['Label','Value']);
    for (const row of allowedStatus) aoa.push(row);
    aoa.push([]);
    aoa.push(['Source - Allowed values']);
    aoa.push(['Label','Value']);
    for (const row of allowedSources) aoa.push(row);
    const ws2 = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws2, 'dropdowns');

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
    const need = ['name', 'number', 'email', 'city', 'source', 'status'];
    for (const col of need) if (!header.includes(col)) errors.push({ row: 0, message: `Missing column: ${col}` });
    if (errors.length > 0) { setImportErrors(errors); setImportValidRows([]); return; }

    const idx = (k: string) => header.indexOf(k);
    const nameIdx = idx('name');
    const numberIdx = idx('number');
    const emailIdx = idx('email');
    const cityIdx = idx('city');
    const sourceIdx = idx('source');
    const statusIdx = idx('status');

    const seenEmails = new Map<string, number>();
    const seenNumbers = new Map<string, number>();
    const allowedStatusLabels = statusOptions.map(o => o.label).join(', ');
    const allowedStatusValues = statusOptions.map(o => o.value).join(', ');

    for (let i = 1; i < matrix.length; i++) {
      const rowNo = i + 1;
      const cols = matrix[i] || [];
      const name = String(cols[nameIdx] ?? '').trim();
      const number = String(cols[numberIdx] ?? '').trim();
      const email = String(cols[emailIdx] ?? '').trim();
      const city = String(cols[cityIdx] ?? '').trim();
      const source = String(cols[sourceIdx] ?? '').trim();
      const statusRaw = String(cols[statusIdx] ?? '').trim();
      const status = normalizeStatus(statusRaw);

      const rowErrors: string[] = [];
      if (!name) rowErrors.push('Name is required');
      if (!number) rowErrors.push('Number is required');
      if (!email) rowErrors.push('Email is required');
      if (!city) rowErrors.push('City is required');
      if (!source) rowErrors.push('Source is required');
      if (!status) rowErrors.push(`Status is invalid: got "${statusRaw}". Allowed: ${allowedStatusLabels} (values: ${allowedStatusValues})`);
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

      if (rowErrors.length > 0) {
        errors.push({ row: rowNo, message: rowErrors.join('; ') });
      } else {
        valid.push({ status, name, number, email, city, source, eventId: filterEventId } as RegService.RegistrationPayload);
      }
    }

    setImportErrors(errors);
    setImportValidRows(valid);
  };

  const eventOptions = [{ label: 'All Events', value: 'all' }, ...((events || []).map((e: any) => ({ label: `${e.name} (${e.date})`, value: e.id })))];
  const selectedEvent = useMemo(() => (events || []).find((e: any) => e.id === filterEventId), [events, filterEventId]);

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
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Events</span>
            {showList && selectedEvent && (
              <span className="ml-2 inline-flex items-center gap-3">
                <span className="inline-flex items-center bg-primary-50 text-primary-700 rounded-md px-2 py-0.5 text-xs font-semibold border border-primary-200 shadow-sm">
                  {selectedEvent.name}
                </span>
                <span className="text-[11px] text-gray-500">on {formatEventDate(selectedEvent.date)}{selectedEvent.time ? ` at ${formatEventTime(selectedEvent.time)}` : ''}</span>
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            {!showList && (
              <Button size="xs" variant="default" onClick={() => setIsAddEventOpen(true)} className="rounded-full px-3"><Plus className="w-3 h-3 mr-1" />Add Event</Button>
            )}
            {showList && selectedEvent && (
              <div className="ml-2 inline-flex items-center">
                <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 inline-flex items-center">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 mr-1" />
                  <span>{countdown}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {!showList && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(events || []).map((e: any) => { const p = getPalette(e.type); return (
              <Card key={e.id} className={`group cursor-pointer rounded-xl border bg-white hover:shadow-md transition overflow-hidden ${p.cardBorder}`} onClick={() => { setFilterEventId(e.id); setShowList(true); }}>
                <div className={`h-1 bg-gradient-to-r ${p.gradientFrom} ${p.gradientTo}`} />
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm line-clamp-2">{e.name}</CardTitle>
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
                    <span className={`inline-flex items-center text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 border ${p.badgeBg} ${p.badgeText} ${p.badgeBorder}`}>{e.type}</span>
                  </div>
                  <div className="pt-1">
                    <div className={`inline-flex items-center text-[11px] group-hover:translate-x-0.5 transition ${p.text}`}>
                      View Registrations
                      <ArrowRight className="ml-1 w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ); })}
          </div>
        )}

        {showList && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowList(false)} className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted/50">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <CardTitle className="text-sm flex items-center">Event Registrations</CardTitle>
                </div>
                <div className="flex items-center gap-2">
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
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const safePage = Math.min(Math.max(1, page), totalPages);
                const start = (safePage - 1) * pageSize;
                const end = Math.min(start + pageSize, total);
                const pageItems = list.slice(start, end);
                if (safePage !== page) setPage(safePage);
                return (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-8 px-2 text-[11px]">Registration ID</TableHead>
                            <TableHead className="h-8 px-2 text-[11px]">Name</TableHead>
                            <TableHead className="h-8 px-2 text-[11px]">Number</TableHead>
                            <TableHead className="h-8 px-2 text-[11px]">Email</TableHead>
                            <TableHead className="h-8 px-2 text-[11px]">Status</TableHead>
                            <TableHead className="h-8 px-2 text-[11px]">Converted</TableHead>
                            <TableHead className="h-8 px-2 text-[11px]">City</TableHead>
                            <TableHead className="h-8 px-2 text-[11px]">Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pageItems.map((r: any) => (
                            <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setViewReg(r); setIsViewRegOpen(true); }}>
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
                    </div>

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
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Create Registration Modal */}
        <Dialog open={isAddRegOpen} onOpenChange={setIsAddRegOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Add Registration</DialogTitle>
                <span className="text-xs text-gray-500">Add attendee to the selected event</span>
              </div>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const missing = !regForm.status || !regForm.name || !regForm.number || !regForm.email || !regForm.city || !regForm.source || !regForm.eventId;
                if (missing) { toast({ title: 'All fields are required', variant: 'destructive' }); return; }
                if (!isValidEmail(regForm.email)) { toast({ title: 'Invalid email', variant: 'destructive' }); return; }
                const existsEmail = (registrations || []).some((r: any) => r.eventId === regForm.eventId && r.email && regForm.email && String(r.email).toLowerCase() === String(regForm.email).toLowerCase());
                const existsNumber = (registrations || []).some((r: any) => r.eventId === regForm.eventId && r.number && regForm.number && String(r.number) === String(regForm.number));
                if (existsEmail || existsNumber) {
                  const msg = existsEmail && existsNumber ? 'Duplicate email and number for this event' : existsEmail ? 'Duplicate email for this event' : 'Duplicate number for this event';
                  toast({ title: msg, variant: 'destructive' });
                  return;
                }
                addRegMutation.mutate(regForm);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <Label className="mb-1">Status</Label>
                  <Select value={regForm.status} onValueChange={(v) => setRegForm({ ...regForm, status: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col">
                  <Label className="mb-1">Source</Label>
                  <Select value={regForm.source || ''} onValueChange={(v) => setRegForm({ ...regForm, source: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select Source" /></SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col">
                  <Label className="mb-1">Name</Label>
                  <Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} className="h-9" />
                </div>

                <div className="flex flex-col">
                  <Label className="mb-1">City</Label>
                  <Input value={regForm.city} onChange={(e) => setRegForm({ ...regForm, city: e.target.value })} className="h-9" />
                </div>

                <div className="flex flex-col">
                  <Label className="mb-1">Number</Label>
                  <Input type="tel" inputMode="tel" autoComplete="tel" pattern="^[+0-9()\\-\\s]*$" value={regForm.number} onChange={(e) => setRegForm({ ...regForm, number: e.target.value })} className="h-9" />
                </div>

                <div className="flex flex-col">
                  <Label className="mb-1">Email</Label>
                  <Input type="email" inputMode="email" autoComplete="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} className="h-9" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setIsAddRegOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addRegMutation.isPending}>{addRegMutation.isPending ? 'Saving…' : 'Save Registration'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Source" /></SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Name</Label>
                  <Input value={editingReg.name || ''} onChange={(e) => setEditingReg({ ...editingReg, name: e.target.value })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={editingReg.city || ''} onChange={(e) => setEditingReg({ ...editingReg, city: e.target.value })} />
                </div>

                <div>
                  <Label>Number</Label>
                  <Input type="tel" inputMode="tel" autoComplete="tel" pattern="^[+0-9()\-\s]*$" value={editingReg.number || ''} onChange={(e) => setEditingReg({ ...editingReg, number: e.target.value })} />
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

        {/* View Registration Modal */}
        <Dialog open={isViewRegOpen} onOpenChange={(o) => { setIsViewRegOpen(o); if (!o) setViewReg(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogTitle className="sr-only">Registration Details</DialogTitle>
            {viewReg && (
              <Card>
                <CardHeader className="pb-2 space-y-2">
                  <div className="flex-1">
                    <StatusProgressBarReg />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs">Registration Information</CardTitle>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const converted = viewReg && ((viewReg as any).isConverted === 1 || (viewReg as any).isConverted === '1' || (viewReg as any).is_converted === 1 || (viewReg as any).is_converted === '1');
                        if (converted) {
                          return (
                            <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">Converted</span>
                          );
                        }

                        if (!isEditingView) {
                          return (
                            <>
                              <Button
                                variant="outline"
                                size="xs"
                                className="rounded-full px-2 [&_svg]:size-3"
                                onClick={() => setIsEditingView(true)}
                                title="Edit"
                              >
                                <Edit />
                                <span className="hidden lg:inline">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                className="rounded-full px-2 [&_svg]:size-3"
                                onClick={() => openConvertToLeadModal(viewReg)}
                                disabled={convertMutation.isPending}
                                title="Convert to Lead"
                              >
                                <UserPlus />
                                <span className="hidden lg:inline">{convertMutation.isPending ? 'Converting…' : 'Convert to Lead'}</span>
                              </Button>
                            </>
                          );
                        }

                        return (
                          <>
                            <Button
                              size="xs"
                              className="rounded-full px-2 [&_svg]:size-3"
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
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              className="rounded-full px-2 [&_svg]:size-3"
                              onClick={() => { setIsEditingView(false); setViewEditData({
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
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label>Registration ID</Label>
                      <div className="text-xs">{viewReg.registrationCode}</div>
                    </div>
                    <div>
                      <Label>Name</Label>
                      {isEditingView ? (
                        <Input value={viewEditData.name || ''} onChange={(e) => setViewEditData(v => ({ ...v, name: e.target.value }))} />
                      ) : (
                        <div className="text-xs">{viewReg.name}</div>
                      )}
                    </div>
                    <div>
                      <Label>Number</Label>
                      {isEditingView ? (
                        <Input type="tel" inputMode="tel" autoComplete="tel" pattern="^[+0-9()\-\s]*$" value={viewEditData.number || ''} onChange={(e) => setViewEditData(v => ({ ...v, number: e.target.value }))} />
                      ) : (
                        <div className="text-xs">{viewReg.number || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Email</Label>
                      {isEditingView ? (
                        <Input type="email" inputMode="email" autoComplete="email" value={viewEditData.email || ''} onChange={(e) => setViewEditData(v => ({ ...v, email: e.target.value }))} />
                      ) : (
                        <div className="text-xs">{viewReg.email || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label>City</Label>
                      {isEditingView ? (
                        <Input value={viewEditData.city || ''} onChange={(e) => setViewEditData(v => ({ ...v, city: e.target.value }))} />
                      ) : (
                        <div className="text-xs">{viewReg.city || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Source</Label>
                      {isEditingView ? (
                        <Select value={viewEditData.source || ''} onValueChange={(v) => setViewEditData(d => ({ ...d, source: v }))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Source" /></SelectTrigger>
                          <SelectContent>
                            {sourceOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-xs">{getSourceLabel(viewReg.source) || '-'}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Lead Modal (used for converting registrations) */}
        <Dialog open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <DialogHeader>
              <DialogTitle className="sr-only">Add New Lead</DialogTitle>
            </DialogHeader>
            <AddLeadForm
              onCancel={() => setAddLeadModalOpen(false)}
              onSuccess={() => { setAddLeadModalOpen(false); queryClient.invalidateQueries({ queryKey: ['/api/leads'] }); queryClient.invalidateQueries({ queryKey: ['/api/event-registrations'] }); }}
              initialData={leadInitialData || undefined}
            />
          </DialogContent>
        </Dialog>

        {/* Import CSV Wizard */}
        <Dialog open={isImportOpen} onOpenChange={(o) => { setIsImportOpen(o); if (!o) { setImportStep(1); setImportErrors([]); setImportValidRows([]); setImportFileName(''); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Registrations (CSV/Excel)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                  <p className="text-xs text-gray-600">Choose your CSV or Excel file to validate. No data will be inserted yet.</p>
                  <div className="flex items-center gap-2">
                    <Button size="xs" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
                    <span className="text-xs text-gray-700 truncate">{importFileName || 'No file selected'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" onClick={() => setImportStep(1)}>Back</Button>
                  </div>
                </div>
              )}

              {importStep === 3 && (
                <div className="space-y-3">
                  <div className="text-xs">
                    <div>File: <span className="font-medium">{importFileName || 'N/A'}</span></div>
                    <div className="mt-1">Validation: <span className={importErrors.length === 0 ? 'text-green-600' : 'text-red-600'}>{importErrors.length === 0 ? 'No errors found' : `${importErrors.length} error(s)`}</span></div>
                    <div className="mt-1">Ready to insert: <span className="font-medium">{importValidRows.length}</span></div>
                  </div>
                  {importErrors.length > 0 && (
                    <div className="max-h-40 overflow-auto border rounded p-2 bg-red-50 text-red-700 text-[11px]">
                      {importErrors.slice(0, 50).map((e, i) => (
                        <div key={i}>Row {e.row}: {e.message}</div>
                      ))}
                      {importErrors.length > 50 && (<div>+{importErrors.length - 50} more…</div>)}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" onClick={() => setImportStep(2)}>Back</Button>
                    <Button size="xs" disabled={isImporting || importValidRows.length === 0} onClick={async () => {
                      setIsImporting(true);
                      let success = 0; let failed = 0;
                      for (const row of importValidRows) {
                        try { // eslint-disable-next-line no-await-in-loop
                          await RegService.createRegistration(row);
                          success++;
                        } catch { failed++; }
                      }
                      setIsImporting(false);
                      toast({ title: 'Import finished', description: `${success} added, ${failed} failed` });
                      setIsImportOpen(false);
                      setImportStep(1);
                      setImportErrors([]);
                      setImportValidRows([]);
                      setImportFileName('');
                      refetchRegs();
                    }}>{isImporting ? 'Importing��' : `Insert ${importValidRows.length} rows`}</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Event Modal */}
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Event Name</Label>
                <Input
                  value={newEvent.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    const title = v.replace(/(^|\s)([a-z])/g, (_m, p1, p2) => p1 + String(p2).toUpperCase());
                    setNewEvent({ ...newEvent, name: title });
                  }}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Input value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })} />
              </div>
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  step="60"
                  value={newEvent.date && newEvent.time ? `${newEvent.date}T${newEvent.time}` : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) {
                      setNewEvent({ ...newEvent, date: '', time: '' });
                      return;
                    }
                    const [d, t] = v.split('T');
                    setNewEvent({ ...newEvent, date: d || '', time: (t || '').slice(0, 5) });
                  }}
                />
              </div>
              <div>
                <Label>Venue</Label>
                <Input value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateEvent} disabled={addEventMutation.isPending}>{addEventMutation.isPending ? 'Creating…' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
