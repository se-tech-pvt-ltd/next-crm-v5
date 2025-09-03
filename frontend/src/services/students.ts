import { http } from './http';
import type { Student } from '@/lib/types';

export async function getStudents() {
  return http.get<Student[]>('/api/students');
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
