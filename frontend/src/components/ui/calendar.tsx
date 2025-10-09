import { ChevronLeft, ChevronRight } from "lucide-react";
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { cn } from '@/lib/utils';

export type CalendarProps = {
  selected?: Date | null;
  onSelect?: (d: Date | null) => void;
  showOutsideDays?: boolean;
  className?: string;
};

function Calendar({ selected, onSelect, showOutsideDays = true, className }: CalendarProps) {
  return (
    <div className={cn('p-2', className)}>
      <ReactCalendar
        value={selected ?? null}
        onChange={(d: Date | Date[]) => {
          // react-calendar returns Date or Date[] depending on select range; we only support single
          const date = Array.isArray(d) ? d[0] ?? null : d ?? null;
          onSelect && onSelect(date as Date | null);
        }}
        tileContent={null}
        calendarType="ISO 8601"
        showNeighboringMonth={Boolean(showOutsideDays)}
      />
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
