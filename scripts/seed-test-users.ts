import { db } from "../backend/src/config/database.js";
import { users } from "../shared/schema.js";
import * as bcrypt from "bcryptjs";

async function seedUsers() {
  try {
    console.log("🌱 Seeding test users...");

    // Hash passwords for test users
    const adminPassword = await bcrypt.hash("admin123", 12);
    const counselorPassword = await bcrypt.hash("counselor123", 12);
    const managerPassword = await bcrypt.hash("manager123", 12);

    // Test users data
    const testUsers = [
      {
        id: "admin1",
        email: "admin@studybridge.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin_staff",
        department: "Administration",
        phoneNumber: "+1234567890",
        passwordHash: adminPassword,
      },
      {
        id: "counselor1", 
        email: "counselor@studybridge.com",
        firstName: "John",
        lastName: "Counselor",
        role: "counselor",
        branchId: "branch1",
        department: "Counseling",
        phoneNumber: "+1234567891",
        passwordHash: counselorPassword,
      },
      {
        id: "manager1",
        email: "manager@studybridge.com", 
        firstName: "Sarah",
        lastName: "Manager",
        role: "branch_manager",
        branchId: "branch1",
        department: "Management",
        phoneNumber: "+1234567892",
        passwordHash: managerPassword,
      }
    ];

    // Insert users into database
    for (const user of testUsers) {
      try {
        await db.insert(users).values(user);
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  User ${user.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating user ${user.email}:`, error);
        }
      }
    }

    console.log("\n🎉 User seeding completed!");
    console.log("\n📋 Test Login Credentials:");
    console.log("========================================");
    console.log("👨‍💼 Admin User:");
    console.log("   Email: admin@studybridge.com");
    console.log("   Password: admin123");
    console.log("");
    console.log("👩‍💼 Counselor User:");
    console.log("   Email: counselor@studybridge.com");
    console.log("   Password: counselor123");
    console.log("");
    console.log("👨‍💼 Branch Manager:");
    console.log("   Email: manager@studybridge.com");
    console.log("   Password: manager123");
    console.log("========================================");

  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedUsers();
