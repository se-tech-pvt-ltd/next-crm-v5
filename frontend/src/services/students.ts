import { http } from './http';
import type { Student } from '@/lib/types';

export async function getStudents(params?: { page?: number; limit?: number }) {
  const query = params?.page ? `?page=${params.page}&limit=${params?.limit ?? ''}` : '';
  return http.get<{ data?: Student[]; pagination?: any } | Student[]>(`/api/students${query}`);
}

export async function getStudent(id: string | undefined) {
  if (!id) throw new Error('Student ID is required');
  return http.get<Student>(`/api/students/${id}`);
}

export async function updateStudent(id: string | undefined, data: Partial<Student>) {
  if (!id) throw new Error('Student ID is required');
  return http.put<Student>(`/api/students/${id}`, data);
}

export async function createStudent(data: Partial<Student>) {
  return http.post<Student>('/api/students', data);
}

export async function convertFromLead(leadId: string | undefined, data: any) {
  return http.post<Student>('/api/students/convert-from-lead', { ...data, leadId });
}

export async function getStudentByLeadId(leadId: string | undefined) {
  if (!leadId) throw new Error('Lead ID is required');
  return http.get<Student>(`/api/students/by-lead/${leadId}`);
}
