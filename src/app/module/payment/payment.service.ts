import crypto from "crypto";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import type { IInitiatePaymentPayload, IPaymentWebhookPayload } from "./payment.interface";

const initiatePayment = async (userId: string, payload: IInitiatePaymentPayload) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user || user.isDeleted) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not found");
	}

	if (payload.requestId) {
		const request = await prisma.bloodRequest.findUnique({
			where: { id: payload.requestId },
		});
		if (!request || request.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Associated blood request not found");
		}
	}

	const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

	const payment = await prisma.payment.create({
		data: {
			userId,
			requestId: payload.requestId || null,
			amount: payload.amount,
			currency: payload.currency || "USD",
			gateway: payload.gateway || "STRIPE",
			transactionId,
			status: "PENDING",
			paymentIntentId: `pi_${crypto.randomBytes(12).toString("hex")}`,
		},
	});

	// Return checkout session payload
	const checkoutUrl = `https://checkout.stripe.com/pay/${payment.paymentIntentId}?txn=${transactionId}`;

	return {
		payment,
		checkoutUrl,
		clientSecret: `${payment.paymentIntentId}_secret_${crypto.randomBytes(6).toString("hex")}`,
	};
};

const handleWebhook = async (payload: IPaymentWebhookPayload) => {
	const payment = await prisma.payment.findUnique({
		where: { transactionId: payload.transactionId },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment transaction record not found");
	}

	if (payment.status === "PAID") {
		return { message: "Payment already processed (Idempotent call)", payment };
	}

	const updatedPayment = await prisma.payment.update({
		where: { transactionId: payload.transactionId },
		data: {
			status: payload.status,
			paymentIntentId: payload.paymentIntentId || payment.paymentIntentId,
		},
	});

	// Create Audit Log for completed payment
	await prisma.auditLog.create({
		data: {
			userId: payment.userId,
			action: "PAYMENT_PROCESSED",
			details: `Payment transaction ${payment.transactionId} updated to status ${payload.status} (Amount: $${payment.amount}).`,
		},
	});

	return updatedPayment;
};

const getPaymentHistory = async (userId: string, userRole: string) => {
	if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
		return await prisma.payment.findMany({
			include: {
				user: { select: { id: true, name: true, email: true } },
				bloodRequest: { select: { id: true, patientName: true, bloodGroup: true } },
			},
			orderBy: { createdAt: "desc" },
		});
	}

	return await prisma.payment.findMany({
		where: { userId },
		include: {
			bloodRequest: { select: { id: true, patientName: true, bloodGroup: true } },
		},
		orderBy: { createdAt: "desc" },
	});
};

const getPaymentById = async (id: string, userId: string, userRole: string) => {
	const payment = await prisma.payment.findUnique({
		where: { id },
		include: {
			user: { select: { id: true, name: true, email: true } },
			bloodRequest: true,
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
	}

	if (payment.userId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
		throw new AppError(httpStatus.FORBIDDEN, "Not authorized to view this payment record");
	}

	return payment;
};

export const PaymentService = {
	initiatePayment,
	handleWebhook,
	getPaymentHistory,
	getPaymentById,
};
