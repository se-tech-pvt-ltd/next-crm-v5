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
      if (!debouncedQuery) return [];
      
      const [leadsResponse, studentsResponse] = await Promise.all([
        fetch(`/api/search/leads?q=${encodeURIComponent(debouncedQuery)}`),
        fetch(`/api/search/students?q=${encodeURIComponent(debouncedQuery)}`)
      ]);

      const leads = await leadsResponse.json();
      const students = await studentsResponse.json();

      const results: SearchResult[] = [
        ...leads.map((lead: any) => ({
          id: lead.id,
          type: 'lead' as const,
          name: lead.name,
          email: lead.email,
          status: lead.status,
          additionalInfo: lead.program || lead.country
        })),
        ...students.map((student: any) => ({
          id: student.id,
          type: 'student' as const,
          name: student.name,
          email: student.email,
          status: student.status,
          additionalInfo: student.targetProgram || student.targetCountry
        }))
      ];

      return results;
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
