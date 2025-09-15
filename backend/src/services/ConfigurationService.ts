import { ConfigurationModel, type ConfigurationRecord } from "../models/Configuration.js";

export class ConfigurationService {
  static async getConfig(name: string): Promise<any> {
    const rec = await ConfigurationModel.findByName(name);
    return rec?.data ?? null;
  }

  static async setConfig(name: string, data: any, userId: string): Promise<ConfigurationRecord> {
    return await ConfigurationModel.upsert(name, data, userId);
  }
}
