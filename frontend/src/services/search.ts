import { SearchResult } from '@/lib/types';
import { http } from './http';

export async function searchLeads(q: string): Promise<any[]> {
  return http.get<any[]>(`/api/search/leads?q=${encodeURIComponent(q)}`);
}

export async function searchStudents(q: string): Promise<any[]> {
  return http.get<any[]>(`/api/search/students?q=${encodeURIComponent(q)}`);
}

export async function searchAll(q: string): Promise<SearchResult[]> {
  if (!q) return [];
  const [leads, students] = await Promise.all([
    searchLeads(q),
    searchStudents(q),
  ]);

  const results: SearchResult[] = [
    ...leads.map((lead: any) => ({
      id: lead.id,
      type: 'lead' as const,
      name: lead.name,
      email: lead.email,
      status: lead.status,
      additionalInfo: lead.program || lead.country,
    })),
    ...students.map((student: any) => ({
      id: student.id,
      type: 'student' as const,
      name: student.name,
      email: student.email,
      status: student.status,
      additionalInfo: student.targetProgram || student.targetCountry,
    })),
  ];

  return results;
}
