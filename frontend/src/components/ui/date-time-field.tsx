import * as React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';

export type DateTimeFieldProps = {
  value: string; // format: YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  min?: string; // format: YYYY-MM-DDTHH:mm
  stepSeconds?: number; // default 900 (15 minutes)
  placeholder?: string;
  className?: string;
};

function formatDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocal(value?: string | null): { date: Date | null; datePart: string; timePart: string } {
  if (!value) return { date: null, datePart: '', timePart: '' };
  const [d, t] = value.split('T');
  const [y, m, da] = d?.split('-').map(Number) as [number, number, number];
  const [hh = 0, mm = 0] = (t || '').split(':').map(Number) as [number, number];
  const dt = new Date(y, (m || 1) - 1, da || 1, hh || 0, mm || 0, 0, 0);
  if (isNaN(dt.getTime())) return { date: null, datePart: '', timePart: '' };
  return { date: dt, datePart: d || '', timePart: (t || '').slice(0, 5) };
}

function toDatePart(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function clampToStep(date: Date, stepSeconds: number) {
  const ms = Math.floor(date.getTime() / 1000 / stepSeconds) * stepSeconds * 1000;
  const d = new Date(ms);
  d.setSeconds(0, 0);
  return d;
}

function buildTimes(stepSeconds: number) {
  const out: string[] = [];
  for (let s = 0; s < 24 * 3600; s += stepSeconds) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return out;
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({ value, onChange, min, stepSeconds = 900, placeholder = 'Select date & time', className }) => {
  const [open, setOpen] = React.useState(false);
  const minDate = React.useMemo(() => (min ? parseLocal(min).date : null), [min]);
  const { date: parsedDate, datePart: parsedDatePart, timePart: parsedTimePart } = React.useMemo(() => parseLocal(value), [value]);
  const [draftDate, setDraftDate] = React.useState<Date | null>(parsedDate);
  const [draftTime, setDraftTime] = React.useState<string>(parsedTimePart || '');

  React.useEffect(() => {
    setDraftDate(parsedDate);
    setDraftTime(parsedTimePart || '');
  }, [parsedDate, parsedTimePart]);

  const times = React.useMemo(() => buildTimes(stepSeconds), [stepSeconds]);

  const isSameDayAsMin = React.useMemo(() => {
    if (!draftDate || !minDate) return false;
    return draftDate.getFullYear() === minDate.getFullYear() && draftDate.getMonth() === minDate.getMonth() && draftDate.getDate() === minDate.getDate();
  }, [draftDate, minDate]);

  const minTimeStr = React.useMemo(() => {
    if (!minDate) return null;
    const hh = String(minDate.getHours()).padStart(2, '0');
    const mm = String(minDate.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }, [minDate]);

  const filteredTimes = React.useMemo(() => {
    if (!isSameDayAsMin || !minTimeStr) return times;
    return times.filter(t => t >= minTimeStr);
  }, [times, isSameDayAsMin, minTimeStr]);

  const display = React.useMemo(() => {
    if (parsedDate && parsedTimePart) return `${parsedDatePart} ${parsedTimePart}`;
    return '';
  }, [parsedDate, parsedDatePart, parsedTimePart]);

  const commit = React.useCallback((d: Date | null, t: string, close = true) => {
    if (!d || !t) return;
    const [hh, mm] = t.split(':').map(Number);
    const newDate = new Date(d);
    newDate.setHours(hh || 0, mm || 0, 0, 0);
    const valueStr = formatDateTimeLocalValue(newDate);
    onChange(valueStr);
    if (close) setOpen(false);
  }, [onChange]);

  const handleDateSelect = (d: Date | null) => {
    if (!d) return;
    let next = d;
    if (minDate && next.getTime() < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime()) {
      next = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    }
    setDraftDate(next);
    if (!draftTime) {
      const clamped = clampToStep(new Date(), stepSeconds);
      const t = `${String(clamped.getHours()).padStart(2, '0')}:${String(clamped.getMinutes()).padStart(2, '0')}`;
      setDraftTime(t);
      // Do not auto-commit: allow user to adjust time and explicitly save
    }
  };

  const handleTimeSelect = (t: string) => {
    setDraftTime(t);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn('flex h-9 w-full items-center rounded-md border border-input bg-background px-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-75', className)} aria-label="Open date time picker">
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
          <span className={cn('truncate text-left grow', display ? 'text-foreground' : 'text-muted-foreground')}>{display || placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] p-3" align="start">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Calendar
              selected={draftDate}
              onSelect={handleDateSelect}
              showOutsideDays
              minDate={minDate || undefined}
              className="!w-48"
            />
          </div>
          <div className="flex-1 min-w-[8rem] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <select
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={draftTime}
                  onChange={(e) => handleTimeSelect(e.target.value)}
                >
                  <option value="" disabled>Select time</option>
                  {filteredTimes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {minDate && draftDate && draftDate < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) && (
                <div className="text-xs text-red-600 mb-2">Select a date on/after {toDatePart(minDate)}</div>
              )}
            </div>
            <div className="flex justify-between">
              <button type="button" className="text-xs text-muted-foreground underline" onClick={() => { onChange(''); setDraftDate(null); setDraftTime(''); setOpen(false); }}>Clear</button>
              <div>
                <button type="button" className="ml-2 inline-flex items-center rounded bg-[#223E7D] text-white px-3 py-1 text-sm" onClick={() => commit(draftDate, draftTime)} disabled={!draftDate || !draftTime}>Save</button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

DateTimeField.displayName = 'DateTimeField';

export default DateTimeField;
