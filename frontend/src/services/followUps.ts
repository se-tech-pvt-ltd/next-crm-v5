import { http } from "./http";
import type { FollowUp } from "@/lib/types";

export interface FollowUpQueryParams {
  start: Date | string;
  end: Date | string;
  entityTypes?: string[];
}

export interface FollowUpQueryResponse {
  data: FollowUp[];
  meta: {
    start: string;
    end: string;
    total: number;
  };
}

const toIso = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

export async function getFollowUps(params: FollowUpQueryParams): Promise<FollowUpQueryResponse> {
  const { start, end, entityTypes } = params;
  const searchParams = new URLSearchParams({
    start: toIso(start),
    end: toIso(end),
  });

  if (entityTypes && entityTypes.length > 0) {
    for (const type of entityTypes) {
      if (type && type.trim()) {
        searchParams.append("entityType", type.trim());
      }
    }
  }

  const queryString = searchParams.toString();
  return http.get<FollowUpQueryResponse>(`/api/follow-ups?${queryString}`);
}
