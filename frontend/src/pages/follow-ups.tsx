import React from 'react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarTimeGrid } from '@/components/calendar-time-grid';
import CalendarMonthGrid from '@/components/calendar-month-grid';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfDay, endOfDay, eachMonthOfInterval, startOfMonth, endOfMonth, addDays, subDays, addMonths, subMonths, addYears, subYears, format, isSameMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getFollowUps } from '@/services/followUps';

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

type View = 'day' | 'week' | 'month';

export default function FollowUpsPage() {
  const { user } = useAuth() as any;
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [focusDate, setFocusDate] = React.useState<Date>(new Date());
  const [view, setView] = React.useState<View>('week');

  React.useEffect(() => {
    setFocusDate(selectedDate);
  }, [selectedDate]);

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
      default:
        return '';
    }
  }, [focusDate, view]);

  const viewRange = React.useMemo(() => {
    switch (view) {
      case 'day':
        return { start: startOfDay(focusDate), end: endOfDay(focusDate) };
      case 'week': {
        const start = startOfWeek(focusDate, WEEK_OPTIONS);
        const end = endOfWeek(focusDate, WEEK_OPTIONS);
        return { start: startOfDay(start), end: endOfDay(end) };
      }
      case 'month': {
        const start = startOfMonth(focusDate);
        const end = endOfMonth(focusDate);
        return { start: startOfDay(start), end: endOfDay(end) };
      }
      default:
        return { start: startOfDay(focusDate), end: endOfDay(focusDate) };
    }
  }, [focusDate, view]);

  const rangeStartKey = React.useMemo(() => viewRange.start.toISOString(), [viewRange]);
  const rangeEndKey = React.useMemo(() => viewRange.end.toISOString(), [viewRange]);

  const followUpQuery = useQuery({
    queryKey: ['follow-ups', view, rangeStartKey, rangeEndKey, (user as any)?.id || 'anon'],
    queryFn: () => getFollowUps({ start: viewRange.start, end: viewRange.end, userId: (user as any)?.id }),
    enabled: true,
  });

  const followUps = followUpQuery.data?.data ?? [];

  const eventsForGrid = React.useMemo(() => {
    return followUps.map((fu: any) => {
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

  const handlePrev = React.useCallback(() => {
    setFocusDate((prev) => {
      switch (view) {
        case 'day':
          return subDays(prev, 1);
        case 'week':
          return subDays(prev, 7);
        case 'month':
          return subMonths(prev, 1);
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

  return (
    <Layout title="My Calendar" showSearch={false} disableMainScroll={view !== 'month'}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button size="sm" variant={view === 'day' ? 'default' : 'outline'} onClick={() => setView('day')}>Day</Button>
              <Button size="sm" variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>Week</Button>
              <Button size="sm" variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>Month</Button>
            </div>
            <div className="text-sm font-medium">{viewLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={handleToday}>Today</Button>
            <Button size="sm" variant="outline" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <div>
          {view === 'month' ? (
            <div className="rounded-lg border bg-white shadow-sm p-4">
              <CalendarMonthGrid month={startOfMonth(focusDate)} events={eventsForGrid} />
            </div>
          ) : (
            <div className="rounded-lg border bg-white shadow-sm">
              <CalendarTimeGrid
                days={view === 'day' ? [startOfDay(focusDate)] : (function(){
                  const start = startOfWeek(focusDate, WEEK_OPTIONS);
                  const end = endOfWeek(focusDate, WEEK_OPTIONS);
                  const days = [] as Date[];
                  for (let d = start; d <= end; d = addDays(d, 1)) days.push(new Date(d));
                  return days;
                })()}
                events={eventsForGrid}
                startHour={0}
                endHour={24}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
