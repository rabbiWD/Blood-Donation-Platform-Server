import { z } from "zod";

const bloodGroupEnum = z.enum([
	"A_POSITIVE",
	"A_NEGATIVE",
	"B_POSITIVE",
	"B_NEGATIVE",
	"AB_POSITIVE",
	"AB_NEGATIVE",
	"O_POSITIVE",
	"O_NEGATIVE",
]);

const UpdateUserProfileZodSchema = z.object({
	name: z.string().optional(),
	contactNumber: z.string().optional(),
	address: z.string().optional(),
	hospitalName: z.string().optional(),
});

const UpdateDonorProfileZodSchema = z.object({
	bloodGroup: bloodGroupEnum.optional(),
	contactNumber: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	district: z.string().optional(),
	isAvailable: z.boolean().optional(),
	lastDonationDate: z.string().optional(),
});

export const UserValidation = {
	UpdateUserProfileZodSchema,
	UpdateDonorProfileZodSchema,
};
