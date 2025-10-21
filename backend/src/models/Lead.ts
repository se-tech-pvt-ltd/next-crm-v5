import { eq, desc, and, not, exists, count, or, gte, lte, type SQL } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { db } from "../config/database.js";
import { leads, students, type Lead, type InsertLead } from "../shared/schema.js";
import { eq, ne, and, or, lte, count, sql } from "drizzle-orm";

interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

interface FilterOptions {
  status?: string;
  source?: string;
  lastUpdated?: string;
  filterType?: 'active' | 'lost' | 'converted';
}

interface PaginatedLeadsResult {
  leads: Lead[];
  total: number;
}

export interface LeadStats {
  total: number;
  active: number;
  lost: number;
  converted: number;
}

interface LeadScope {
  counselorId?: string;
  admissionOfficerId?: string;
  branchId?: string;
  regionId?: string;
  partner?: string;
}

export class LeadModel {
  // Helper function to combine multiple conditions with AND
  private static combineConditions(conditions: SQL<unknown>[]): SQL<unknown> | undefined {
    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return and(...conditions) as SQL<unknown>;
  }

  // Helper function to build filter conditions based on filter options
  private static buildFilterConditions(filters?: FilterOptions): SQL<unknown>[] {
    const conditions: SQL<unknown>[] = [];

    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(leads.status, filters.status));
    }

    if (filters?.source && filters.source !== 'all') {
      conditions.push(eq(leads.source, filters.source));
    }

    if (filters?.lastUpdated && filters.lastUpdated !== 'all') {
      const now = new Date();
      let daysAgo: number;

      switch (filters.lastUpdated) {
        case '1':
          daysAgo = 1;
          break;
        case '3':
          daysAgo = 3;
          break;
        case '7':
          daysAgo = 7;
          break;
        case '14':
          daysAgo = 14;
          break;
        case '30':
          daysAgo = 30;
          break;
        default:
          return conditions;
      }

      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      conditions.push(lte(leads.updatedAt, cutoffDate) as SQL<unknown>);
    }

    // Handle custom filter types
    if (filters?.filterType === 'active') {
      // Active: NOT lost AND NOT converted
      conditions.push(ne(leads.isLost, 1));
      conditions.push(ne(leads.isConverted, 1));
    } else if (filters?.filterType === 'lost') {
      // Lost: isLost = 1
      conditions.push(eq(leads.isLost, 1));
    } else if (filters?.filterType === 'converted') {
      // Converted: isConverted = 1
      conditions.push(eq(leads.isConverted, 1));
    }

    return conditions;
  }

  // Helper function to parse JSON fields back to arrays for frontend consumption
  private static parseLeadFields(lead: Lead): Lead {
    const parsedLead = { ...lead };

    // Parse country field if it's a JSON string
    if (parsedLead.country && typeof parsedLead.country === 'string') {
      try {
        const parsed = JSON.parse(parsedLead.country);
        if (Array.isArray(parsed)) {
          (parsedLead as any).country = parsed;
        }
      } catch {
        // If parsing fails, keep as string (backward compatibility)
      }
    }

    // Parse program field if it's a JSON string
    if (parsedLead.program && typeof parsedLead.program === 'string') {
      try {
        const parsed = JSON.parse(parsedLead.program);
        if (Array.isArray(parsed)) {
          (parsedLead as any).program = parsed;
        }
      } catch {
        // If parsing fails, keep as string (backward compatibility)
      }
    }

    return parsedLead;
  }

  private static buildScopeConditions(scope?: LeadScope): SQL<unknown>[] {
    if (!scope) return [];
    const conditions: SQL<unknown>[] = [];
    if (scope.counselorId) {
      conditions.push(eq(leads.counselorId, scope.counselorId));
    }
    if (scope.admissionOfficerId) {
      conditions.push(eq(leads.admissionOfficerId, scope.admissionOfficerId));
    }
    if (scope.branchId) {
      conditions.push(eq(leads.branchId, scope.branchId));
    }
    if (scope.regionId) {
      conditions.push(eq(leads.regionId, scope.regionId));
    }
    if (scope.partner) {
      conditions.push(eq(leads.partner, scope.partner));
    }
    return conditions;
  }

  private static combineConditions(conditions: SQL<unknown>[]): SQL<unknown> | undefined {
    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return and(...conditions);
  }

  private static countWithConditions(scopeConditions: SQL<unknown>[], extraConditions: SQL<unknown>[] = []) {
    const whereClause = this.combineConditions([...scopeConditions, ...extraConditions]);
    const query = db.select({ count: count() }).from(leads);
    return whereClause ? query.where(whereClause) : query;
  }

  static async getStats(scope?: LeadScope, filters?: FilterOptions): Promise<LeadStats> {
    const scopeConditions = this.buildScopeConditions(scope);
    const filterConditions = this.buildFilterConditions(filters);
    const allScopeAndFilterConditions = [...scopeConditions, ...filterConditions];

    const lostCondition = eq(leads.isLost, 1);
    const convertedCondition = eq(leads.isConverted, 1);

    const [totalRows, lostRows, convertedRows] = await Promise.all([
      this.countWithConditions(allScopeAndFilterConditions),
      this.countWithConditions(allScopeAndFilterConditions, [lostCondition]),
      this.countWithConditions(allScopeAndFilterConditions, [convertedCondition]),
    ]);

    const normalizeCount = (rows: Array<{ count: number | bigint | string }>): number => {
      const raw = rows?.[0]?.count ?? 0;
      if (typeof raw === 'bigint') return Number(raw);
      return Number(raw) || 0;
    };

    const total = normalizeCount(totalRows);
    const lost = normalizeCount(lostRows);
    const converted = normalizeCount(convertedRows);
    const active = Math.max(total - lost - converted, 0);

    return {
      total,
      lost,
      converted,
      active,
    };
  }

  static async findById(id: string): Promise<Lead | undefined> {
    const [lead] = await db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        isLost: leads.isLost,
        notes: leads.notes,
        counselorId: leads.counselorId,
        admissionOfficerId: leads.admissionOfficerId,
        eventRegId: leads.eventRegId,
        branchId: leads.branchId,
        regionId: leads.regionId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)
      .where(eq(leads.id, id));
    return lead ? (LeadModel.parseLeadFields(lead as unknown as Lead)) : undefined;
  }

  static async findAll(pagination?: PaginationOptions, filters?: FilterOptions): Promise<PaginatedLeadsResult> {
    const filterConditions = this.buildFilterConditions(filters);
    const whereClause = this.combineConditions(filterConditions);

    let baseQuery = db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        isLost: leads.isLost,
        notes: leads.notes,
        counselorId: leads.counselorId,
        admissionOfficerId: leads.admissionOfficerId,
        eventRegId: leads.eventRegId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads);

    if (whereClause) {
      baseQuery = baseQuery.where(whereClause);
    }

    if (pagination) {
      // Get total count with filters
      const totalQuery = db.select({ count: count() }).from(leads);
      const [totalResult] = await (whereClause ? totalQuery.where(whereClause) : totalQuery);

      // Get paginated results
      const paginatedLeads = await baseQuery
        .orderBy(desc(leads.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return {
        leads: paginatedLeads.map(LeadModel.parseLeadFields),
        total: totalResult.count
      };
    }

    // Return all leads if no pagination
    const allLeads = await baseQuery.orderBy(desc(leads.createdAt));
    return {
      leads: allLeads.map(LeadModel.parseLeadFields),
      total: allLeads.length
    };
  }

  static async findByCounselor(counselorId: string, pagination?: PaginationOptions, filters?: FilterOptions): Promise<PaginatedLeadsResult> {
    const filterConditions = this.buildFilterConditions(filters);
    const allConditions = [eq(leads.counselorId, counselorId), ...filterConditions];
    const whereClause = this.combineConditions(allConditions);

    let baseQuery = db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        isLost: leads.isLost,
        notes: leads.notes,
        counselorId: leads.counselorId,
        admissionOfficerId: leads.admissionOfficerId,
        eventRegId: leads.eventRegId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads);

    if (whereClause) {
      baseQuery = baseQuery.where(whereClause);
    }

    if (pagination) {
      // Get total count with filters
      const totalQuery = db.select({ count: count() }).from(leads);
      const [totalResult] = await (whereClause ? totalQuery.where(whereClause) : totalQuery);

      // Get paginated results
      const paginatedLeads = await baseQuery
        .orderBy(desc(leads.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return {
        leads: paginatedLeads.map(LeadModel.parseLeadFields),
        total: totalResult.count
      };
    }

    // Return all leads if no pagination
    const allLeads = await baseQuery.orderBy(desc(leads.createdAt));
    return {
      leads: allLeads.map(LeadModel.parseLeadFields),
      total: allLeads.length
    };
  }

  static async findByAdmissionOfficer(admissionOfficerId: string, pagination?: PaginationOptions, filters?: FilterOptions): Promise<PaginatedLeadsResult> {
    const filterConditions = this.buildFilterConditions(filters);
    const allConditions = [eq(leads.admissionOfficerId, admissionOfficerId), ...filterConditions];
    const whereClause = this.combineConditions(allConditions);

    let baseQuery = db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        isLost: leads.isLost,
        notes: leads.notes,
        counselorId: leads.counselorId,
        admissionOfficerId: leads.admissionOfficerId,
        eventRegId: leads.eventRegId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads);

    if (whereClause) {
      baseQuery = baseQuery.where(whereClause);
    }

    if (pagination) {
      // Get total count with filters
      const totalQuery = db.select({ count: count() }).from(leads);
      const [totalResult] = await (whereClause ? totalQuery.where(whereClause) : totalQuery);

      // Get paginated results
      const paginatedLeads = await baseQuery
        .orderBy(desc(leads.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return {
        leads: paginatedLeads.map(LeadModel.parseLeadFields),
        total: totalResult.count
      };
    }

    // Return all leads if no pagination
    const allLeads = await baseQuery.orderBy(desc(leads.createdAt));
    return {
      leads: allLeads.map(LeadModel.parseLeadFields),
      total: allLeads.length
    };
  }

  static async findByPartner(partnerId: string, pagination?: PaginationOptions, filters?: FilterOptions): Promise<PaginatedLeadsResult> {
    const filterConditions = this.buildFilterConditions(filters);
    const allConditions = [eq(leads.partner, partnerId), ...filterConditions];
    const whereClause = this.combineConditions(allConditions);

    let baseQuery = db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        isLost: leads.isLost,
        notes: leads.notes,
        counselorId: leads.counselorId,
        admissionOfficerId: leads.admissionOfficerId,
        eventRegId: leads.eventRegId,
        branchId: leads.branchId,
        regionId: leads.regionId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads);

    if (whereClause) {
      baseQuery = baseQuery.where(whereClause);
    }

    if (pagination) {
      // Get total count with filters
      const totalQuery = db.select({ count: count() }).from(leads);
      const [totalResult] = await (whereClause ? totalQuery.where(whereClause) : totalQuery);

      // Get paginated results
      const paginatedLeads = await baseQuery
        .orderBy(desc(leads.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return {
        leads: paginatedLeads.map(LeadModel.parseLeadFields),
        total: totalResult.count
      };
    }

    // Return all leads if no pagination
    const allLeads = await baseQuery.orderBy(desc(leads.createdAt));
    return {
      leads: allLeads.map(LeadModel.parseLeadFields),
      total: allLeads.length
    };
  }

  static async findByRegion(regionId: string, pagination?: PaginationOptions, filters?: FilterOptions): Promise<PaginatedLeadsResult> {
    const filterConditions = this.buildFilterConditions(filters);
    const allConditions = [eq(leads.regionId, regionId), ...filterConditions];
    const whereClause = this.combineConditions(allConditions);

    let baseQuery = db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        isLost: leads.isLost,
        notes: leads.notes,
        counselorId: leads.counselorId,
        admissionOfficerId: leads.admissionOfficerId,
        eventRegId: leads.eventRegId,
        branchId: leads.branchId,
        regionId: leads.regionId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads);

    if (whereClause) {
      baseQuery = baseQuery.where(whereClause);
    }

    if (pagination) {
      // Get total count with filters
      const totalQuery = db.select({ count: count() }).from(leads);
      const [totalResult] = await (whereClause ? totalQuery.where(whereClause) : totalQuery);

      // Get paginated results
      const paginatedLeads = await baseQuery
        .orderBy(desc(leads.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return {
        leads: paginatedLeads.map(LeadModel.parseLeadFields),
        total: totalResult.count
      };
    }

    // Return all leads if no pagination
    const allLeads = await baseQuery.orderBy(desc(leads.createdAt));
    return {
      leads: allLeads.map(LeadModel.parseLeadFields),
      total: allLeads.length
    };
  }

  static async findByBranch(branchId: string, pagination?: PaginationOptions, filters?: FilterOptions): Promise<PaginatedLeadsResult> {
    const filterConditions = this.buildFilterConditions(filters);
    const allConditions = [eq(leads.branchId, branchId), ...filterConditions];
    const whereClause = this.combineConditions(allConditions);

    let baseQuery = db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        isLost: leads.isLost,
        notes: leads.notes,
        counselorId: leads.counselorId,
        admissionOfficerId: leads.admissionOfficerId,
        eventRegId: leads.eventRegId,
        branchId: leads.branchId,
        regionId: leads.regionId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads);

    if (whereClause) {
      baseQuery = baseQuery.where(whereClause);
    }

    if (pagination) {
      // Get total count with filters
      const totalQuery = db.select({ count: count() }).from(leads);
      const [totalResult] = await (whereClause ? totalQuery.where(whereClause) : totalQuery);

      const paginatedLeads = await baseQuery
        .orderBy(desc(leads.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return {
        leads: paginatedLeads.map(LeadModel.parseLeadFields),
        total: totalResult.count
      };
    }

    const allLeads = await baseQuery.orderBy(desc(leads.createdAt));
    return {
      leads: allLeads.map(LeadModel.parseLeadFields),
      total: allLeads.length
    };
  }

  static async create(leadData: InsertLead): Promise<Lead> {
    // Generate UUID for the lead
    const leadId = uuidv4();

    // Serialize array fields to JSON strings for database storage
    const processedLead = { ...leadData, id: leadId } as any;
    if (Array.isArray((leadData as any).country)) {
      processedLead.country = JSON.stringify((leadData as any).country);
    }
    if (Array.isArray((leadData as any).program)) {
      processedLead.program = JSON.stringify((leadData as any).program);
    }

    // Ensure audit fields are set
    if (!processedLead.createdBy) {
      processedLead.createdBy = processedLead.counselorId ?? null;
    }
    if (!processedLead.updatedBy) {
      processedLead.updatedBy = processedLead.createdBy ?? processedLead.counselorId ?? null;
    }

    console.log("[LeadModel.create] Inserting lead:", JSON.stringify({ id: processedLead.id, createdBy: processedLead.createdBy, updatedBy: processedLead.updatedBy, counselorId: processedLead.counselorId }, null, 2));

    await db
      .insert(leads)
      .values(processedLead as InsertLead & { id: string });

    const createdLead = await LeadModel.findById(leadId);

    if (!createdLead) {
      throw new Error(`Failed to create lead - record not found after insert with ID: ${leadId}`);
    }

    return createdLead;
  }

  static async update(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    // Serialize array fields to JSON strings for database storage
    const processedUpdates = { ...updates } as any;
    if (Array.isArray((updates as any).country)) {
      processedUpdates.country = JSON.stringify((updates as any).country);
    }
    if (Array.isArray((updates as any).program)) {
      processedUpdates.program = JSON.stringify((updates as any).program);
    }

    const result = await db
      .update(leads)
      .set({ ...processedUpdates, updatedAt: new Date() } as any)
      .where(eq(leads.id, id));

    // Check if the update was successful
    if (result.rowsAffected === 0) {
      return undefined;
    }

    // Fetch the updated record
    return await LeadModel.findById(id);
  }

  static async assignToCounselor(leadId: string, counselorId: string): Promise<boolean> {
    const result = await db
      .update(leads)
      .set({ counselorId, updatedAt: new Date() })
      .where(eq(leads.id, leadId));
    return result.rowsAffected > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    const affected = (result as any)?.affectedRows ?? (result as any)?.rowCount ?? 0;
    return affected > 0;
  }
}
