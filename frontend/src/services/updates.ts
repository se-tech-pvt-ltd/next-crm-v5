import { http } from './http';

export interface Update {
  id: string;
  subject: string;
  subjectDesc: string;
  body: string;
  createdOn: string;
  updatedOn: string;
}

export type CreateUpdateInput = {
  subject: string;
  subjectDesc: string;
  body: string;
};

export async function listUpdates(): Promise<Update[]> {
  return http.get<Update[]>(`/api/updates`);
}

export async function createUpdate(input: CreateUpdateInput): Promise<Update> {
  return http.post<Update>(`/api/updates`, input);
}
