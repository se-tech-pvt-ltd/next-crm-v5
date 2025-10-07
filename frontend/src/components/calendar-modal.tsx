import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
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

export const CalendarModal: React.FC<CalendarModalProps> = ({ open, onOpenChange }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [focusDate, setFocusDate] = React.useState<Date>(new Date());
  const [view, setView] = React.useState<CalendarView>('month');

  React.useEffect(() => {
    if (!open) {
      const now = new Date();
      setSelectedDate(now);
      setFocusDate(now);
      setView('month');
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
    const start = startOfWeek(focusDate, { weekStartsOn: 1 });
    const end = endOfWeek(focusDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [focusDate]);

  const yearMonths = React.useMemo(() => {
    const start = startOfYear(focusDate);
    const end = endOfYear(focusDate);
    return eachMonthOfInterval({ start, end });
  }, [focusDate]);

  const hourSlots = React.useMemo(() => Array.from({ length: 24 }, (_, idx) => idx), []);

  const viewLabel = React.useMemo(() => {
    switch (view) {
      case 'day':
        return format(focusDate, 'EEEE, MMMM d, yyyy');
      case 'week': {
        const start = startOfWeek(focusDate, { weekStartsOn: 1 });
        const end = endOfWeek(focusDate, { weekStartsOn: 1 });
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

  const renderView = () => {
    switch (view) {
      case 'day':
        return (
          <div className="flex h-full w-full flex-col items-center overflow-auto">
            <div className="w-full max-w-3xl px-2">
              <div className="text-center">
                <div className="text-3xl font-semibold text-gray-900 sm:text-4xl">
                  {format(focusDate, 'EEEE')}
                </div>
                <div className="mt-1 text-sm text-muted-foreground sm:text-base">
                  {format(focusDate, 'MMMM d, yyyy')}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
                {hourSlots.map((hour) => {
                  const slotTime = new Date(
                    focusDate.getFullYear(),
                    focusDate.getMonth(),
                    focusDate.getDate(),
                    hour,
                    0,
                    0,
                    0,
                  );
                  const label = format(slotTime, 'h a');
                  return (
                    <React.Fragment key={hour}>
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <div
                        className="h-12 rounded-md border border-dashed border-gray-200 bg-white"
                        role="group"
                        aria-label={`${label} slot`}
                      >
                        <span className="sr-only">No events scheduled</span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'week':
        return (
          <div className="flex h-full w-full flex-col items-center overflow-auto">
            <div className="w-full max-w-4xl">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={cn(
                        'rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/60 hover:bg-primary/5',
                      )}
                    >
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {format(day, 'EEE')}
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-gray-900">
                        {format(day, 'd')}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {format(day, 'MMMM yyyy')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'month':
        return (
          <div className="flex h-full w-full flex-col items-center overflow-auto">
            <div className="w-full max-w-4xl rounded-lg border bg-white shadow-sm">
              <Calendar
                mode="single"
                month={monthForCalendar}
                onMonthChange={(date) => setFocusDate(startOfMonth(date))}
                selected={selectedDate}
                onSelect={handleSelectDay}
                className="bg-transparent"
              />
            </div>
          </div>
        );
      case 'year':
        return (
          <div className="flex h-full w-full flex-col items-center overflow-auto">
            <div className="w-full max-w-4xl">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {yearMonths.map((month) => {
                  const isSelected = isSameMonth(month, selectedDate);
                  return (
                    <button
                      key={month.toISOString()}
                      type="button"
                      onClick={() => {
                        setFocusDate(month);
                        setView('month');
                      }}
                      className={cn(
                        'rounded-lg border bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary/60 hover:bg-primary/5',
                      )}
                    >
                      <div className="text-lg font-semibold text-gray-900">{format(month, 'MMMM')}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{format(month, 'yyyy')}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
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
          <div className="flex flex-col gap-3 border-b px-4 py-3 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900 sm:text-xl">Calendar</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Browse dates and plan upcoming activities.
                </DialogDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {viewOptions.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={view === option.value ? 'default' : 'outline'}
                    onClick={() => setView(option.value)}
                    aria-pressed={view === option.value}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-medium text-gray-700 sm:text-base" aria-live="polite">
                  {viewLabel}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrev}
                    aria-label="Previous period"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleToday}>
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNext}
                    aria-label="Next period"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden px-3 py-6 sm:px-6">
            <div className="flex-1 overflow-auto">
              {renderView()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
