import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserService } from "./user.service";

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await UserService.updateMyProfile(userId, req.body);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile updated successfully",
		data: result,
	});
});

const updateDonorProfile = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.userId;
	if (!userId) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
	}

	const result = await UserService.updateDonorProfile(userId, req.body);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Donor profile updated successfully",
		data: result,
	});
});

const getEligibleDonors = catchAsync(async (req: Request, res: Response) => {
	const result = await UserService.getEligibleDonors(req.query);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Eligible blood donors retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
    console.log(req.file, "req.file");

    if(!req.file){
        throw new Error("No file Provided.")
    }

    const userId = req.user?.userId;

    const result =await UserService.uploadProfileImage(req.file?.buffer, userId!);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: result,
	});
});

export const UserController = {
	updateMyProfile,
	updateDonorProfile,
	getEligibleDonors,
	uploadProfileImage,
};
