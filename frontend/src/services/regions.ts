import { http } from './http';

export interface Region {
  id: string;
  regionName: string;
  regionHeadId?: string | null;
  createdOn?: string | Date;
  updatedOn?: string | Date;
}

export type CreateRegionInput = {
  name: string;
  headId?: string | null;
};

export async function listRegions(params?: { q?: string; limit?: number }): Promise<Region[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const url = qs.toString() ? `/api/regions?${qs.toString()}` : '/api/regions';
  return http.get<Region[]>(url);
}

export async function createRegion(input: CreateRegionInput): Promise<Region> {
  return http.post<Region>('/api/regions', input);
}

export async function updateRegion(id: string, input: CreateRegionInput): Promise<Region> {
  return http.put<Region>(`/api/regions/${id}`, input);
}
