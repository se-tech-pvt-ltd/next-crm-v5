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

export type CourseListResponse = {
  data: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export interface CourseQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  universityId?: string;
  top?: 'top' | 'non-top' | 'all';
}

function toQueryString(params: CourseQueryParams) {
  const parts: string[] = [];
  if (params.page != null) parts.push(`page=${encodeURIComponent(String(params.page))}`);
  if (params.limit != null) parts.push(`limit=${encodeURIComponent(String(params.limit))}`);
  if (params.q != null && params.q !== '') parts.push(`q=${encodeURIComponent(String(params.q))}`);
  if (params.category != null && params.category !== '') parts.push(`category=${encodeURIComponent(String(params.category))}`);
  if (params.universityId != null && params.universityId !== '') parts.push(`universityId=${encodeURIComponent(String(params.universityId))}`);
  if (params.top != null && params.top !== '') parts.push(`top=${encodeURIComponent(String(params.top))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export async function getCourses(params: CourseQueryParams = {}) {
  const qs = toQueryString(params);
  return http.get<CourseListResponse>(`/api/university-courses${qs}`);
}
