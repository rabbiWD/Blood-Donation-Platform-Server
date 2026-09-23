// import type { PaymentGateway } from "@prisma/client";

import { PaymentGateway } from "../../../generated/prisma/enums";

export interface IInitiatePaymentPayload {
	requestId?: string;
	amount: number;
	currency?: string;
	gateway?: PaymentGateway;
	payerReference?: string;
}

export interface IBkashCallbackQuery {
	paymentID: string;
	status: "success" | "failure" | "cancel" | string;
	apiVersion?: string;
}

export interface IPaymentWebhookPayload {
	transactionId: string;
	status: "PAID" | "FAILED";
	paymentIntentId?: string;
}
