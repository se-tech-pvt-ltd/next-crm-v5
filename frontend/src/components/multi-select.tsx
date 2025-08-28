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

  // Suppress ResizeObserver errors from this component
  useResizeObserverErrorSuppression();

  // Enhanced wheel event handling for better scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !open) return;

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const { deltaY } = e;

      // Check if scrolling is possible
      const canScrollUp = scrollTop > 0;
      const canScrollDown = scrollTop < scrollHeight - clientHeight;
      const isScrollingUp = deltaY < 0;
      const isScrollingDown = deltaY > 0;

      // Only handle wheel if we can scroll in that direction
      if ((isScrollingUp && canScrollUp) || (isScrollingDown && canScrollDown)) {
        e.stopPropagation();
        scrollContainer.scrollTop += deltaY;
        e.preventDefault();
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollContainer.removeEventListener('wheel', handleWheel);
  }, [open]);

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
          className="relative max-h-48 overflow-hidden"
        >
          <div
            ref={scrollContainerRef}
            className="max-h-48 overflow-y-auto overflow-x-hidden p-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgb(203 213 225) transparent'
            }}
            onWheel={(e) => {
              // Allow natural wheel scrolling, prevent event bubbling
              e.stopPropagation();
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                  value.includes(option.value) && "bg-accent text-accent-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </span>
                <span className="text-sm">{option.label}</span>
              </div>
            ))}
          </div>
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
