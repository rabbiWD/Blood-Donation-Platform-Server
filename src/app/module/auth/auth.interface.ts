import type { BloodGroup, Role } from "../../../generated/prisma/client";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IRegisterUserPayload {
	name: string;
	email: string;
	password: string;
	role?: Role; // DONOR or PATIENT
	donor?: {
		bloodGroup: BloodGroup;
		contactNumber: string;
		address: string;
		city: string;
		district: string;
		isAvailable?: boolean;
		lastDonationDate?: string;
	};
	patient?: {
		contactNumber?: string;
		address?: string;
		hospitalName?: string;
	};
}

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

export interface IGoogleLoginPayload {
	idToken: string;
	role?: Role;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	newPassword: string;
	otp: string;
}
