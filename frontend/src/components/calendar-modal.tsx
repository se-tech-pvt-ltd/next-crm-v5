import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ open, onOpenChange }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  React.useEffect(() => {
    if (!open) {
      const now = new Date();
      setSelectedDate(now);
      setCurrentMonth(now);
    }
  }, [open]);

  const monthLabel = React.useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(currentMonth),
    [currentMonth],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="fixed inset-0 left-0 top-0 m-0 h-screen w-screen translate-x-0 translate-y-0 rounded-none border-0 bg-white p-0 shadow-none sm:rounded-none"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-6">
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

          <div className="flex flex-1 flex-col items-center overflow-auto px-3 py-6 sm:px-6">
            <div className="text-base font-medium text-gray-700 sm:text-lg" aria-live="polite">
              {monthLabel}
            </div>
            <div className="mt-4 rounded-lg border bg-white shadow-sm">
              <Calendar
                mode="single"
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="bg-transparent"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
