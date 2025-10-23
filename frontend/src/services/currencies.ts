import { http } from './http';

export async function getCurrencyByCountry(country: string) {
  if (!country) return null as any;
  return http.get<any>(`/api/currencies?country=${encodeURIComponent(country)}`);
}
