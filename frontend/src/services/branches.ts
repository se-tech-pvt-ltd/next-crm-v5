import { http } from './http';

export interface Branch {
  id: string;
  name?: string; // some APIs return branchName, normalize in UI
  branchName?: string;
  code?: string;
  city: string;
  country: string;
  address: string;
  officialPhone: string;
  officialEmail: string;
  managerId?: string | null;
  branchHeadId?: string | null;
  status?: string;
}

export type CreateBranchInput = {
  name: string;
  city: string;
  country: string;
  address: string;
  officialPhone: string;
  officialEmail: string;
  managerId?: string | null;
};

export async function listBranches(params?: { q?: string; limit?: number }): Promise<Branch[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const url = qs.toString() ? `/api/branches?${qs.toString()}` : '/api/branches';
  return http.get<Branch[]>(url);
}

export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  return http.post<Branch>('/api/branches', input);
}

export async function updateBranch(id: string, input: CreateBranchInput): Promise<Branch> {
  return http.put<Branch>(`/api/branches/${id}`, input);
}
