import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value?: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  options: MultiSelectOption[];
  className?: string;
  emptyMessage?: string;
  maxDisplayItems?: number;
}

export function MultiSelect({
  value = [],
  onValueChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  options,
  className,
  emptyMessage = "No options found.",
  maxDisplayItems = 3
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOptions = options.filter(option => value.includes(option.value));

  useEffect(() => {
    if (open && searchInputRef.current) {
      // Use a small delay to ensure the popover is fully mounted
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onValueChange(newValue);
  };

  const handleRemove = (optionValue: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newValue = value.filter(v => v !== optionValue);
    onValueChange(newValue);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange([]);
  };

  const displayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }

    if (selectedOptions.length <= maxDisplayItems) {
      return selectedOptions.map(option => option.label).join(', ');
    }

    return `${selectedOptions.slice(0, maxDisplayItems).map(option => option.label).join(', ')} +${selectedOptions.length - maxDisplayItems} more`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-10 text-left font-normal",
            selectedOptions.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center flex-1 min-w-0 py-1">
            {selectedOptions.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1 flex-1">
                {selectedOptions.slice(0, maxDisplayItems).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="text-xs"
                  >
                    {option.label}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRemove(option.value);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => handleRemove(option.value, e)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
                {selectedOptions.length > maxDisplayItems && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedOptions.length - maxDisplayItems} more
                  </Badge>
                )}
              </div>
            )}
            {selectedOptions.length > 0 && (
              <button
                className="ml-2 h-4 w-4 shrink-0 hover:text-destructive"
                onClick={handleClearAll}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        style={{
          minWidth: 'var(--radix-popover-trigger-width)',
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
        <div className="max-h-60 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 rounded-sm px-2 py-2 hover:bg-accent cursor-pointer"
                onClick={() => handleSelect(option.value)}
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onChange={() => {}} // Handled by parent onClick
                  className="pointer-events-none"
                />
                <span className="text-sm flex-1">{option.label}</span>
                {value.includes(option.value) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))
          )}
        </div>
        {selectedOptions.length > 0 && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex justify-between">
            <span>{selectedOptions.length} selected</span>
            <button
              onClick={handleClearAll}
              className="text-destructive hover:text-destructive/80"
            >
              Clear all
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
