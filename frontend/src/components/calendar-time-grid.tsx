import React from "react";
import { cn } from "@/lib/utils";
import { format, startOfDay, differenceInMinutes, isSameDay } from "date-fns";

export interface TimeGridEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: "overdue" | "upcoming";
  entityType?: string;
  entityId?: string | number;
  comments?: string;
}

interface CalendarTimeGridProps {
  days: Date[];
  events: TimeGridEvent[];
  startHour?: number; // inclusive, 0-23
  endHour?: number;   // exclusive, 1-24
  now?: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function layoutDayEvents(events: TimeGridEvent[]) {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  type Lane = { end: number };
  let lanes: Lane[] = [];
  let clusterEvents: { ev: TimeGridEvent; lane: number }[] = [];
  const positioned: Array<TimeGridEvent & { lane: number; laneCount: number }> = [];

  const flushCluster = () => {
    if (clusterEvents.length === 0) return;
    const laneCount = Math.max(1, lanes.length);
    for (const { ev, lane } of clusterEvents) {
      positioned.push(Object.assign({}, ev, { lane, laneCount }));
    }
    lanes = [];
    clusterEvents = [];
  };

  for (const ev of sorted) {
    const start = ev.start.getTime();
    const end = ev.end.getTime();
    let placed = false;

    // free finished lanes
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i].end <= start) {
        lanes[i].end = -1; // mark free
      }
    }

    // try reuse a free lane
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i].end === -1) {
        lanes[i].end = end;
        clusterEvents.push({ ev, lane: i });
        placed = true;
        break;
      }
    }

    if (!placed) {
      // if there is an active lane (end > start), we are in same cluster; else cluster ended
      const hasActive = lanes.some((l) => l.end > start);
      if (!hasActive) {
        flushCluster();
      }
      lanes.push({ end });
      clusterEvents.push({ ev, lane: lanes.length - 1 });
    }
  }

  flushCluster();
  return positioned;
}

export const CalendarTimeGrid: React.FC<CalendarTimeGridProps> = ({
  days,
  events,
  startHour = 8,
  endHour = 20,
  now = new Date(),
}) => {
  const normDays = React.useMemo(() => days.map((d) => startOfDay(d)), [days]);
  const byDay = React.useMemo(() => {
    const map = new Map<string, TimeGridEvent[]>();
    for (const d of normDays) {
      map.set(d.toISOString(), []);
    }
    for (const ev of events) {
      const day = startOfDay(ev.start).toISOString();
      if (map.has(day)) {
        map.get(day)!.push(ev);
      }
    }
    return map;
  }, [events, normDays]);

  const positionedByDay = React.useMemo(() => {
    const map = new Map<string, Array<TimeGridEvent & { lane: number; laneCount: number }>>();
    for (const [key, list] of byDay.entries()) {
      map.set(key, layoutDayEvents(list));
    }
    return map;
  }, [byDay]);

  const hourRange = React.useMemo(() => HOURS.filter((h) => h >= startHour && h < endHour), [startHour, endHour]);
  const totalMinutes = React.useMemo(() => (endHour - startHour) * 60, [startHour, endHour]);

  const minuteToTop = React.useCallback(
    (minFromDayStart: number) => `${(minFromDayStart - startHour * 60) / totalMinutes * 100}%`,
    [startHour, totalMinutes]
  );

  const isTodayInView = normDays.some((d) => isSameDay(d, now));
  const nowTop = minuteToTop(now.getHours() * 60 + now.getMinutes());

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-[64px_1fr] md:grid-cols-[72px_1fr]">
        <div />
        <div className="grid" style={{ gridTemplateColumns: `repeat(${normDays.length}, minmax(0, 1fr))` }}>
          {normDays.map((d) => (
            <div key={d.toISOString()} className="border-b border-gray-200 bg-white py-2 text-center">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{format(d, 'EEE')}</div>
              <div className="text-sm font-semibold text-gray-900">{format(d, 'MMM d')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body (scrollable) */}
      <div className="relative grid grid-cols-[64px_1fr] md:grid-cols-[72px_1fr] flex-1 overflow-auto max-h-[70vh] pb-16">
        {/* Time column */}
        <div className="relative bg-white">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 64px)" }} />
          {hourRange.map((h) => (
            <div key={h} className="relative h-16">
              <div className="absolute top-px right-2 text-right text-[10px] text-muted-foreground select-none">{format(new Date(2020, 0, 1, h), 'ha')}</div>
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${normDays.length}, minmax(0, 1fr))` }}>
          {normDays.map((day) => {
            const key = day.toISOString();
            const dayEvents = positionedByDay.get(key) || [];
            return (
              <div key={key} className="relative border-l border-gray-100">
                {/* hour grid lines via background gradient every 64px */}
                <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 64px)" }} />

                {/* current time line */}
                {isSameDay(day, now) && isTodayInView && (
                  <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: nowTop }}>
                    <div className="flex items-center">
                      <div className="h-2 w-2 -ml-1 rounded-full bg-red-500" />
                      <div className="h-px flex-1 bg-red-500" />
                    </div>
                  </div>
                )}

                {/* events */}
                {dayEvents.map((ev) => {
                  const startMin = differenceInMinutes(ev.start, day);
                  const endMin = Math.max(startMin + 15, differenceInMinutes(ev.end, day));
                  const clamp = (n: number) => Math.min(100, Math.max(0, n));
                  const top = clamp(parseFloat(minuteToTop(startMin)));
                  const bottom = clamp(parseFloat(minuteToTop(endMin)));
                  const heightCalc = `calc(${bottom}% - ${top}%)`;
                  const width = `${100 / ev.laneCount}%`;
                  const left = `${ev.lane * (100 / ev.laneCount)}%`;

                  const color = ev.status === 'overdue' ? 'border-red-300 bg-red-50 text-red-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900';
                  const chip = ev.entityType ? `bg-gray-900/5 text-gray-700` : '';

                  return (
                    <div
                      key={ev.id}
                      className={cn('absolute z-10 overflow-hidden rounded-md border p-1 text-xs shadow-sm', color)}
                      style={{ top: `${top}%`, height: heightCalc, left, width }}
                      title={ev.title}
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className={cn('mr-1 inline-block rounded px-1 py-[1px] text-[10px] font-semibold capitalize', chip)} title={ev.entityType || undefined}>
                          {ev.entityType}
                        </span>
                        <span className="truncate">{ev.title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
