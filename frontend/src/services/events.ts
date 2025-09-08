import { http } from './http';

export interface EventPayload {
  name: string;
  type: string;
  date: string;
  venue: string;
  time: string;
}

export async function getEvents() {
  return http.get<any[]>('/api/events');
}

export async function getEvent(id: string) {
  return http.get<any>(`/api/events/${id}`);
}

export async function createEvent(data: EventPayload) {
  return http.post<any>('/api/events', data);
}

export async function updateEvent(id: string, data: Partial<EventPayload>) {
  return http.put<any>(`/api/events/${id}`, data);
}

export async function deleteEvent(id: string) {
  return http.delete<void>(`/api/events/${id}`);
}
