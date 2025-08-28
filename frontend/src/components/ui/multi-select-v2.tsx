import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export function MultiSelectV2({
  value = [],
  onValueChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  options,
  className,
  emptyMessage = "No options found.",
  maxDisplayItems = 3
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOptions = options.filter(option => value.includes(option.value));

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  const handleSelect = useCallback((optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onValueChange(newValue);
  }, [value, onValueChange]);

  const handleRemove = useCallback((optionValue: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const newValue = value.filter(v => v !== optionValue);
    onValueChange(newValue);
  }, [value, onValueChange]);

  const handleClearAll = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange([]);
  }, [onValueChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        onClick={handleToggle}
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
                  <span
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
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
                  </span>
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
            <div
              className="ml-2 h-4 w-4 shrink-0 hover:text-destructive cursor-pointer"
              onClick={handleClearAll}
            >
              <X className="h-4 w-4" />
            </div>
          )}
        </div>
        <ChevronDown className={cn(
          "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-6"
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
                </div>
              ))
            )}
          </div>
          {selectedOptions.length > 0 && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground flex justify-between">
              <span>{selectedOptions.length} selected</span>
              <span
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive/80 cursor-pointer"
              >
                Clear all
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
