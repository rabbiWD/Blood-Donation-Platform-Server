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

const urgencyEnum = z.enum(["CRITICAL", "HIGH", "STANDARD"]);
const statusEnum = z.enum(["PENDING", "VERIFIED", "MATCHED", "FULFILLED", "CANCELLED", "EXPIRED"]);

const CreateBloodRequestZodSchema = z.object({
	patientName: z.string({ message: "Patient name is required" }),
	bloodGroup: bloodGroupEnum,
	unitsNeeded: z.number().int().positive().optional().default(1),
	hospitalName: z.string({ message: "Hospital name is required" }),
	hospitalAddress: z.string({ message: "Hospital address is required" }),
	city: z.string({ message: "City is required" }),
	district: z.string({ message: "District is required" }),
	urgency: urgencyEnum.optional().default("STANDARD"),
	neededBy: z.string({ message: "Needed date/time is required" }),
	additionalNotes: z.string().optional(),
});

const UpdateBloodRequestZodSchema = z.object({
	patientName: z.string().optional(),
	bloodGroup: bloodGroupEnum.optional(),
	unitsNeeded: z.number().int().positive().optional(),
	hospitalName: z.string().optional(),
	hospitalAddress: z.string().optional(),
	city: z.string().optional(),
	district: z.string().optional(),
	urgency: urgencyEnum.optional(),
	status: statusEnum.optional(),
	neededBy: z.string().optional(),
	additionalNotes: z.string().optional(),
	isVerified: z.boolean().optional(),
});

export const BloodRequestValidation = {
	CreateBloodRequestZodSchema,
	UpdateBloodRequestZodSchema,
};
