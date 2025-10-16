export interface UploadResponse {
  success: boolean;
  fileUrl: string;
  attachmentId?: string;
  originalName?: string;
  filename?: string;
  size?: number;
  error?: string;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const headers: Record<string, string> = {};
  try {
    const t = localStorage.getItem('auth_token');
    if (t) headers['Authorization'] = `Bearer ${t}`;
  } catch {}
  const res = await fetch('/api/upload/file', {
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
