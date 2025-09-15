import { http } from "./http";

export async function getConfiguration<T = any>(name: string) {
  const res = await http.get<{ name: string; data: T }>(`/api/configurations/${encodeURIComponent(name)}`);
  return res?.data ?? null;
}

export async function setConfiguration<T = any>(name: string, data: T) {
  const res = await http.put<{ name: string; data: T }>(`/api/configurations/${encodeURIComponent(name)}`, { data });
  return res?.data ?? null;
}

export async function testSmtp(toEmail: string, configOverride?: any) {
  return await http.post<{ success: boolean; messageId?: string; message?: string }>(`/api/configurations/smtp/test`, {
    toEmail,
    config: configOverride,
  });
}
