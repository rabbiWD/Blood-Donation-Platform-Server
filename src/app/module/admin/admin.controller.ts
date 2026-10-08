import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getAllUsers(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Users retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
	const adminUserId = req.user?.userId;
	const targetUserId = req.params.id as string;

	if (!adminUserId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Admin user not authenticated");
	}

	const result = await AdminService.updateUserStatus(
		adminUserId,
		targetUserId,
		req.body,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `User status updated to ${req.body.status} successfully`,
		data: result,
	});
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
	const adminUserId = req.user?.userId;
	const targetUserId = req.params.id as string;

	if (!adminUserId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Admin user not authenticated");
	}

	const result = await AdminService.updateUserRole(
		adminUserId,
		targetUserId,
		req.body,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `User role updated to ${req.body.role} successfully`,
		data: result,
	});
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getDashboardStats();
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Dashboard analytics statistics fetched successfully",
		data: result,
	});
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 20;

	const result = await AdminService.getAuditLogs(page, limit);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Audit logs retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

export const AdminController = {
	getAllUsers,
	updateUserStatus,
	updateUserRole,
	getDashboardStats,
	getAuditLogs,
};
