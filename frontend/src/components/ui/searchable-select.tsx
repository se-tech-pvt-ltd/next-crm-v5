import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  options: SearchableSelectOption[];
  className?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  options,
  className,
  emptyMessage = "No options found.",
  disabled = false
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    if (open && searchInputRef.current) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
    setSearchQuery('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery('');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-10 text-left font-normal",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        style={{
          minWidth: 'var(--radix-popover-trigger-width)',
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
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
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  value === option.value && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSelect(option.value)}
              >
                <span className="flex-1">{option.label}</span>
                {value === option.value && (
                  <Check className="ml-2 h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
        {searchQuery && filteredOptions.length > 0 && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Showing {filteredOptions.length} of {options.length} options
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
