import type { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config/index";
import { AppError } from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { prisma } from "../../lib/prisma";
import type { IBkashCallbackQuery } from "./payment.interface";
import { PaymentService } from "./payment.service";

import { PaymentValidation } from "./payment.validation";

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
		  })
		: null;

	const frontendUrl = config.frontend_url || "http://localhost:3000";
	const amountParam = payment?.amount ? `&amount=${payment.amount}` : "";
	const trxParam =
		trxID || payment?.transactionId
			? `&trxID=${trxID || payment?.transactionId}`
			: "";
	return res.redirect(
		`${frontendUrl}/payment/success?paymentID=${paymentID || ""}${trxParam}${amountParam}`,
	);
});

const paymentFailed = catchAsync(async (req: Request, res: Response) => {
	const { paymentID, message } = req.query as {
		paymentID?: string;
		message?: string;
	};

	const frontendUrl = config.frontend_url || "http://localhost:3000";
	const errorMsg = encodeURIComponent(message || "bKash payment failed");
	return res.redirect(
		`${frontendUrl}/payment/cancel?paymentID=${paymentID || ""}&message=${errorMsg}`,
	);
});

const paymentCancel = catchAsync(async (req: Request, res: Response) => {
	const { paymentID } = req.query as { paymentID?: string };

	const frontendUrl = config.frontend_url || "http://localhost:3000";
	return res.redirect(
		`${frontendUrl}/payment/cancel?paymentID=${paymentID || ""}`,
	);
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
