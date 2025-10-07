import { http } from './http';

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
  // If token present, store temporarily for subsequent requests
  try {
    if (res && typeof res === 'object' && 'token' in res && res.token) {
      try { localStorage.setItem('auth_token', String(res.token)); } catch {}
    }
  } catch {}
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

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
}

export interface VerifyResetTokenResponse {
  message: string;
  expiresAt: string;
}

export async function verifyResetToken(email: string, token: string): Promise<VerifyResetTokenResponse> {
  const query = new URLSearchParams({ email, token }).toString();
  return http.get(`/api/auth/reset-password/verify?${query}`);
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<{ message: string }> {
  return http.post('/api/auth/reset-password', payload);
}
