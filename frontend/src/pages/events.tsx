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
import { Plus, Edit, UserPlus, Trash2, Calendar, Upload, MapPin, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { label: 'Not Sure', value: 'not_sure' },
  { label: 'Unable to Contact', value: 'unable_to_contact' },
  { label: 'Will Not Attend', value: 'will_not_attend' },
  { label: 'Attending', value: 'attending' },
];

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

  const isValidEmail = (s?: string) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || '');

  const StatusProgressBarReg = () => {
    if (!viewReg) return null;
    const sequence = STATUS_OPTIONS.map(s => s.value);
    const currentIndex = sequence.findIndex(v => v === viewReg.status);

    const getLabel = (value: string) => STATUS_OPTIONS.find(o => o.value === value)?.label || value;

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
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value }));
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

  const [newEvent, setNewEvent] = useState({ name: '', type: '', date: '', venue: '', time: '' });
  const [regForm, setRegForm] = useState<RegService.RegistrationPayload>({ status: 'attending', name: '', number: '', email: '', city: '', source: '', eventId: '' });

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
    setRegForm({ status: 'attending', name: '', number: '', email: '', city: '', source: '', eventId: filterEventId });
    setIsAddRegOpen(true);
  };

  const handleImportClick = () => {
    if (!filterEventId || filterEventId === 'all') {
      toast({ title: 'Select an Event to import into', variant: 'destructive' });
      return;
    }
    fileInputRef.current?.click();
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
    const sample = ['name,number,email,city,source,status', 'John Doe,+11234567890,john@example.com,New York,Website,attending'].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event-registrations-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const normalizeStatus = (s: string) => {
    const v = String(s || '').trim();
    if (!v) return '';
    const byValue = STATUS_OPTIONS.find(o => o.value.toLowerCase() === v.toLowerCase());
    if (byValue) return byValue.value;
    const byLabel = STATUS_OPTIONS.find(o => o.label.toLowerCase() === v.toLowerCase());
    return byLabel ? byLabel.value : '';
  };

  const validateCsvText = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const errors: { row: number; message: string }[] = [];
    const valid: RegService.RegistrationPayload[] = [];
    if (lines.length === 0) {
      setImportErrors([{ row: 0, message: 'Empty file' }]);
      setImportValidRows([]);
      return;
    }
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
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

    const seenEmails = new Set<string>();
    const seenNumbers = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const rowNo = i + 1;
      const cols = lines[i].split(',');
      const name = cols[nameIdx]?.trim() || '';
      const number = cols[numberIdx]?.trim() || '';
      const email = cols[emailIdx]?.trim() || '';
      const city = cols[cityIdx]?.trim() || '';
      const source = cols[sourceIdx]?.trim() || '';
      const statusRaw = cols[statusIdx]?.trim() || '';
      const status = normalizeStatus(statusRaw);

      const rowErrors: string[] = [];
      if (!name) rowErrors.push('Name is required');
      if (!number) rowErrors.push('Number is required');
      if (!email) rowErrors.push('Email is required');
      if (!city) rowErrors.push('City is required');
      if (!source) rowErrors.push('Source is required');
      if (!status) rowErrors.push('Status is invalid');
      if (email && !isValidEmail(email)) rowErrors.push('Email is invalid');

      const emailKey = email.toLowerCase();
      if (seenEmails.has(emailKey)) rowErrors.push('Duplicate email within file');
      else seenEmails.add(emailKey);
      if (seenNumbers.has(number)) rowErrors.push('Duplicate number within file');
      else seenNumbers.add(number);

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
  const selectedLabel = filterEventId === 'all' ? 'All Events' : (selectedEvent ? `${selectedEvent.name} (${selectedEvent.date})` : '');

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
          <h1 className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" />Events</h1>
          <div className="flex items-center gap-2">
            {showList && filterEventId && filterEventId !== 'all' && (
              <>
                <Button size="xs" variant="default" onClick={openAddRegistration} className="rounded-full px-3"><Plus className="w-3 h-3 mr-1" />Add Registration</Button>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setImportFileName(f.name); await validateCsvText(f); setImportStep(3); } e.currentTarget.value = ''; }} />
                <Button size="xs" variant="default" onClick={handleImportClick} className="rounded-full px-3"><Upload className="w-3 h-3 mr-1" />Import CSV</Button>
              </>
            )}
            {!showList && (
              <Button size="xs" variant="default" onClick={() => setIsAddEventOpen(true)} className="rounded-full px-3"><Plus className="w-3 h-3 mr-1" />Add Event</Button>
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
                <CardTitle className="text-sm">Event Registrations{selectedLabel ? ` - ${selectedLabel}` : ''}</CardTitle>
                <Button size="xs" variant="outline" onClick={() => setShowList(false)} className="rounded-full px-3">Back to Events</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 px-2 text-[11px]">Registration ID</TableHead>
                      <TableHead className="h-8 px-2 text-[11px]">Name</TableHead>
                      <TableHead className="h-8 px-2 text-[11px]">Number</TableHead>
                      <TableHead className="h-8 px-2 text-[11px]">Email</TableHead>
                      <TableHead className="h-8 px-2 text-[11px]">Status</TableHead>
                      <TableHead className="h-8 px-2 text-[11px]">City</TableHead>
                      <TableHead className="h-8 px-2 text-[11px]">Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(registrations || []).map((r: any) => (
                      <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setViewReg(r); setIsViewRegOpen(true); }}>
                        <TableCell className="p-2 text-xs">{r.registrationCode}</TableCell>
                        <TableCell className="p-2 text-xs">{r.name}</TableCell>
                        <TableCell className="p-2 text-xs">{r.number || '-'}</TableCell>
                        <TableCell className="p-2 text-xs">{r.email || '-'}</TableCell>
                        <TableCell className="p-2 text-xs">
                          {STATUS_OPTIONS.find(opt => opt.value === r.status)?.label || r.status}
                        </TableCell>
                        <TableCell className="p-2 text-xs">{r.city || '-'}</TableCell>
                        <TableCell className="p-2 text-xs">{getSourceLabel(r.source) || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Registration Modal */}
        <Dialog open={isAddRegOpen} onOpenChange={setIsAddRegOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Registration</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={regForm.status} onValueChange={(v) => setRegForm({ ...regForm, status: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Number</Label>
                <Input type="tel" inputMode="tel" autoComplete="tel" pattern="^[+0-9()\-\s]*$" value={regForm.number} onChange={(e) => setRegForm({ ...regForm, number: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" inputMode="email" autoComplete="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={regForm.city} onChange={(e) => setRegForm({ ...regForm, city: e.target.value })} />
              </div>
              <div>
                <Label>Source</Label>
                <Select value={regForm.source || ''} onValueChange={(v) => setRegForm({ ...regForm, source: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Source" /></SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddRegOpen(false)}>Cancel</Button>
              <Button onClick={() => {
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
              }} disabled={addRegMutation.isPending}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Registration Modal */}
        <Dialog open={isEditRegOpen} onOpenChange={setIsEditRegOpen}>
          <DialogContent>
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
                      {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={editingReg.name || ''} onChange={(e) => setEditingReg({ ...editingReg, name: e.target.value })} />
                </div>
                <div>
                  <Label>Number</Label>
                  <Input type="tel" inputMode="tel" autoComplete="tel" pattern="^[+0-9()\-\s]*$" value={editingReg.number || ''} onChange={(e) => setEditingReg({ ...editingReg, number: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" inputMode="email" autoComplete="email" value={editingReg.email || ''} onChange={(e) => setEditingReg({ ...editingReg, email: e.target.value })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={editingReg.city || ''} onChange={(e) => setEditingReg({ ...editingReg, city: e.target.value })} />
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
                      {!isEditingView ? (
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
                            onClick={() => convertMutation.mutate(viewReg.id)}
                            disabled={convertMutation.isPending}
                            title="Convert to Lead"
                          >
                            <UserPlus />
                            <span className="hidden lg:inline">{convertMutation.isPending ? 'Converting…' : 'Convert to Lead'}</span>
                          </Button>
                        </>
                      ) : (
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
                      )}
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

        {/* Import CSV Wizard */}
        <Dialog open={isImportOpen} onOpenChange={(o) => { setIsImportOpen(o); if (!o) { setImportStep(1); setImportErrors([]); setImportValidRows([]); setImportFileName(''); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Registrations (CSV)</DialogTitle>
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
                    <Button size="xs" onClick={downloadSampleCsv}>Download Sample CSV</Button>
                    <Button size="xs" variant="outline" onClick={() => { setImportStep(2); }}>Next</Button>
                  </div>
                </div>
              )}

              {importStep === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">Choose your CSV file to validate. No data will be inserted yet.</p>
                  <div className="flex items-center gap-2">
                    <Button size="xs" onClick={() => fileInputRef.current?.click()}>Choose CSV</Button>
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
                    }}>{isImporting ? 'Importing…' : `Insert ${importValidRows.length} rows`}</Button>
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
