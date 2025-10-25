import { db } from "../config/database.js";
import { universities, universityCourses } from "../shared/schema.js";
import { and, or, like, eq, desc, sql } from "drizzle-orm";

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

export interface CourseQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  top?: 'top' | 'non-top' | 'all';
}

export class UniversityCourseService {
  static async list(params: CourseQueryParams = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 8));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    const q = (params.q || '').trim();
    if (q) {
      const likeQ = `%${q}%`;
      conditions.push(
        or(
          like(universityCourses.name, likeQ),
          like(universities.name, likeQ),
          like(universities.country, likeQ)
        )
      );
    }
    if (params.category && params.category !== 'all') {
      conditions.push(eq(universityCourses.category, params.category));
    }
    if (params.top && params.top !== 'all') {
      const wantTop = params.top === 'top';
      conditions.push(eq(universityCourses.isTopCourse, wantTop ? 1 : 0));
    }

    const whereExpr = conditions.length ? and(...conditions) : undefined;

    const [{ value: total }] = await db
      .select({ value: sql<number>`COUNT(*)` })
      .from(universityCourses)
      .leftJoin(universities, eq(universities.id, universityCourses.universityId))
      .where(whereExpr as any);

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
      .leftJoin(universities, eq(universities.id, universityCourses.universityId))
      .where(whereExpr as any)
      .orderBy(desc(universityCourses.createdAt))
      .limit(limit)
      .offset(offset);

    const data: UniversityCourseListItem[] = rows.map((r: any) => ({
      id: String(r.id),
      universityId: String(r.universityId),
      name: String(r.name),
      category: (r.category == null ? null : String(r.category)),
      fees: r.fees == null ? null : Number(r.fees),
      isTopCourse: r.isTopCourse == null ? null : Number(r.isTopCourse) === 1 || r.isTopCourse === true,
      universityName: r.universityName == null ? null : String(r.universityName),
      country: r.country == null ? null : String(r.country),
    }));

    const totalNum = Number(total || 0);
    const totalPages = Math.max(1, Math.ceil(totalNum / limit));

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalNum,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async listAll() {
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
      .leftJoin(universities, eq(universities.id, universityCourses.universityId))
      .orderBy(desc(universityCourses.createdAt));

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
