import { db } from "../config/database.js";
import { universities, UniversityDetail, UniversitySummary, type University } from "../shared/schema.js";
import { UniversityModel } from "../models/University.js";
import { eq, desc } from "drizzle-orm";

interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export class UniversityService {
  static async getUniversities(pagination?: PaginationOptions): Promise<UniversitySummary[]> {
    return await UniversityModel.findAll();
  }
  static async getUniversityById(id: string): Promise<UniversityDetail | null> {
    return await UniversityModel.findById(id);
  }
}