import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BloodRequestService } from "./bloodRequest.service";

const createBloodRequest = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await BloodRequestService.createBloodRequest(userId, req.body);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Emergency blood request created successfully",
		data: result,
	});
});

const getAllBloodRequests = catchAsync(async (req: Request, res: Response) => {
	const result = await BloodRequestService.getAllBloodRequests(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Blood requests fetched successfully",
		meta: result.meta,
		data: result.data,
	});
});

const getBloodRequestById = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const result = await BloodRequestService.getBloodRequestById(id);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Blood request retrieved successfully",
		data: result,
	});
});

const updateBloodRequest = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const userId = req.user?.userId;
	const userRole = req.user?.role;
	if (!userId || !userRole) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await BloodRequestService.updateBloodRequest(
		id,
		userId,
		userRole,
		req.body,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Blood request updated successfully",
		data: result,
	});
});

const deleteBloodRequest = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const userId = req.user?.userId;
	const userRole = req.user?.role;
	if (!userId || !userRole) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await BloodRequestService.deleteBloodRequest(id, userId, userRole);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: result.message,
		data: null,
	});
});

const getMyBloodRequests = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await BloodRequestService.getMyBloodRequests(userId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My blood requests retrieved successfully",
		data: result,
	});
});

const getCompatibleRequestsForDonor = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await BloodRequestService.getCompatibleRequestsForDonor(userId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Compatible blood requests retrieved successfully",
		data: result,
	});
});

const acceptBloodRequest = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const userId = req.user?.userId;
	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await BloodRequestService.acceptBloodRequest(id, userId);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Blood request accepted successfully",
		data: result,
	});
});

const completeBloodDonation = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { donorUserId } = req.body;
	const userId = req.user?.userId;
	const userRole = req.user?.role;

	if (!userId || !userRole) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	if (!donorUserId) {
		throw new AppError(httpStatus.BAD_REQUEST, "donorUserId is required in body");
	}

	const result = await BloodRequestService.completeBloodDonation(
		id,
		donorUserId,
		userId,
		userRole,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Blood donation marked as completed successfully",
		data: result,
	});
});

export const BloodRequestController = {
	createBloodRequest,
	getAllBloodRequests,
	getBloodRequestById,
	updateBloodRequest,
	deleteBloodRequest,
	getMyBloodRequests,
	getCompatibleRequestsForDonor,
	acceptBloodRequest,
	completeBloodDonation,
};
