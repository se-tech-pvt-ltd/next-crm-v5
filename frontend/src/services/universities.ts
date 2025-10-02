import { http } from '@/services/http';

export interface UniversitySummary {
  id: string;
  name: string;
  website: string | null;
  coverImageUrl: string | null;
  logoImageUrl: string | null;
}

export interface UniversityDetail {
  overview: {
    id: string;
    name: string;
    website: string | null;
    coverImageUrl: string | null;
    logoImageUrl: string | null;
    about: string | null;
    campusCity: string | null;
  };
  feesAndFunding: {
    totalFees: number | null;
    initialDepositAmount: number | null;
    scholarshipFee: number | null;
    meritScholarships: string | null;
  };
  admissionRequirements: {
    ugEntryCriteria: string | null;
    pgEntryCriteria: string | null;
    eltRequirements: string | null;
    moiPolicy: string | null;
    studyGap: string | null;
    priority: 'High' | 'Medium' | 'Low' | null;
    intakes: string[];
    acceptedElts: string[];
  };
  resources: {
    driveUrl: string | null;
    notes: string | null;
  };
  courses: {
    id: string;
    name: string;
    category: string;
    fees: number | null;
    isTopCourse: boolean;
  }[];
}

export async function listUniversities() {
  return http.get<UniversitySummary[]>('/api/universities');
}

export async function getUniversity(id: string) {
  return http.get<UniversityDetail>(`/api/universities/${encodeURIComponent(id)}`);
}
