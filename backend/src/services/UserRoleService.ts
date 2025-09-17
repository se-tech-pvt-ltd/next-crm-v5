import { UserRoleModel } from "../models/UserRole.js";
import { UserDepartmentModel } from "../models/UserDepartment.js";

export class UserRoleService {
  static async listDepartments() {
    return await UserDepartmentModel.findAll();
  }

  static async listRoles(departmentId?: string) {
    if (departmentId) return await UserRoleModel.findByDepartmentId(departmentId);
    return await UserRoleModel.findAll();
  }
}
