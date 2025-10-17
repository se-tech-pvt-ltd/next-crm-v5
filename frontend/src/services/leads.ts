import { http, HttpError } from './http';
import type { Lead, Student } from '@/lib/types';

export async function getLeads(params?: {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  lastUpdated?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.limit) searchParams.append('limit', String(params.limit));
  if (params?.status) searchParams.append('status', params.status);
  if (params?.source) searchParams.append('source', params.source);
  if (params?.lastUpdated) searchParams.append('lastUpdated', params.lastUpdated);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return http.get<{ data?: Lead[]; pagination?: any } | Lead[]>(`/api/leads${query}`);
}

export async function getLead(id: string | undefined) {
  if (!id) throw new Error('Lead ID is required');
  return http.get<Lead>(`/api/leads/${id}`);
}

export async function updateLead(id: string | undefined, data: Partial<Lead>) {
  if (!id) throw new Error('Lead ID is required');
  return http.put<Lead>(`/api/leads/${id}`, data);
}

export async function markLeadAsLost(id: string | undefined, reason: string) {
  if (!id) throw new Error('Lead ID is required');
  return http.put<Lead>(`/api/leads/${id}`, { isLost: 1, lostReason: reason });
}

export async function getStudentByLeadId(id: string | undefined): Promise<Student | null> {
  if (!id) throw new Error('Lead ID is required');
  try {
    return await http.get<Student>(`/api/students/by-lead/${id}`);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null;
    throw err;
  }
}

export async function createLead(data: Partial<Lead>) {
  return http.post<Lead>('/api/leads', data);
}

export async function getLeadsStats() {
  return http.get<any>('/api/leads/stats');
}
