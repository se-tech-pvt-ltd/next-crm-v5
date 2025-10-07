import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, startOfDay } from 'date-fns';
import { useLocation } from 'wouter';

type EventItem = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: string;
  entityType?: string | null;
  entityId?: string | number | null;
  comments?: string | null;
};

export const CalendarMonthGrid: React.FC<{ month: Date; events: EventItem[] }> = ({ month, events }) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalDate, setModalDate] = React.useState<Date | null>(null);

  // Force a 5-row (35-day) grid starting from the first day of the week
  // that contains the month's first day. This ensures a consistent 5x7 layout.
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let i = 0; i < 35; i++) {
    days.push(addDays(start, i));
  }

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const ev of events) {
      const key = startOfDay(ev.start).toISOString();
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const openDayModal = (date: Date) => {
    setModalDate(date);
    setModalOpen(true);
  };

  const [eventModalOpen, setEventModalOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<EventItem | null>(null);

  const openEventModal = (ev: EventItem) => {
    setSelectedEvent(ev);
    setEventModalOpen(true);
  };

  return (
    <div className="w-full flex flex-col">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="overflow-auto max-h-[60vh]">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = startOfDay(day).toISOString();
            const dayEvents = eventsByDay.get(key) || [];
            const isCurrentMonth = isSameMonth(day, month);
            const today = isSameDay(day, new Date());

            return (
              <div
                key={key}
                className={
                  `relative border rounded-md bg-white min-h-[96px] p-2 flex flex-col ${
                    isCurrentMonth ? '' : 'opacity-60'
                  } ${today ? 'ring-2 ring-primary' : ''}`
                }
              >
                <div className="flex items-start justify-between">
                  <div className="text-xs font-medium text-gray-700">{format(day, 'd')}</div>
                </div>

                <div className="mt-2 flex-1 overflow-hidden">
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="rounded-md border px-2 py-[3px] text-xs bg-indigo-50 text-indigo-800 overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer" onClick={() => openEventModal(ev)}>
                      <div className="font-semibold text-[12px] leading-4 truncate">{format(ev.start, 'hh:mm a')} {ev.title}</div>
                    </div>
                  ))}
                  </div>

                  {dayEvents.length > 3 && (
                    <button
                      type="button"
                      onClick={() => openDayModal(day)}
                      className="mt-1 text-xs text-muted-foreground hover:underline"
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}

                  {/* compact view for small screens */}
                  {dayEvents.length > 0 && (
                    <div className="sm:hidden mt-1 flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" />
                      <span className="text-xs truncate">{dayEvents[0].title}</span>
                      {dayEvents.length > 1 && <span className="text-xs text-muted-foreground">+{dayEvents.length - 1}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{modalDate ? format(modalDate, 'EEEE, MMMM d, yyyy') : 'Events'}</DialogTitle>
          <div className="space-y-2 mt-2">
            {modalDate && (eventsByDay.get(startOfDay(modalDate).toISOString()) || []).map((ev) => (
              <div key={ev.id} className="rounded-md border p-2 bg-white">
                <div className="text-sm font-semibold">{ev.title}</div>
                <div className="text-xs text-muted-foreground">{format(ev.start, 'hh:mm a')} — {format(ev.end, 'hh:mm a')}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogTitle className="sr-only">Follow Up</DialogTitle>
          <div className="flex flex-col">
            <div className="px-4 py-3 bg-[#223E7D] text-white flex items-center justify-between">
              <div className="text-lg font-semibold">Follow Up</div>
              <button aria-label="Close" onClick={() => setEventModalOpen(false)} className="rounded-full w-8 h-8 inline-flex items-center justify-center bg-white/20 hover:bg-white/30 text-white">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.414 10l3.536-3.536a1 1 0 10-1.414-1.414L10 8.586 6.464 5.05a1 1 0 10-1.414 1.414L8.586 10l-3.536 3.536a1 1 0 101.414 1.414L10 11.414l3.536 3.536a1 1 0 001.414-1.414L11.414 10z" clipRule="evenodd"/></svg>
              </button>
            </div>
            <div className="p-4 bg-white">
              {selectedEvent && (
                <div className="mt-2 space-y-2">
                  <div className="text-sm text-muted-foreground">{format(selectedEvent.start, 'EEEE, MMMM d, yyyy')}</div>
                  <div className="text-sm">{format(selectedEvent.start, 'hh:mm a')} — {format(selectedEvent.end, 'hh:mm a')}</div>
                  {selectedEvent.comments && <div className="text-sm text-gray-700">{selectedEvent.comments}</div>}
                  <div className="text-sm text-muted-foreground">Status: {selectedEvent.status}</div>
                  <div className="flex justify-end mt-4">
                    <EventOpenButton event={selectedEvent} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function EventOpenButton({ event }: { event: EventItem }) {
  const [, navigate] = useLocation();
  const handleOpen = () => {
    const t = (event.entityType || '').toLowerCase();
    let path = '/';
    switch (t) {
      case 'lead':
        path = `/leads/${event.entityId}`;
        break;
      case 'student':
        path = `/students/${event.entityId}`;
        break;
      case 'application':
        path = `/applications/${event.entityId}`;
        break;
      case 'admission':
        path = `/admissions/${event.entityId}`;
        break;
      case 'event':
        path = `/events/${event.entityId}`;
        break;
      default:
        path = '/';
    }
    try { navigate(path); } catch {}
  };
  return (
    <button onClick={handleOpen} className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm">Open record</button>
  );
}

export default CalendarMonthGrid;
