export class HttpError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function request<T>(method: HttpMethod, url: string, body?: unknown): Promise<T> {
  try {
    const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const t = localStorage.getItem('auth_token');
      if (t) baseHeaders['Authorization'] = `Bearer ${t}`;
    } catch {}

    const fetchUrl = (typeof window !== 'undefined' && !/^https?:\/\//i.test(String(url))) ? `${window.location.origin}${url}` : url;
    const res = await fetch(fetchUrl, {
      method,
      headers: baseHeaders,
      body: body == null ? undefined : JSON.stringify(body),
      credentials: 'include',
    });

    let json: any;
    try {
      const text = await res.text();
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }

    if (!res.ok) {
      if (res.status === 401 && typeof unauthorizedHandler === 'function') {
        try { unauthorizedHandler(); } catch {}
      }
      const message = (json && (json.message || json.error)) || `Request failed with status ${res.status}`;
      throw new HttpError(message, res.status, json);
    }

    return json as T;
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(err?.message || 'Network error', 0);
  }
}

export const http = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
};
