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

const RegisterUserZodSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(2, "Name must be at least 2 characters long"),
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
  role: z.enum(["DONOR", "PATIENT"]).optional().default("PATIENT"),
  donor: z
    .object({
      bloodGroup: bloodGroupEnum,
      contactNumber: z.string({ message: "Contact number is required" }),
      address: z.string({ message: "Address is required" }),
      city: z.string({ message: "City is required" }),
      district: z.string({ message: "District is required" }),
      isAvailable: z.boolean().optional().default(true),
      lastDonationDate: z.string().optional(),
    })
    .optional(),
  patient: z
    .object({
      contactNumber: z.string().optional(),
      address: z.string().optional(),
      hospitalName: z.string().optional(),
    })
    .optional(),
});

const VerifyEmailZodSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
  otp: z
    .string({ message: "OTP is required" })
    .length(6, "OTP must be 6 digits"),
});

const LoginZodSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

const GoogleLoginZodSchema = z.object({
  idToken: z.string({ message: "Google ID Token is required" }),
  role: z.enum(["DONOR", "PATIENT"]).optional(),
});

const ForgotPasswordZodSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
});

const ResetPasswordZodSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
  otp: z
    .string({ message: "OTP is required" })
    .length(6, "OTP must be 6 digits"),
});

export const UserValidation = {
  RegisterUserZodSchema,
  VerifyEmailZodSchema,
  LoginZodSchema,
  GoogleLoginZodSchema,
  ForgotPasswordZodSchema,
  ResetPasswordZodSchema,
};
