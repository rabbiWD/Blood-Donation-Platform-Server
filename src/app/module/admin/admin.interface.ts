import type { Role, UserStatus } from "../../../generated/prisma/client";

export interface IAdminUserQuery {
	page?: string;
	limit?: string;
	role?: Role;
	status?: UserStatus;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IUpdateUserStatusPayload {
	status: UserStatus;
}

export interface IUpdateUserRolePayload {
	role: Role;
}
