import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type CalendarProps = {
  selected?: Date | null;
  onSelect?: (d: Date | null) => void;
  showOutsideDays?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
};

function Calendar({ selected, onSelect, showOutsideDays = true, className, minDate, maxDate }: CalendarProps) {
  const [Cal, setCal] = useState<any | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('react-calendar');
        await import('react-calendar/dist/Calendar.css');
        if (!mounted) return;
        setCal(() => mod.default || mod);
      } catch (err: any) {
        console.error('Failed to load react-calendar dynamically', err);
        if (mounted) setLoadError(String(err?.message || err));
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loadError) {
    return <div className={cn('p-2 text-sm text-red-600', className)}>Calendar failed to load</div>;
  }

  if (!Cal) {
    return <div className={cn('p-2', className)}>Loading calendar...</div>;
  }

  return (
    <div className={cn('p-2', className)}>
      <Cal
        value={selected ?? null}
        onChange={(d: Date | Date[]) => {
          const date = Array.isArray(d) ? d[0] ?? null : d ?? null;
          onSelect && onSelect(date as Date | null);
        }}
        tileContent={null}
        showNeighboringMonth={Boolean(showOutsideDays)}
      />
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
