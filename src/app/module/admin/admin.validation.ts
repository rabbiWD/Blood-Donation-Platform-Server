import { z } from "zod";

const UpdateUserStatusZodSchema = z.object({
	status: z.enum(["ACTIVE", "BLOCKED", "DELETED"]),
});

const UpdateUserRoleZodSchema = z.object({
	role: z.enum(["SUPER_ADMIN", "ADMIN", "DONOR", "PATIENT"]),
});

export const AdminValidation = {
	UpdateUserStatusZodSchema,
	UpdateUserRoleZodSchema,
};
