import { db } from "../config/database.js";
import { universities, universityCourses } from "../shared/schema.js";
import { eq } from "drizzle-orm";

export interface UniversityCourseListItem {
  id: string;
  universityId: string;
  name: string;
  category: string | null;
  fees: number | null;
  isTopCourse: number | boolean | null;
  universityName: string | null;
  country: string | null;
}

export class UniversityCourseService {
  static async listAll(): Promise<UniversityCourseListItem[]> {
    const rows = await db
      .select({
        id: universityCourses.id,
        universityId: universityCourses.universityId,
        name: universityCourses.name,
        category: universityCourses.category,
        fees: universityCourses.fees,
        isTopCourse: universityCourses.isTopCourse,
        universityName: universities.name,
        country: universities.country,
      })
      .from(universityCourses)
      .leftJoin(universities, eq(universities.id, universityCourses.universityId));

    return rows.map((r: any) => ({
      id: String(r.id),
      universityId: String(r.universityId),
      name: String(r.name),
      category: (r.category == null ? null : String(r.category)),
      fees: r.fees == null ? null : Number(r.fees),
      isTopCourse: r.isTopCourse == null ? null : Number(r.isTopCourse) === 1 || r.isTopCourse === true,
      universityName: r.universityName == null ? null : String(r.universityName),
      country: r.country == null ? null : String(r.country),
    }));
  }
}
