import type { BloodGroup } from "../../../generated/prisma/client";

export interface IUpdateUserProfilePayload {
	name?: string;
	contactNumber?: string;
	address?: string;
	hospitalName?: string;
}

export interface IUpdateDonorProfilePayload {
	bloodGroup?: BloodGroup;
	contactNumber?: string;
	address?: string;
	city?: string;
	district?: string;
	isAvailable?: boolean;
	lastDonationDate?: string;
}

export interface IDonorSearchQuery {
	page?: string;
	limit?: string;
	bloodGroup?: BloodGroup;
	city?: string;
	district?: string;
	isAvailable?: string;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}
