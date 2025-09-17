export async function uploadProfilePicture(file: File): Promise<{ success: boolean; fileUrl: string; attachmentId?: string; }> {
  const form = new FormData();
  form.append('profilePicture', file);
  const res = await fetch('/api/upload/profile-picture', {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    const message = json?.error || `Upload failed with status ${res.status}`;
    throw new Error(message);
  }
  return json;
}
