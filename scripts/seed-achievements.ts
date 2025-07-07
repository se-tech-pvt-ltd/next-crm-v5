import { db } from "../server/db";
import { achievements } from "../shared/schema";

async function seedAchievements() {
  console.log("Seeding achievements...");

  const achievementsData = [
    // Lead achievements
    {
      name: "First Contact",
      description: "Create your first lead",
      category: "leads",
      requirement: 1,
      requirementType: "count",
      points: 10,
      icon: "🎯",
      isActive: true
    },
    {
      name: "Lead Generator",
      description: "Create 10 leads",
      category: "leads",
      requirement: 10,
      requirementType: "count",
      points: 50,
      icon: "🚀",
      isActive: true
    },
    {
      name: "Lead Master",
      description: "Create 50 leads",
      category: "leads",
      requirement: 50,
      requirementType: "count",
      points: 200,
      icon: "👑",
      isActive: true
    },
    
    // Student achievements
    {
      name: "Student Converter",
      description: "Convert your first lead to student",
      category: "students",
      requirement: 1,
      requirementType: "count",
      points: 25,
      icon: "🎓",
      isActive: true
    },
    {
      name: "Enrollment Expert",
      description: "Convert 10 leads to students",
      category: "students",
      requirement: 10,
      requirementType: "count",
      points: 100,
      icon: "📚",
      isActive: true
    },
    {
      name: "Conversion Champion",
      description: "Convert 25 leads to students",
      category: "students",
      requirement: 25,
      requirementType: "count",
      points: 250,
      icon: "🏆",
      isActive: true
    },
    
    // Application achievements
    {
      name: "Application Assistant",
      description: "Help submit your first application",
      category: "applications",
      requirement: 1,
      requirementType: "count",
      points: 15,
      icon: "📝",
      isActive: true
    },
    {
      name: "Application Pro",
      description: "Help submit 15 applications",
      category: "applications",
      requirement: 15,
      requirementType: "count",
      points: 75,
      icon: "💼",
      isActive: true
    },
    {
      name: "Application Guru",
      description: "Help submit 50 applications",
      category: "applications",
      requirement: 50,
      requirementType: "count",
      points: 300,
      icon: "🎖️",
      isActive: true
    },
    
    // Admission achievements
    {
      name: "First Success",
      description: "Get your first admission",
      category: "admissions",
      requirement: 1,
      requirementType: "count",
      points: 30,
      icon: "✅",
      isActive: true
    },
    {
      name: "Admission Specialist",
      description: "Get 10 admissions",
      category: "admissions",
      requirement: 10,
      requirementType: "count",
      points: 150,
      icon: "🌟",
      isActive: true
    },
    {
      name: "Admission Legend",
      description: "Get 30 admissions",
      category: "admissions",
      requirement: 30,
      requirementType: "count",
      points: 500,
      icon: "💎",
      isActive: true
    },
    
    // Streak achievements
    {
      name: "Consistency Champion",
      description: "Maintain a 7-day activity streak",
      category: "streak",
      requirement: 7,
      requirementType: "streak",
      points: 50,
      icon: "🔥",
      isActive: true
    },
    {
      name: "Dedication Master",
      description: "Maintain a 30-day activity streak",
      category: "streak",
      requirement: 30,
      requirementType: "streak",
      points: 200,
      icon: "⚡",
      isActive: true
    },
    
    // Points achievements
    {
      name: "Point Collector",
      description: "Earn 100 total points",
      category: "points",
      requirement: 100,
      requirementType: "total",
      points: 25,
      icon: "💰",
      isActive: true
    },
    {
      name: "Point Master",
      description: "Earn 500 total points",
      category: "points",
      requirement: 500,
      requirementType: "total",
      points: 100,
      icon: "💎",
      isActive: true
    },
    {
      name: "Point Legend",
      description: "Earn 1000 total points",
      category: "points",
      requirement: 1000,
      requirementType: "total",
      points: 200,
      icon: "👑",
      isActive: true
    }
  ];

  try {
    console.log(`About to seed ${achievementsData.length} achievements...`);
    
    // Clear existing achievements
    console.log("Clearing existing achievements...");
    await db.delete(achievements);
    
    // Insert new achievements
    console.log("Inserting new achievements...");
    const result = await db.insert(achievements).values(achievementsData).returning();
    
    console.log(`✅ Successfully seeded ${result.length} achievements`);
    console.log("Sample achievement:", result[0]);
  } catch (error) {
    console.error("❌ Error seeding achievements:", error);
    throw error;
  }
}

// Run the seeding function
if (import.meta.main) {
  seedAchievements()
    .then(() => {
      console.log("Achievement seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Achievement seeding failed:", error);
      process.exit(1);
    });
}

export { seedAchievements };