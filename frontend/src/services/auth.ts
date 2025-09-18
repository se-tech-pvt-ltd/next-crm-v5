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
  const res = await http.post<any>('/api/auth/login', data);
  // API returns { user, token, expiresIn } — return user object for callers
  return res?.user || res;
}

export async function logout() {
  try {
    await http.post('/api/auth/logout');
  } catch (err) {
    // ignore
  }
}
