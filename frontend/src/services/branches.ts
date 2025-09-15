import { http } from "./http";

export interface Branch {
  id: string;
  name: string;
  code: string;
  city?: string;
  address?: string;
  managerId?: string;
  status?: string;
}

export async function listBranches(): Promise<Branch[]> {
  return http.get<Branch[]>("/api/configurations/branches/list/all");
}

export async function createBranch(input: Omit<Branch, 'id'>): Promise<Branch> {
  return http.post<Branch>("/api/configurations/branches", input);
}
