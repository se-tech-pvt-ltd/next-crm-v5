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

export async function listBranches(): Promise<Branch[]> {
  return http.get<Branch[]>('/api/branches');
}

export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  return http.post<Branch>('/api/branches', input);
}

export async function updateBranch(id: string, input: CreateBranchInput): Promise<Branch> {
  return http.put<Branch>(`/api/branches/${id}`, input);
}
