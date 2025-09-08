import { useEffect, useMemo, useState } from 'react';
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
import { Plus, Edit, UserPlus, Trash2, Calendar, Upload } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'Attending', value: 'attending' },
  { label: 'Not Sure', value: 'not_sure' },
  { label: 'Will Not Attend', value: 'will_not_attend' },
  { label: 'Unable to Contact', value: 'unable_to_contact' },
];

export default function EventsPage() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAddRegOpen, setIsAddRegOpen] = useState(false);
  const [isEditRegOpen, setIsEditRegOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<any | null>(null);
  const [filterEventId, setFilterEventId] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const { data: leadsDropdowns } = useQuery({
    queryKey: ['/api/dropdowns/module/Leads'],
    queryFn: async () => DropdownsService.getModuleDropdowns('Leads'),
  });

  const sourceOptions = useMemo(() => {
    const list: any[] = (leadsDropdowns as any)?.Sources || [];
    return list.map((o: any) => ({ label: o.value, value: o.id || o.key || o.value }));
  }, [leadsDropdowns]);

  const addEventMutation = useMutation({
    mutationFn: EventsService.createEvent,
    onSuccess: () => { toast({ title: 'Event created' }); refetchEvents(); setIsAddEventOpen(false); },
    onError: () => toast({ title: 'Failed to create event', variant: 'destructive' }),
  });

  const addRegMutation = useMutation({
    mutationFn: (data: RegService.RegistrationPayload) => RegService.createRegistration(data),
    onSuccess: () => { toast({ title: 'Registration added' }); refetchRegs(); setIsAddRegOpen(false); },
    onError: () => toast({ title: 'Failed to add registration', variant: 'destructive' }),
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

  const parseCsvAndImport = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return;
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idx = (k: string) => header.indexOf(k);
    const nameIdx = idx('name');
    const numberIdx = idx('number');
    const emailIdx = idx('email');
    const cityIdx = idx('city');
    const sourceIdx = idx('source');
    const statusIdx = idx('status');

    let success = 0, failed = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const payload: RegService.RegistrationPayload = {
        name: cols[nameIdx]?.trim() || '',
        number: cols[numberIdx]?.trim() || '',
        email: cols[emailIdx]?.trim() || '',
        city: cols[cityIdx]?.trim() || '',
        source: cols[sourceIdx]?.trim() || '',
        status: (cols[statusIdx]?.trim()?.toLowerCase() || 'attending'),
        eventId: filterEventId,
      } as any;
      if (!payload.name) { failed++; continue; }
      try {
        // eslint-disable-next-line no-await-in-loop
        await RegService.createRegistration(payload);
        success++;
      } catch {
        failed++;
      }
    }
    toast({ title: 'Import finished', description: `${success} added, ${failed} failed` });
    refetchRegs();
  };

  const eventOptions = [{ label: 'All Events', value: 'all' }, ...((events || []).map((e: any) => ({ label: `${e.name} (${e.date})`, value: e.id })))];

  return (
    <Layout title="Events" helpText="Manage events and registrations. Similar to Leads.">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" />Events</h1>
          <div className="flex items-center gap-2">
            <Button size="xs" variant="outline" onClick={openAddRegistration} className="rounded-full px-3"><Plus className="w-3 h-3 mr-1" />Add Registration</Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) parseCsvAndImport(f); e.currentTarget.value = ''; }} />
            <Button size="xs" variant="outline" onClick={handleImportClick} className="rounded-full px-3"><Upload className="w-3 h-3 mr-1" />Import CSV</Button>
            <Button size="xs" onClick={() => setIsAddEventOpen(true)} className="rounded-full px-3"><Plus className="w-3 h-3 mr-1" />Add Event</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Event Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-xs">Event</Label>
              <Select value={filterEventId} onValueChange={setFilterEventId}>
                <SelectTrigger className="h-8 w-64 text-xs"><SelectValue placeholder="Select Event" /></SelectTrigger>
                <SelectContent>
                  {eventOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 text-[11px]">Registration ID</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Status</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Name</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Number</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Email</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">City</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Source</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Event</TableHead>
                    <TableHead className="h-8 px-2 text-[11px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(registrations || []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="p-2 text-xs">{r.registrationCode}</TableCell>
                      <TableCell className="p-2 text-xs">
                        <Select value={r.status} onValueChange={(v) => updateRegMutation.mutate({ id: r.id, data: { status: v } })}>
                          <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2 text-xs">{r.name}</TableCell>
                      <TableCell className="p-2 text-xs">{r.number || '-'}</TableCell>
                      <TableCell className="p-2 text-xs">{r.email || '-'}</TableCell>
                      <TableCell className="p-2 text-xs">{r.city || '-'}</TableCell>
                      <TableCell className="p-2 text-xs">
                        <Select value={r.source || ''} onValueChange={(v) => updateRegMutation.mutate({ id: r.id, data: { source: v } })}>
                          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="Select Source" /></SelectTrigger>
                          <SelectContent>
                            {sourceOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <Select value={r.eventId} onValueChange={(v) => updateRegMutation.mutate({ id: r.id, data: { eventId: v } })}>
                          <SelectTrigger className="h-8 text-xs w-64"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(events || []).map((e: any) => (
                              <SelectItem key={e.id} value={e.id}>{e.name} ({e.date})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Button size="xs" variant="outline" className="rounded-full px-2" onClick={() => { setEditingReg(r); setIsEditRegOpen(true); }} title="Edit"><Edit className="w-3 h-3" /><span className="hidden lg:inline">Edit</span></Button>
                          <Button size="xs" variant="outline" className="rounded-full px-2" onClick={() => convertMutation.mutate(r.id)} title="Convert to Lead"><UserPlus className="w-3 h-3" /><span className="hidden lg:inline">Convert</span></Button>
                          <Button size="xs" variant="outline" className="rounded-full px-2" onClick={() => deleteRegMutation.mutate(r.id)} title="Delete"><Trash2 className="w-3 h-3" /><span className="hidden lg:inline">Delete</span></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
                <Input value={regForm.number} onChange={(e) => setRegForm({ ...regForm, number: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
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
              <Button onClick={() => addRegMutation.mutate(regForm)} disabled={addRegMutation.isPending || !regForm.name}>Save</Button>
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
                  <Input value={editingReg.number || ''} onChange={(e) => setEditingReg({ ...editingReg, number: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={editingReg.email || ''} onChange={(e) => setEditingReg({ ...editingReg, email: e.target.value })} />
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
              <Button onClick={() => editingReg && updateRegMutation.mutate({ id: editingReg.id, data: { status: editingReg.status, name: editingReg.name, number: editingReg.number, email: editingReg.email, city: editingReg.city, source: editingReg.source } })} disabled={updateRegMutation.isPending || !editingReg?.name}>Save</Button>
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
                <Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Input value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
              </div>
              <div>
                <Label>Venue</Label>
                <Input value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" step="60" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
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
