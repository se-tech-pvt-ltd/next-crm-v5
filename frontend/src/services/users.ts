import { http } from './http';

import { http } from '@/services/http';

export async function getUsers() {
  const res = await http.get<any[]>('/api/users');
  return (Array.isArray(res) ? res : []).filter((u: any) => String(u.role) !== 'system_admin');
}

export async function getPartnerUsers(partnerId?: string) {
  try {
    let pid = String(partnerId || '').trim();
    if (!pid) {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const parts = String(token).split('.');
          if (parts.length >= 2) {
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const pad = b64.length % 4;
            const b64p = b64 + (pad ? '='.repeat(4 - pad) : '');
            const json = decodeURIComponent(atob(b64p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const payload = JSON.parse(json) as any;
            pid = String(payload?.role_details?.partner_id || payload?.roleDetails?.partnerId || payload?.partner_id || payload?.partnerId || payload?.id || '').trim();
          }
        }
      } catch {}
    }
    const url = pid ? `/api/users/sub-partners?partnerId=${encodeURIComponent(pid)}` : '/api/users/sub-partners';
    const res = await http.get<any[]>(url);
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function getUser(id: string) {
  if (!id) throw new Error('User ID is required');
  return http.get<any>(`/api/users/${id}`);
}

export async function updateUser(id: string | null, data: any) {
  if (!id) throw new Error('User ID is required');
  return http.put<any>(`/api/users/${id}`, data);
}

export async function changePassword(id: string | null, currentPassword: string | undefined, newPassword: string) {
  if (!id) throw new Error('User ID is required');
  const token = (() => { try { return localStorage.getItem('auth_token'); } catch { return null; } })();
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api/users/${id}/password`, { method: 'PUT', headers, body: JSON.stringify({ newPassword }), credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json && (json.message || json.error)) || `Request failed with status ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

export async function createUser(data: any) {
  return http.post<any>(`/api/users`, data);
}

export async function inviteUser(data: any) {
  return http.post<any>(`/api/users/invite`, data);
}
