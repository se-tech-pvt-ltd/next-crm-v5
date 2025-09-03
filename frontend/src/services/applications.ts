import { http } from './http';
import type { Application } from '@/lib/types';

export async function getApplications(params?: { page?: number; limit?: number }) {
  const query = params?.page ? `?page=${params.page}&limit=${params?.limit ?? ''}` : '';
  return http.get<{ data?: Application[] } | Application[]>(`/api/applications${query}`);
}

export async function getApplication(id: string | undefined) {
  if (!id) throw new Error('Application ID is required');
  return http.get<Application>(`/api/applications/${id}`);
}

export async function createApplication(data: Partial<Application>) {
  return http.post<Application>('/api/applications', data);
}

export async function updateApplication(id: string | undefined, data: Partial<Application>) {
  if (!id) throw new Error('Application ID is required');
  return http.put<Application>(`/api/applications/${id}`, data);
}
