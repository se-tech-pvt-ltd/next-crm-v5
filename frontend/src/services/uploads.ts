export interface UploadResponse {
  success: boolean;
  fileUrl: string;
  attachmentId?: string;
  originalName?: string;
  filename?: string;
  size?: number;
  error?: string;
}

export async function uploadFile(file: File, options?: { baseApiUrl?: string }): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const headers: Record<string, string> = {};
  try {
    const t = localStorage.getItem('auth_token');
    if (t) headers['Authorization'] = `Bearer ${t}`;
  } catch {}

  const baseApi = (options?.baseApiUrl || '').replace(/\/$/, '');
  const endpoint = baseApi ? `${baseApi}/upload/file` : '/api/upload/file';

  const res = await fetch(endpoint, {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers,
  });
  const json: UploadResponse = await res.json();
  if (!res.ok || !(json as any)?.success) {
    const message = (json as any)?.error || `Upload failed with status ${res.status}`;
    throw new Error(message);
  }

  // Ensure returned fileUrl is absolute when a baseApiUrl is provided
  if (options?.baseApiUrl && json?.fileUrl) {
    const fileUrl = String(json.fileUrl);
    const base = options.baseApiUrl.replace(/\/$/, '');
    const baseDomain = base.replace(/\/api\/?$/, '');
    if (!/^https?:\/\//i.test(fileUrl)) {
      const absolute = fileUrl.startsWith('/api/')
        ? `${baseDomain}${fileUrl}`
        : fileUrl.startsWith('/')
          ? `${base}${fileUrl}`
          : `${base}/${fileUrl}`;
      json.fileUrl = absolute;
    }
  }

  return json;
}

export async function uploadProfilePicture(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('profilePicture', file);
  const headers: Record<string, string> = {};
  try {
    const t = localStorage.getItem('auth_token');
    if (t) headers['Authorization'] = `Bearer ${t}`;
  } catch {}
  const res = await fetch('/api/upload/profile-picture', {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers,
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    const message = json?.error || `Upload failed with status ${res.status}`;
    throw new Error(message);
  }
  return json;
}
