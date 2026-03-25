import mongoose from "mongoose";
import RoleModel from "../models/roles-permission.model";
import { RolePermissions } from "../utils/role-permission";

/**
 * Initialize roles in the database
 * This function will check for existing roles and create any that are missing
 * It won't delete existing roles to avoid data loss
 */
export const initializeRoles = async (): Promise<void> => {
    if (process.env.NODE_ENV !== 'production') {
        console.log("Initializing roles...");
    }

    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        for (const roleName in RolePermissions) {
            const role = roleName as keyof typeof RolePermissions;
            const permissions = RolePermissions[role];

            // Check if the role already exists
            const existingRole = await RoleModel.findOne({ name: role }).session(session);

            if (!existingRole) {
                const newRole = new RoleModel({
                    name: role,
                    permissions: permissions,
                });
                await newRole.save({ session });
                console.log(`Role ${role} added with permissions.`);
            } else {
                console.log(`Role ${role} already exists.`);
            }
        }

        await session.commitTransaction();
        if (process.env.NODE_ENV !== 'production') {
            console.log("Roles initialization transaction committed.");
        }
        session.endSession();

        console.log("Roles initialized successfully.");
    } catch (error) {
        console.error("Error during roles initialization:", error);
    }
};

/**
 * Fix any member roles that might be disconnected
 * This function will try to reconnect member roles that have valid ObjectIds but don't link to actual roles
 */
export const fixMemberRoles = async (): Promise<void> => {
    try {
        console.log("Checking for member role issues...");

        const MemberModel = mongoose.model("Member");

        // Find members with role IDs that don't match any role
        const membersWithIssues = await MemberModel.find().populate('role');

        let fixedCount = 0;

        for (const member of membersWithIssues) {
            if (!member.role) {
                // Find the appropriate role (default to MEMBER)
                const memberRole = await RoleModel.findOne({ name: 'MEMBER' });

                if (memberRole) {
                    // Update the member with the correct role
                    await MemberModel.updateOne(
                        { _id: member._id },
                        { $set: { role: memberRole._id } }
                    );
                    fixedCount++;
                }
            }
        }

        console.log(`Fixed ${fixedCount} member role references`);
    } catch (error) {
        console.error("Error fixing member roles:", error);
    }
};
