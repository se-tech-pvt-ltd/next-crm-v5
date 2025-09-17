import { BranchEmpModel } from "../models/UserLink.js";

export class BranchEmpService {
  static async listAll() {
    return await BranchEmpModel.findAll();
  }

  static async getById(id: string) {
    return await BranchEmpModel.findById(id);
  }

  static async listByBranch(branchId: string) {
    return await BranchEmpModel.findByBranch(branchId);
  }

  static async listByUser(userId: string) {
    return await BranchEmpModel.findByUser(userId);
  }

  static async create(data: any) {
    if (!data || !data.branchId || !data.userId) throw new Error('branchId and userId are required');
    await BranchEmpModel.create(data);
    return data;
  }

  static async delete(id: string) {
    // Simple delete using raw query - BranchEmpModel does not have delete implemented
    return await (await import('../config/database.js')).db.delete((await import('../shared/schema.js')).branchEmps).where((await import('drizzle-orm')).eq((await import('../shared/schema.js')).branchEmps.id, id));
  }
}
