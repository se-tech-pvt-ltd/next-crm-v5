import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

async function updateUserPasswords() {
  try {
    console.log("Updating user passwords...");

    // Update admin password
    const adminHash = await bcrypt.hash("admin123", 12);
    await db.update(users)
      .set({ passwordHash: adminHash })
      .where(eq(users.id, "admin1"));

    // Update manager password
    const managerHash = await bcrypt.hash("manager123", 12);
    await db.update(users)
      .set({ passwordHash: managerHash })
      .where(eq(users.id, "manager1"));

    // Update counselor password
    const counselorHash = await bcrypt.hash("counselor123", 12);
    await db.update(users)
      .set({ passwordHash: counselorHash })
      .where(eq(users.id, "counselor1"));

    console.log("User passwords updated successfully!");
  } catch (error) {
    console.error("Error updating passwords:", error);
  }
}

updateUserPasswords();