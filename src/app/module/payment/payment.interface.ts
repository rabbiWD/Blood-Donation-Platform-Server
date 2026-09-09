import type { PaymentGateway } from "../../../generated/prisma/client";

export interface IInitiatePaymentPayload {
	requestId?: string;
	amount: number;
	currency?: string;
	gateway?: PaymentGateway;
}

export interface IPaymentWebhookPayload {
	transactionId: string;
	status: "PAID" | "FAILED";
	paymentIntentId?: string;
}
