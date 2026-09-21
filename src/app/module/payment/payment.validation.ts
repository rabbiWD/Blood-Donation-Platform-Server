import { z } from "zod";

const gatewayEnum = z.enum(["STRIPE", "BKASH", "SSLCOMMERZ"]);

const InitiatePaymentZodSchema = z.object({
	requestId: z.string().optional(),
	amount: z
		.number({ message: "Amount is required" })
		.positive("Amount must be greater than 0"),
	currency: z.string().optional().default("BDT"),
	gateway: gatewayEnum.optional().default("BKASH"),
	payerReference: z.string().optional(),
});

const BkashCallbackZodSchema = z.object({
	paymentID: z.string({ message: "paymentID is required" }),
	status: z.string({ message: "status is required" }),
	apiVersion: z.string().optional(),
});

const WebhookPaymentZodSchema = z.object({
	transactionId: z.string({ message: "Transaction ID is required" }),
	status: z.enum(["PAID", "FAILED"]),
	paymentIntentId: z.string().optional(),
});

export const PaymentValidation = {
	InitiatePaymentZodSchema,
	BkashCallbackZodSchema,
	WebhookPaymentZodSchema,
};
