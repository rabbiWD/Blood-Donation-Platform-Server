import type { BloodGroup, RequestStatus, UrgencyLevel } from "../../../generated/prisma/client";

export interface ICreateBloodRequestPayload {
	patientName: string;
	bloodGroup: BloodGroup;
	unitsNeeded?: number;
	hospitalName: string;
	hospitalAddress: string;
	city: string;
	district: string;
	urgency?: UrgencyLevel;
	neededBy: string;
	additionalNotes?: string;
}

export interface IUpdateBloodRequestPayload {
	patientName?: string;
	bloodGroup?: BloodGroup;
	unitsNeeded?: number;
	hospitalName?: string;
	hospitalAddress?: string;
	city?: string;
	district?: string;
	urgency?: UrgencyLevel;
	status?: RequestStatus;
	neededBy?: string;
	additionalNotes?: string;
	isVerified?: boolean;
}

export interface IBloodRequestQuery {
	page?: string;
	limit?: string;
	bloodGroup?: BloodGroup;
	urgency?: UrgencyLevel;
	status?: RequestStatus;
	city?: string;
	district?: string;
	search?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}
