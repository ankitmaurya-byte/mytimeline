import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import RoleModel from '../../../../src/models/roles-permission.model';
import { RolePermissions } from '../../../../src/utils/role-permission';
import mongoose from 'mongoose';

export const OPTIONS = () => new Response(null, { status: 204 });

export const GET = async () => {
    try {
        await ensureDb();

        const roles = await RoleModel.find({});
        return new Response(JSON.stringify({
            message: 'Roles retrieved successfully',
            roles: roles,
            expectedRoles: Object.keys(RolePermissions)
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Error retrieving roles:", error);
        return new Response(JSON.stringify({
            message: 'Error retrieving roles',
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const POST = async (req: NextRequest) => {
    try {
        await ensureDb();

        console.log("Seeding roles started...");

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log("Clearing existing roles...");
            await RoleModel.deleteMany({}, { session });

            for (const roleName in RolePermissions) {
                const role = roleName as keyof typeof RolePermissions;
                const permissions = RolePermissions[role];

                console.log(`Creating role: ${role} with permissions:`, permissions);

                const newRole = new RoleModel({
                    name: role,
                    permissions: permissions,
                });

                await newRole.save({ session });
                console.log(`Role ${role} created successfully`);
            }

            await session.commitTransaction();
            console.log("All roles seeded successfully!");

            // Fetch and return the created roles
            const allRoles = await RoleModel.find({});
            return new Response(JSON.stringify({
                message: 'Roles seeded successfully',
                roles: allRoles
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error: any) {
        console.error("Error seeding roles:", error);
        return new Response(JSON.stringify({
            message: 'Error seeding roles',
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
