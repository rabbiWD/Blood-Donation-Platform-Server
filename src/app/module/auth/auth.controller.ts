import type { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config/index";
import { AppError } from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";

const getCookieOptions = (maxAge: number) => {
	const isProd = config.node_env === "production";
	return {
		httpOnly: true,
		secure: isProd,
		sameSite: (isProd ? "none" : "lax") as "none" | "lax",
		maxAge,
	};
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.registerUser(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: result.message,
		data: null,
	});
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.verifyEmail(req.body);
	const { accessToken, refreshToken, user } = result;

	res.cookie("accessToken", accessToken, getCookieOptions(1000 * 60 * 60 * 24));
	res.cookie("refreshToken", refreshToken, getCookieOptions(1000 * 60 * 60 * 24 * 7));

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Email Verified Successfully",
		data: {
			accessToken,
			refreshToken,
			user,
		},
	});
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.loginUser(req.body);
	const { accessToken, refreshToken, user } = result;

	res.cookie("accessToken", accessToken, getCookieOptions(1000 * 60 * 60 * 24));
	res.cookie("refreshToken", refreshToken, getCookieOptions(1000 * 60 * 60 * 24 * 7));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User logged in successfully",
		data: {
			accessToken,
			refreshToken,
			user,
		},
	});
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.googleLogin(req.body);
	const { accessToken, refreshToken, user } = result;

	res.cookie("accessToken", accessToken, getCookieOptions(1000 * 60 * 60 * 24));
	res.cookie("refreshToken", refreshToken, getCookieOptions(1000 * 60 * 60 * 24 * 7));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken,
			user,
		},
	});
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.forgotPassword(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: result.message,
		data: null,
	});
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const result = await AuthService.resetPassword(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: result.message,
		data: null,
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as unknown as IRequestUser;

	if (!user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User information is missing in the request",
		);
	}

	const result = await AuthService.getMe(user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile fetched successfully",
		data: result,
	});
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	if (!req.cookies.refreshToken && !req.body.refreshToken) {
		throw new AppError(httpStatus.BAD_REQUEST, "Refresh token is missing");
	}

	const token = req.cookies.refreshToken || req.body.refreshToken;
	const result = await AuthService.refreshToken(token);
	const { accessToken, refreshToken: newRefreshToken } = result;

	res.cookie("accessToken", accessToken, getCookieOptions(1000 * 60 * 60 * 24));
	res.cookie("refreshToken", newRefreshToken, getCookieOptions(1000 * 60 * 60 * 24 * 7));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken: newRefreshToken,
		},
	});
});

export const AuthController = {
	registerUser,
	verifyEmail,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
};
