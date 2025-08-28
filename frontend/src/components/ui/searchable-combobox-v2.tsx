import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
    subtitle?: string;
  }>;
  loading?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function SearchableComboboxV2({
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(option => option.value === value);

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  const handleSelect = useCallback((selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
    setSearchQuery('');
  }, [onValueChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange('');
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
                {(selectedOption.email || selectedOption.subtitle) && (
                  <div className="truncate text-xs text-muted-foreground">
                    {selectedOption.email || selectedOption.subtitle}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded cursor-pointer flex items-center justify-center transition-colors"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn(
          "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md animate-in fade-in-0 zoom-in-95 min-w-80 max-w-lg">
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
          <div className="max-h-60 overflow-y-auto overflow-x-hidden p-1">
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
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{option.label}</div>
                      {(option.email || option.subtitle) && (
                        <div className="truncate text-xs text-muted-foreground">
                          {option.email || option.subtitle}
                        </div>
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
        </div>
      )}
    </div>
  );
}
