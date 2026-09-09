import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

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
	handleWebhook,
	getPaymentHistory,
	getPaymentById,
};
