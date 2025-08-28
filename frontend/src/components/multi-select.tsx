import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useWheelScrolling } from '@/lib/scroll-utils';
import { useResizeObserverErrorSuppression } from '@/lib/error-boundary';

interface MultiSelectProps {
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = "Select items...", className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Enable wheel scrolling for the scroll container
  useWheelScrolling(scrollContainerRef, open);

  const handleSelect = (selectedValue: string) => {
    if (value.includes(selectedValue)) {
      onChange(value.filter((item) => item !== selectedValue));
    } else {
      onChange([...value, selectedValue]);
    }
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(value.filter((item) => item !== valueToRemove));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex flex-wrap gap-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              value.slice(0, 2).map((item) => {
                const option = options.find((opt) => opt.value === item);
                return (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(item);
                    }}
                  >
                    {option?.label}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                );
              })
            )}
            {value.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{value.length - 2} more
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        style={{
          minWidth: 'var(--radix-popover-trigger-width)',
          maxWidth: '32rem'
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2 border-b border-border">
          <span className="text-xs text-muted-foreground">
            Select preferred study destinations ({options.length} available)
          </span>
        </div>
        <div
          ref={scrollContainerRef}
          className="max-h-48 overflow-y-auto overflow-x-hidden p-2 space-y-1"
          style={{
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(203 213 225) transparent',
            // Ensure scrolling works
            overscrollBehavior: 'contain'
          }}
          tabIndex={-1}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground rounded cursor-pointer transition-colors select-none",
                value.includes(option.value) && "bg-accent text-accent-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option.value);
              }}
            >
              <Check
                className={cn(
                  "h-4 w-4 text-primary flex-shrink-0",
                  value.includes(option.value) ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="text-sm flex-1">{option.label}</span>
            </div>
          ))}
        </div>
        {options.length > 8 && (
          <div className="px-2 py-1 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">
              💡 Scroll to see more options
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
