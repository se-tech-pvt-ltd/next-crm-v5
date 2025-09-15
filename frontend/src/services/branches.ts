import { http } from "./http";

import { http } from './http';

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  address: string;
  officialPhone: string;
  officialEmail: string;
  managerId?: string | null;
  status: string;
}

export type CreateBranchInput = Omit<Branch, 'id'>;

export async function listBranches(): Promise<Branch[]> {
  return http.get<Branch[]>('/api/branches');
}

export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  return http.post<Branch>('/api/branches', input);
}
