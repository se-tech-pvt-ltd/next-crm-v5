import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

import { UserResetTokenModel, type UserResetTokenRecord } from "../models/UserResetToken.js";

const RESET_TOKEN_BYTE_LENGTH = 32;
const BCRYPT_ROUNDS = 12;
const EXPIRY_INTERVAL_MS = 60 * 60 * 1000;

export type IssueResetTokenResult = {
  token: string;
  record: UserResetTokenRecord;
};

export class UserResetTokenService {
  static async issueTokenForUser(userId: string): Promise<IssueResetTokenResult> {
    await UserResetTokenModel.invalidateTokensForUser(userId);

    const plainToken = randomBytes(RESET_TOKEN_BYTE_LENGTH).toString("hex");
    const hashedToken = await bcrypt.hash(plainToken, BCRYPT_ROUNDS);
    const expiry = new Date(Date.now() + EXPIRY_INTERVAL_MS);

    const record = await UserResetTokenModel.create({
      userId,
      hashedToken,
      expiry,
      isUsed: false,
    });

    return {
      token: plainToken,
      record,
    };
  }
}
