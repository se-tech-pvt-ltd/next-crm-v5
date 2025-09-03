import { http } from './http';
import type { Admission } from '@/lib/types';

export async function getAdmissions(params?: { page?: number; limit?: number }) {
  const query = params?.page ? `?page=${params.page}&limit=${params?.limit ?? ''}` : '';
  return http.get<{ data?: Admission[] } | Admission[]>(`/api/admissions${query}`);
}

export async function getAdmission(id: string | undefined) {
  if (!id) throw new Error('Admission ID is required');
  return http.get<Admission>(`/api/admissions/${id}`);
}

export async function createAdmission(data: Partial<Admission>) {
  return http.post<Admission>('/api/admissions', data);
}

export async function updateAdmission(id: string | undefined, data: Partial<Admission>) {
  if (!id) throw new Error('Admission ID is required');
  return http.put<Admission>(`/api/admissions/${id}`, data);
}
