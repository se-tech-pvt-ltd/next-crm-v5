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
import { Plus, Edit, UserPlus, Trash2, Calendar } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'Attending', value: 'attending' },
  { label: 'Not Sure', value: 'not_sure' },
  { label: 'Will Not Attend', value: 'will_not_attend' },
  { label: 'Unable to Contact', value: 'unable_to_contact' },
];

export default function EventsPage() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [filterEventId, setFilterEventId] = useState<string>('all');

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

  const updateRegMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RegService.RegistrationPayload> }) => RegService.updateRegistration(id, data),
    onSuccess: () => { toast({ title: 'Updated' }); refetchRegs(); },
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

  const handleCreateEvent = () => {
    if (!newEvent.name || !newEvent.type || !newEvent.date || !newEvent.venue || !newEvent.time) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    addEventMutation.mutate(newEvent);
  };

  const eventOptions = [{ label: 'All Events', value: 'all' }, ...((events || []).map((e: any) => ({ label: `${e.name} (${e.date})`, value: e.id })))];

  return (
    <Layout title="Events" helpText="Manage events and registrations. Similar to Leads.">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" />Events</h1>
          <Button size="xs" onClick={() => setIsAddEventOpen(true)} className="rounded-full px-3"><Plus className="w-3 h-3 mr-1" />Add Event</Button>
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
