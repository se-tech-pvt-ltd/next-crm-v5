import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import type { FollowUp } from '@/lib/types';
import { getFollowUps } from '@/services/followUps';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarTimeGrid } from './calendar-time-grid';
import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CalendarView = 'day' | 'week' | 'month' | 'year';

const viewOptions: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

export const CalendarModal: React.FC<CalendarModalProps> = ({ open, onOpenChange }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [focusDate, setFocusDate] = React.useState<Date>(new Date());
  const [view, setView] = React.useState<CalendarView>('week');

  React.useEffect(() => {
    if (!open) {
      const now = new Date();
      setSelectedDate(now);
      setFocusDate(now);
      setView('week');
    }
  }, [open]);

  React.useEffect(() => {
    if (view === 'day' || view === 'week') {
      setFocusDate(selectedDate);
    }
    if (view === 'month') {
      setFocusDate((prev) => {
        if (
          prev.getFullYear() === selectedDate.getFullYear() &&
          prev.getMonth() === selectedDate.getMonth()
        ) {
          return prev;
        }
        return startOfMonth(selectedDate);
      });
    }
    if (view === 'year') {
      setFocusDate((prev) => {
        if (prev.getFullYear() === selectedDate.getFullYear()) {
          return prev;
        }
        return selectedDate;
      });
    }
  }, [view, selectedDate]);

  const monthForCalendar = React.useMemo(() => startOfMonth(focusDate), [focusDate]);

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(focusDate, WEEK_OPTIONS);
    const end = endOfWeek(focusDate, WEEK_OPTIONS);
    return eachDayOfInterval({ start, end });
  }, [focusDate]);

  const yearMonths = React.useMemo(() => {
    const start = startOfYear(focusDate);
    const end = endOfYear(focusDate);
    return eachMonthOfInterval({ start, end });
  }, [focusDate]);

  const hourSlots = React.useMemo(() => Array.from({ length: 24 }, (_, idx) => idx), []);
  const { user } = useAuth() as any;

  const viewLabel = React.useMemo(() => {
    switch (view) {
      case 'day':
        return format(focusDate, 'EEEE, MMMM d, yyyy');
      case 'week': {
        const start = startOfWeek(focusDate, WEEK_OPTIONS);
        const end = endOfWeek(focusDate, WEEK_OPTIONS);
        const sameMonth = start.getMonth() === end.getMonth();
        const sameYear = start.getFullYear() === end.getFullYear();
        const startFormat = sameYear ? (sameMonth ? 'MMM d' : 'MMM d, yyyy') : 'MMM d, yyyy';
        const endFormat = 'MMM d, yyyy';
        return `${format(start, startFormat)} – ${format(end, endFormat)}`;
      }
      case 'month':
        return format(focusDate, 'MMMM yyyy');
      case 'year':
        return format(focusDate, 'yyyy');
      default:
        return '';
    }
  }, [focusDate, view]);

  const viewRange = React.useMemo(() => {
    switch (view) {
      case 'day':
        return {
          start: startOfDay(focusDate),
          end: endOfDay(focusDate),
        };
      case 'week': {
        const start = startOfWeek(focusDate, WEEK_OPTIONS);
        const end = endOfWeek(focusDate, WEEK_OPTIONS);
        return {
          start: startOfDay(start),
          end: endOfDay(end),
        };
      }
      case 'month': {
        const start = startOfMonth(focusDate);
        const end = endOfMonth(focusDate);
        return {
          start: startOfDay(start),
          end: endOfDay(end),
        };
      }
      case 'year': {
        const start = startOfYear(focusDate);
        const end = endOfYear(focusDate);
        return {
          start: startOfDay(start),
          end: endOfDay(end),
        };
      }
      default:
        return {
          start: startOfDay(focusDate),
          end: endOfDay(focusDate),
        };
    }
  }, [focusDate, view]);

  const rangeStartKey = React.useMemo(() => viewRange.start.toISOString(), [viewRange]);
  const rangeEndKey = React.useMemo(() => viewRange.end.toISOString(), [viewRange]);

  const followUpQuery = useQuery({
    queryKey: ['follow-ups', view, rangeStartKey, rangeEndKey, (user as any)?.id || 'anon'],
    queryFn: () => getFollowUps({ start: viewRange.start, end: viewRange.end, userId: (user as any)?.id }),
    enabled: open,
    keepPreviousData: true,
  });

  const followUps = followUpQuery.data?.data ?? [];
  const myFollowUps = React.useMemo(() => {
    const uid = user?.id != null ? String(user.id) : null;
    if (!uid) return [] as FollowUp[];
    return (followUps || []).filter((f) => String(f.userId) === uid);
  }, [followUps, user]);

  const followUpsByDay = React.useMemo(() => {
    const map = new Map<string, { date: Date; items: FollowUp[] }>();
    for (const followUp of myFollowUps) {
      const date = new Date(followUp.followUpOn);
      if (Number.isNaN(date.getTime())) {
        continue;
      }
      const normalized = startOfDay(date);
      const key = normalized.toISOString();
      const entry = map.get(key);
      if (entry) {
        entry.items.push(followUp);
      } else {
        map.set(key, { date: normalized, items: [followUp] });
      }
    }
    map.forEach((entry) => {
      entry.items.sort(
        (a, b) => new Date(a.followUpOn).getTime() - new Date(b.followUpOn).getTime(),
      );
    });
    return map;
  }, [followUps]);

  const followUpHighlightDates = React.useMemo(
    () => Array.from(followUpsByDay.values()).map((entry) => entry.date),
    [followUpsByDay],
  );



  const handleSelectDay = React.useCallback((date?: Date) => {
    if (!date) {
      return;
    }
    setSelectedDate(date);
    setFocusDate(date);
  }, []);

  const handlePrev = React.useCallback(() => {
    setFocusDate((prev) => {
      switch (view) {
        case 'day':
          return subDays(prev, 1);
        case 'week':
          return subDays(prev, 7);
        case 'month':
          return subMonths(prev, 1);
        case 'year':
          return subYears(prev, 1);
        default:
          return prev;
      }
    });
  }, [view]);

  const handleNext = React.useCallback(() => {
    setFocusDate((prev) => {
      switch (view) {
        case 'day':
          return addDays(prev, 1);
        case 'week':
          return addDays(prev, 7);
        case 'month':
          return addMonths(prev, 1);
        case 'year':
          return addYears(prev, 1);
        default:
          return prev;
      }
    });
  }, [view]);

  const handleToday = React.useCallback(() => {
    const now = new Date();
    setSelectedDate(now);
    setFocusDate(now);
  }, []);

  const eventsForGrid = React.useMemo(() => {
    return myFollowUps.map((fu) => {
      const start = new Date(fu.followUpOn);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      return {
        id: fu.id,
        title: fu.comments || 'Follow-up',
        start,
        end,
        status: fu.status,
        entityType: fu.entityType,
        entityId: fu.entityId,
        comments: fu.comments,
      };
    });
  }, [followUps]);

  const renderView = () => {
    switch (view) {
      case 'day': {
        const day = startOfDay(focusDate);
        const dayEvents = eventsForGrid.filter((e) => isSameDay(e.start, day));
        return (
          <div className="flex h-full w-full flex-col">
            <div className="px-2 sm:px-0">
              <CalendarTimeGrid days={[day]} events={dayEvents} startHour={0} endHour={24} />
            </div>
          </div>
        );
      }
      case 'week': {
        return (
          <div className="flex h-full w-full flex-col">
            <div className="px-2 sm:px-0">
              <CalendarTimeGrid days={weekDays} events={eventsForGrid} startHour={0} endHour={24} />
            </div>
          </div>
        );
      }
      case 'month':
        return (
          <div className="flex h-full w-full flex-col items-center">
            <div className="rounded-lg border bg-white shadow-sm">
              <Calendar
                mode="single"
                month={monthForCalendar}
                onMonthChange={(date) => setFocusDate(startOfMonth(date))}
                selected={selectedDate}
                onSelect={handleSelectDay}
                className="bg-transparent p-4"
                modifiers={{ hasFollowUps: followUpHighlightDates }}
                modifiersClassNames={{
                  hasFollowUps:
                    'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary after:content-[""]',
                }}
              />
            </div>
          </div>
        );
      case 'year': {
        const currentMonth = new Date();
        return (
          <div className="flex h-full w-full flex-col items-center px-1">
            <div className="w-full max-w-5xl">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {yearMonths.map((month) => {
                  const isSelectedMonth = isSameMonth(month, selectedDate);
                  const isCurrentMonth = isSameMonth(month, currentMonth);
                  return (
                    <div
                      key={month.toISOString()}
                      className={cn(
                        'flex flex-col rounded-xl border bg-white p-3 shadow-sm transition',
                        isSelectedMonth
                          ? 'border-primary shadow-md'
                          : 'border-gray-200 hover:border-primary/60 hover:shadow',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900">{format(month, 'MMMM')}</div>
                        <div className="text-xs text-muted-foreground">{format(month, 'yyyy')}</div>
                      </div>
                      <Calendar
                        mode="single"
                        disableNavigation
                        showOutsideDays
                        month={month}
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (!date) {
                            return;
                          }
                          setSelectedDate(date);
                          setFocusDate(startOfMonth(date));
                          setView('month');
                        }}
                        className="mt-2 w-full self-center rounded-lg border bg-transparent p-2"
                        classNames={{
                          nav: 'hidden',
                          caption: 'hidden',
                          months: 'flex flex-col',
                          month: 'space-y-2',
                          table: 'w-full border-collapse space-y-0',
                          head_row: 'flex',
                          head_cell: 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
                          row: 'flex w-full mt-1',
                          cell: 'h-7 w-7 p-0 text-center text-xs',
                          day: 'h-7 w-7 rounded-full text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          day_selected:
                            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                          day_today: cn(
                            'border border-primary text-primary',
                            isCurrentMonth ? 'border-primary' : 'border-primary/60',
                          ),
                        }}
                        modifiers={{ hasFollowUps: followUpHighlightDates }}
                        modifiersClassNames={{
                          hasFollowUps:
                            'relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary after:content-[""]',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden border-0 bg-white p-0 shadow-xl"
      >
        <div className="flex h-full max-h-[90vh] flex-col">
          <div className="flex flex-col gap-3 border-b border-[#223E7D] bg-[#223E7D] text-white px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <DialogTitle className="text-lg font-semibold text-white sm:text-xl">Calendar</DialogTitle>
                <DialogDescription className="text-sm text-white/80">
                  Browse dates and plan upcoming activities.
                </DialogDescription>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <div className="flex flex-wrap justify-end gap-1">
                  {viewOptions.map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={view === option.value ? 'default' : 'outline'}
                      className={view === option.value ? 'bg-white text-[#223E7D] border-white hover:bg-white' : 'border-white/40 text-white hover:bg-white/10'}
                      onClick={() => setView(option.value)}
                      aria-pressed={view === option.value}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 bg-white text-[#223E7D] hover:bg-white/90" onClick={() => onOpenChange(false)}>
                  <span className="sr-only">Close</span>
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4"><path fill="currentColor" d="M11.414 10l3.536-3.536a1 1 0 10-1.414-1.414L10 8.586 6.464 5.05a1 1 0 10-1.414 1.414L8.586 10l-3.536 3.536a1 1 0 101.414 1.414L10 11.414l3.536 3.536a1 1 0 001.414-1.414L11.414 10z"/></svg>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 text-sm font-medium text-white sm:text-base" aria-live="polite">
                {viewLabel}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                  onClick={handlePrev}
                  aria-label="Previous period"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={handleToday}>
                  Today
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                  onClick={handleNext}
                  aria-label="Next period"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-3 py-6 sm:px-6">
            {renderView()}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
