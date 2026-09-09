import { z } from "zod";

const gatewayEnum = z.enum(["STRIPE", "BKASH", "SSLCOMMERZ"]);

const InitiatePaymentZodSchema = z.object({
	requestId: z.string().optional(),
	amount: z.number({ message: "Amount is required" }).positive("Amount must be greater than 0"),
	currency: z.string().optional().default("USD"),
	gateway: gatewayEnum.optional().default("STRIPE"),
});

const WebhookPaymentZodSchema = z.object({
	transactionId: z.string({ message: "Transaction ID is required" }),
	status: z.enum(["PAID", "FAILED"]),
	paymentIntentId: z.string().optional(),
});

export const PaymentValidation = {
	InitiatePaymentZodSchema,
	WebhookPaymentZodSchema,
};
