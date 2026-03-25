import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name is required" })
  .max(255);

export const descriptionSchema = z.string().trim().optional();

export const workspaceIdSchema = z
  .string()
  .trim()
  .min(1, { message: "Workspace ID is required" })
  .refine((val) => val !== "undefined" && val !== "null", {
    message: "Workspace ID cannot be undefined or null"
  })
  .refine((val) => {
    // Check if it's a valid MongoDB ObjectId format (24 hex characters)
    return /^[0-9a-fA-F]{24}$/.test(val);
  }, {
    message: "Workspace ID must be a valid MongoDB ObjectId"
  });

export const changeRoleSchema = z.object({
  roleId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
});

export const createWorkspaceSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export const updateWorkspaceSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});
