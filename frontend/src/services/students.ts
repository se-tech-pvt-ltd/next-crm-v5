import { http } from './http';
import type { Student } from '@/lib/types';

export async function getStudents() {
  return http.get<Student[]>('/api/students');
}

export async function convertFromLead(leadId: string | undefined, data: any) {
  return http.post<Student>('/api/students/convert-from-lead', { ...data, leadId });
}
