import { http } from './http';

export interface RegistrationPayload {
  status: string;
  name: string;
  number?: string;
  email?: string;
  city?: string;
  source?: string;
  eventId: string;
}

export async function getRegistrations() {
  return http.get<any[]>('/api/event-registrations');
}

export async function getRegistrationsByEvent(eventId: string) {
  return http.get<any[]>(`/api/event-registrations/event/${eventId}`);
}

export async function createRegistration(data: RegistrationPayload) {
  return http.post<any>('/api/event-registrations', data);
}

export async function updateRegistration(id: string, data: Partial<RegistrationPayload>) {
  return http.put<any>(`/api/event-registrations/${id}`, data);
}

export async function deleteRegistration(id: string) {
  return http.delete<void>(`/api/event-registrations/${id}`);
}

export async function convertToLead(id: string) {
  return http.post<any>(`/api/event-registrations/${id}/convert`, {});
}
