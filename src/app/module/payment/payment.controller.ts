import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../errors/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { prisma } from "../../lib/prisma.js";
import type { IBkashCallbackQuery } from "./payment.interface.js";
import { PaymentService } from "./payment.service.js";

import { PaymentValidation } from "./payment.validation.js";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await PaymentService.initiatePayment(userId, req.body);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Payment initiated successfully",
		data: result,
	});
});

const handleBkashCallback = catchAsync(async (req: Request, res: Response) => {
	const parsedQuery = PaymentValidation.BkashCallbackZodSchema.parse(req.query);
	const { redirectUrl } = await PaymentService.handleBkashCallback(
		parsedQuery as unknown as IBkashCallbackQuery,
	);
	res.redirect(redirectUrl);
});

const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
	const { paymentID, trxID } = req.query as {
		paymentID?: string;
		trxID?: string;
	};

	const payment = paymentID
		? await prisma.payment.findFirst({
				where: { paymentIntentId: paymentID },
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					bloodRequest: {
						select: {
							id: true,
							patientName: true,
							bloodGroup: true,
						},
					},
				},
			})
		: null;

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "bKash payment completed successfully",
		data: {
			paymentID,
			trxID: trxID || payment?.transactionId,
			amount: payment?.amount,
			currency: payment?.currency || "BDT",
			status: "PAID",
			payment,
		},
	});
});

const paymentFailed = catchAsync(async (req: Request, res: Response) => {
	const { paymentID, message } = req.query as {
		paymentID?: string;
		message?: string;
	};

	sendResponse(res, {
		statusCode: httpStatus.BAD_REQUEST,
		success: false,
		message: message || "bKash payment failed",
		data: {
			paymentID,
			status: "FAILED",
		},
	});
});

const paymentCancel = catchAsync(async (req: Request, res: Response) => {
	const { paymentID } = req.query as { paymentID?: string };

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: false,
		message: "bKash payment was cancelled by user",
		data: {
			paymentID,
			status: "CANCELLED",
		},
	});
});

const queryBkashPayment = catchAsync(async (req: Request, res: Response) => {
	const paymentId = req.params.paymentId as string;
	if (!paymentId) {
		throw new AppError(httpStatus.BAD_REQUEST, "paymentId is required");
	}

	const result = await PaymentService.queryBkashPayment(paymentId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "bKash payment status queried successfully",
		data: result,
	});
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
	const result = await PaymentService.handleWebhook(req.body);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Webhook processed successfully",
		data: result,
	});
});

const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	const userRole = req.user?.role;
	if (!userId || !userRole) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await PaymentService.getPaymentHistory(userId, userRole);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Payment history fetched successfully",
		data: result,
	});
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const userId = req.user?.userId;
	const userRole = req.user?.role;
	if (!userId || !userRole) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await PaymentService.getPaymentById(id, userId, userRole);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Payment details retrieved successfully",
		data: result,
	});
});

export const PaymentController = {
	initiatePayment,
	handleBkashCallback,
	paymentSuccess,
	paymentFailed,
	paymentCancel,
	queryBkashPayment,
	handleWebhook,
	getPaymentHistory,
	getPaymentById,
};
