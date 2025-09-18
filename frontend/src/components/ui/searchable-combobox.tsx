import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useResizeObserverErrorSuppression } from '@/lib/error-boundary';

interface SearchableComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  onSearch: (query: string) => void;
  options: Array<{
    value: string;
    label: string;
    email?: string;
    role?: string;
    disabled?: boolean;
    hint?: string;
  }>;
  loading?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function SearchableCombobox({
  value,
  onValueChange,
  placeholder = "Select item...",
  searchPlaceholder = "Search...",
  onSearch,
  options,
  loading = false,
  className,
  emptyMessage = "No results found."
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    if (open && searchInputRef.current) {
      // Use a small delay to ensure the popover is fully mounted
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10 text-left font-normal",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {selectedOption ? (
              <>
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{selectedOption.label}</div>
                  {selectedOption.email && (
                    <div className="truncate text-xs text-muted-foreground">{selectedOption.email}</div>
                  )}
                </div>
                <div
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded cursor-pointer flex items-center justify-center transition-colors"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                </div>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        style={{
          minWidth: 'var(--radix-popover-trigger-width)',
          maxWidth: '32rem'
        }}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          // Let our useEffect handle the focus
        }}
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div
          ref={scrollContainerRef}
          className="max-h-60 overflow-y-auto overflow-x-hidden p-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(203 213 225) transparent'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "relative flex select-none items-center rounded-sm px-2 py-2 text-sm",
                  option.disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  value === option.value && "bg-accent text-accent-foreground"
                )}
                onClick={() => { if (!option.disabled) handleSelect(option.value); }}
                aria-disabled={option.disabled || undefined}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{option.label}</div>
                    {option.email && (
                      <div className="truncate text-xs text-muted-foreground">{option.email}</div>
                    )}
                    {option.hint && (
                      <div className="truncate text-[11px] text-muted-foreground">{option.hint}</div>
                    )}
                    {option.role && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {option.role}
                      </Badge>
                    )}
                  </div>
                </div>
                {value === option.value && (
                  <Check className="ml-2 h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
        {searchQuery && !loading && options.length > 0 && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Showing {options.length} results
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
