import { readFileSync } from "fs";
import { join } from "path";
import query from "./client";

/**
 * Seed database with sample data
 * Inserts demo products and other test data
 */
async function seed() {
  try {
    console.log("Seeding database with sample data...");

    // Read and execute seed file
    const seedPath = join(__dirname, "seeds", "001_sample_data.sql");
    const seedSQL = readFileSync(seedPath, "utf-8");

    await query(seedSQL);
    console.log("✅ Seeding completed successfully");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    // Don't exit on seed errors (data might already exist)
    console.log("Continuing anyway...");
  }
}

// Run seeds if called directly
if (require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seed;
