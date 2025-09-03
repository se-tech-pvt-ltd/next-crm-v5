import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchResult } from '@/lib/types';

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [] as SearchResult[];
      const { searchAll } = await import('@/services/search');
      return searchAll(debouncedQuery);
    },
    enabled: debouncedQuery.length > 0,
  });

  return {
    searchQuery,
    setSearchQuery,
    searchResults: searchResults || [],
    isSearching: isLoading,
  };
}
