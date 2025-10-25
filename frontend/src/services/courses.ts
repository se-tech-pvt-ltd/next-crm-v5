import { http } from './http';

export type Course = {
  id: string;
  universityId: string;
  name: string;
  category: string | null;
  fees: number | null;
  isTopCourse: boolean | null;
  universityName: string | null;
  country: string | null;
};

export async function getCourses() {
  return http.get<{ data: Course[] }>(`/api/university-courses`);
}
