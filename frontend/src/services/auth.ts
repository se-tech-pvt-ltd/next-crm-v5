import { http } from './http';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserSession {
  id: string;
  email: string;
  role: string;
  branchId?: string;
}

export async function login(data: LoginRequest): Promise<UserSession> {
  return http.post<UserSession>('/api/auth/login', data);
}
