export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

async function uploadFormData(url: string, formData: FormData): Promise<UploadResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      const message = json?.error || json?.message || `Upload failed with status ${res.status}`;
      return { success: false, error: message };
    }
    return { success: true, fileUrl: json.fileUrl };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append('file', file);
  return uploadFormData('/api/upload/file', fd);
}

export async function uploadProfilePicture(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append('profilePicture', file);
  return uploadFormData('/api/upload/profile-picture', fd);
}
