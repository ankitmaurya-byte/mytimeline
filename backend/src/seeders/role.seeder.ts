import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database.config";
import RoleModel from "../models/roles-permission.model";
import { RolePermissions } from "../utils/role-permission";

const seedRoles = async () => {
  console.log("Seeding roles started...");

  let session: mongoose.ClientSession | null = null;

  try {
    // 1. Connect DB
    await connectDatabase();

    // 2. Start session
    session = await mongoose.startSession();
    session.startTransaction();

    // 3. Upsert roles (no deleteMany)
    for (const roleName in RolePermissions) {
      const role = roleName as keyof typeof RolePermissions;
      const permissions = RolePermissions[role];

      await RoleModel.updateOne(
        { name: role },
        {
          $set: {
            name: role,
            permissions: permissions,
          },
        },
        {
          upsert: true,   // create if not exists
          session,
        }
      );

      console.log(`Role ${role} upserted.`);
    }

    // 4. Commit transaction
    await session.commitTransaction();
    console.log("Transaction committed.");
  } catch (error) {
    console.error("Error during seeding:", error);

    // 5. Rollback if error
    if (session) {
      await session.abortTransaction();
      console.log("Transaction aborted.");
    }
  } finally {
    // 6. End session
    if (session) {
      session.endSession();
      console.log("Session ended.");
    }

    console.log("Seeding completed.");
    process.exit(0);
  }
};

// Run script
seedRoles().catch((error) => {
  console.error("Fatal error running seed script:", error);
  process.exit(1);
});