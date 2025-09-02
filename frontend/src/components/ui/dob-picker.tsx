import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface DobPickerProps {
  id?: string;
  value?: string; // expects YYYY-MM-DD or empty
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
}

export function DobPicker({ id, value, onChange, disabled, className, fromYear, toYear }: DobPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<"year" | "calendar">("year");
  const parsed = value ? new Date(value) : undefined;

  const currentYear = new Date().getFullYear();
  const startYear = fromYear ?? (currentYear - 80);
  const endYear = toYear ?? currentYear;
  const years = React.useMemo(() => {
    const arr: number[] = [];
    for (let y = endYear; y >= startYear; y--) arr.push(y);
    return arr;
  }, [startYear, endYear]);

  const [tempYear, setTempYear] = React.useState<number | null>(parsed ? parsed.getFullYear() : null);
  const [monthAnchor, setMonthAnchor] = React.useState<Date | undefined>(parsed);

  React.useEffect(() => {
    if (open) setView("year");
  }, [open]);

  const handleSelectDate = (date?: Date) => {
    if (!date) return;
    const v = format(date, "yyyy-MM-dd");
    onChange(v);
    setOpen(false);
  };

  const onChooseYear = (y: number) => {
    setTempYear(y);
    const base = new Date(y, (parsed?.getMonth() ?? 0), (parsed?.getDate() ?? 1));
    setMonthAnchor(base);
    setView("calendar");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          disabled={disabled}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-8 text-xs",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? value : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        {view === "year" ? (
          <div className="w-[280px] max-h-[260px] overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {years.map((y) => (
                <Button
                  key={y}
                  size="sm"
                  variant={tempYear === y ? "default" : "outline"}
                  className="h-8"
                  onClick={() => onChooseYear(y)}
                >
                  {y}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={parsed}
            defaultMonth={monthAnchor}
            captionLayout="dropdown-buttons"
            fromYear={startYear}
            toYear={endYear}
            onSelect={handleSelectDate}
            initialFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
