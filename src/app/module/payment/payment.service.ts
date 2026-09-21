import crypto from "node:crypto";
import httpStatus from "http-status";
import config from "../../config/index.js";
import { AppError } from "../../errors/AppError.js";
import { BkashClient } from "../../lib/bkash.js";
import { prisma } from "../../lib/prisma.js";
import type {
	IBkashCallbackQuery,
	IInitiatePaymentPayload,
	IPaymentWebhookPayload,
} from "./payment.interface.js";

const initiatePayment = async (
	userId: string,
	payload: IInitiatePaymentPayload,
) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user || user.isDeleted) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User account not found");
	}

	if (payload.requestId) {
		const request = await prisma.bloodRequest.findUnique({
			where: { id: payload.requestId },
		});
		if (!request || request.isDeleted) {
			throw new AppError(
				httpStatus.NOT_FOUND,
				"Associated blood request not found",
			);
		}
	}

	const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
	const gateway = payload.gateway || "BKASH";
	const currency = payload.currency || (gateway === "BKASH" ? "BDT" : "USD");

	// If gateway is bKash, interact with official bKash Merchant API
	if (gateway === "BKASH") {
		const bkashResponse = await BkashClient.createPayment({
			amount: payload.amount,
			payerReference:
				payload.payerReference || user.name || "BloodDonationDonor",
			merchantInvoiceNumber: transactionId,
			callbackURL: config.bkash_callback_url,
		});

		const payment = await prisma.payment.create({
			data: {
				userId,
				requestId: payload.requestId || null,
				amount: payload.amount,
				currency,
				gateway: "BKASH",
				transactionId,
				status: "PENDING",
				paymentIntentId: bkashResponse.paymentID,
			},
		});

		return {
			payment,
			gateway: "BKASH",
			paymentID: bkashResponse.paymentID,
			bkashURL: bkashResponse.bkashURL,
			callbackURL: bkashResponse.callbackURL,
		};
	}

	// Fallback/Legacy Stripe payment record
	const payment = await prisma.payment.create({
		data: {
			userId,
			requestId: payload.requestId || null,
			amount: payload.amount,
			currency,
			gateway,
			transactionId,
			status: "PENDING",
			paymentIntentId: `pi_${crypto.randomBytes(12).toString("hex")}`,
		},
	});

	const checkoutUrl = `https://checkout.stripe.com/pay/${payment.paymentIntentId}?txn=${transactionId}`;

	return {
		payment,
		gateway: "STRIPE",
		checkoutUrl,
		clientSecret: `${payment.paymentIntentId}_secret_${crypto.randomBytes(6).toString("hex")}`,
	};
};

const handleBkashCallback = async (query: IBkashCallbackQuery) => {
	const { paymentID, status } = query;

	const payment = await prisma.payment.findFirst({
		where: { paymentIntentId: paymentID },
	});

	const baseBackendUrl = config.backend_url || "http://localhost:5000";

	if (!payment) {
		const redirectUrl = `${baseBackendUrl}/api/v1/payments/failed?message=Transaction+record+not+found`;
		return { redirectUrl };
	}

	// Case 1: User cancelled payment on bKash screen
	if (status === "cancel") {
		await prisma.payment.update({
			where: { id: payment.id },
			data: { status: "FAILED" },
		});
		return {
			redirectUrl: `${baseBackendUrl}/api/v1/payments/cancel?paymentID=${paymentID}`,
		};
	}

	// Case 2: bKash reported failure
	if (status === "failure") {
		await prisma.payment.update({
			where: { id: payment.id },
			data: { status: "FAILED" },
		});
		return {
			redirectUrl: `${baseBackendUrl}/api/v1/payments/failed?paymentID=${paymentID}`,
		};
	}

	// Case 3: bKash reports success -> Execute Payment API call
	if (status === "success") {
		// If already paid, return success idempotently
		if (payment.status === "PAID") {
			return {
				redirectUrl: `${baseBackendUrl}/api/v1/payments/success?paymentID=${paymentID}&trxID=${payment.transactionId}`,
			};
		}

		const executeResult = await BkashClient.executePayment(paymentID);

		if (
			executeResult.statusCode === "0000" &&
			executeResult.transactionStatus === "Completed"
		) {
			const finalTrxId = executeResult.trxID || payment.transactionId;

			await prisma.payment.update({
				where: { id: payment.id },
				data: {
					status: "PAID",
					transactionId: finalTrxId,
				},
			});

			await prisma.auditLog.create({
				data: {
					userId: payment.userId,
					action: "PAYMENT_PROCESSED",
					details: `bKash Payment Completed. PaymentID: ${paymentID}, TrxID: ${finalTrxId}, Amount: BDT ${payment.amount}`,
				},
			});

			return {
				redirectUrl: `${baseBackendUrl}/api/v1/payments/success?paymentID=${paymentID}&trxID=${finalTrxId}`,
			};
		}

		// Execution failed at bKash end
		await prisma.payment.update({
			where: { id: payment.id },
			data: { status: "FAILED" },
		});

		const errorMsg = encodeURIComponent(
			executeResult.statusMessage || "Payment execution failed",
		);
		return {
			redirectUrl: `${baseBackendUrl}/api/v1/payments/failed?paymentID=${paymentID}&message=${errorMsg}`,
		};
	}

	// Fallback for unknown statuses
	return {
		redirectUrl: `${baseBackendUrl}/api/v1/payments/failed?paymentID=${paymentID}&message=Unknown+status`,
	};
};

const queryBkashPayment = async (paymentID: string) => {
	const queryResult = await BkashClient.queryPayment(paymentID);

	if (queryResult.transactionStatus === "Completed") {
		const existing = await prisma.payment.findFirst({
			where: { paymentIntentId: paymentID },
		});

		if (existing && existing.status !== "PAID") {
			await prisma.payment.update({
				where: { id: existing.id },
				data: {
					status: "PAID",
					transactionId: queryResult.trxID || existing.transactionId,
				},
			});
		}
	}

	return queryResult;
};

const handleWebhook = async (payload: IPaymentWebhookPayload) => {
	const payment = await prisma.payment.findUnique({
		where: { transactionId: payload.transactionId },
	});

	if (!payment) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Payment transaction record not found",
		);
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
			details: `Payment transaction ${payment.transactionId} updated to status ${payload.status} (Amount: ${payment.amount} ${payment.currency}).`,
		},
	});

	return updatedPayment;
};

const getPaymentHistory = async (userId: string, userRole: string) => {
	if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
		return await prisma.payment.findMany({
			include: {
				user: { select: { id: true, name: true, email: true } },
				bloodRequest: {
					select: { id: true, patientName: true, bloodGroup: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	return await prisma.payment.findMany({
		where: { userId },
		include: {
			bloodRequest: {
				select: { id: true, patientName: true, bloodGroup: true },
			},
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

	if (
		payment.userId !== userId &&
		userRole !== "ADMIN" &&
		userRole !== "SUPER_ADMIN"
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Not authorized to view this payment",
		);
	}

	return payment;
};

export const PaymentService = {
	initiatePayment,
	handleBkashCallback,
	queryBkashPayment,
	handleWebhook,
	getPaymentHistory,
	getPaymentById,
};
