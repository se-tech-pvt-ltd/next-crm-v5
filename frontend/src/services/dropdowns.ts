import { http } from './http';

export async function getModuleDropdowns(module: string) {
  return http.get<Record<string, any[]>>(`/api/dropdowns/module/${module}`);
}

export async function getAllDropdowns() {
  return http.get<any[]>(`/api/dropdowns`);
}
