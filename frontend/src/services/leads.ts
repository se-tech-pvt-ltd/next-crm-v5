import { http } from './http';
import type { Lead, Student } from '@/lib/types';

export async function getLeads() {
  return http.get<Lead[]>('/api/leads');
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
  return http.put<Lead>(`/api/leads/${id}`, { status: 'lost', lostReason: reason });
}

export async function getStudentByLeadId(id: string | undefined) {
  if (!id) throw new Error('Lead ID is required');
  return http.get<Student | undefined>(`/api/students/by-lead/${id}`);
}

export async function createLead(data: Partial<Lead>) {
  return http.post<Lead>('/api/leads', data);
}
