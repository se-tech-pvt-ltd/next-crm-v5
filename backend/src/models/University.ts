import { db } from "../config/database.js";
import { universities, universityIntakes, universityAcceptedElts, universityCourses, UniversitySummary, UniversityDetail, type University } from "../shared/schema.js";
import { desc, eq } from "drizzle-orm";

export class UniversityModel {
  static async findAll(): Promise<UniversitySummary[]> {
    return await db.select({
      id: universities.id,
      name: universities.name,
      country: universities.country,
      website: universities.website,
      coverImageUrl: universities.coverImageUrl,
      logoImageUrl: universities.logoImageUrl,
    })
      .from(universities)
      .orderBy(desc(universities.createdAt));
  }

 

  static async findById(id: string): Promise<UniversityDetail | null> {
    const uni = (await db
      .select()
      .from(universities)
      .where(eq(universities.id, id))
      .limit(1)
      .execute())[0];

    if (!uni) return null;

    const intakes = await db
      .select({ id: universityIntakes.id, intakeLabel: universityIntakes.intakeLabel })
      .from(universityIntakes)
      .where(eq(universityIntakes.universityId, id));

    const acceptedElts = await db
      .select({ eltName: universityAcceptedElts.eltName })
      .from(universityAcceptedElts)
      .where(eq(universityAcceptedElts.universityId, id));

    const courses = await db
      .select({
        id: universityCourses.id,
        name: universityCourses.name,
        category: universityCourses.category,
        fees: universityCourses.fees,
        isTopCourse: universityCourses.isTopCourse,
      })
      .from(universityCourses)
      .where(eq(universityCourses.universityId, id));

    return {
      overview: {
        id: uni.id,
        name: uni.name,
        website: uni.website,
        coverImageUrl: uni.coverImageUrl,
        logoImageUrl: uni.logoImageUrl,
        about: uni.about,
        campusCity: uni.campusCity,
        country: uni.country,
      },
      feesAndFunding: {
        totalFees: uni.totalFees !== null ? Number(uni.totalFees) : null,
        initialDepositAmount: uni.initialDepositAmount !== null ? Number(uni.initialDepositAmount) : null,
        scholarshipFee: uni.scholarshipFee !== null ? Number(uni.scholarshipFee) : null,
        meritScholarships: uni.meritScholarships,
      },
      admissionRequirements: {
        ugEntryCriteria: uni.ugEntryCriteria,
        pgEntryCriteria: uni.pgEntryCriteria,
        eltRequirements: uni.eltRequirements,
        moiPolicy: uni.moiPolicy,
        studyGap: uni.studyGap,
        priority: uni.priority,
        intakes: intakes.map(i => i.intakeLabel),
        intakesWithIds: intakes.map(i => ({ id: i.id, intakeLabel: i.intakeLabel })),
        acceptedElts: acceptedElts.map(e => e.eltName),
      },
      resources: {
        driveUrl: uni.driveUrl,
        notes: uni.notes,
      },
      courses: courses.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        fees: c.fees !== null ? Number(c.fees) : null,
        isTopCourse: !!c.isTopCourse,
      })),
    };
  }

}
