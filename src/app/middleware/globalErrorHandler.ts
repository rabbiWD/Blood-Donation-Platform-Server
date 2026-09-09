import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError, type ZodIssue } from "zod";
import { Prisma } from "../../generated/prisma/client";
import config from "../config";
import { AppError } from "../errors/AppError";

export type TErrorSources = {
	field: string | number;
	message: string;
}[];

export const globalErrorHandler = (
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let message = err.message || "Something went wrong!";
	let errorSources: TErrorSources = [
		{
			field: "",
			message: err.message || "Something went wrong!",
		},
	];

	if (err instanceof ZodError) {
		statusCode = httpStatus.BAD_REQUEST;
		message = "Validation Error";
		errorSources = err.issues.map((issue: ZodIssue) => ({
			field: (issue.path[issue.path.length - 1] as string | number) || "",
			message: issue.message,
		}));
	} else if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
		errorSources = [
			{
				field: "",
				message: err.message,
			},
		];
	} else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		message = "Incorrect field type or missing required fields";
		errorSources = [
			{
				field: "",
				message: err.message,
			},
		];
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			statusCode = httpStatus.CONFLICT;
			message = "Duplicate record field value entered";
			const target = (err.meta?.target as string[]) || [];
			errorSources = target.map((field) => ({
				field,
				message: `${field} already exists.`,
			}));
		} else if (err.code === "P2003") {
			statusCode = httpStatus.BAD_REQUEST;
			message = "Foreign key constraint failed";
			errorSources = [
				{
					field: "",
					message: "Referenced record does not exist",
				},
			];
		} else if (err.code === "P2025") {
			statusCode = httpStatus.NOT_FOUND;
			message = "Requested record not found";
			errorSources = [
				{
					field: "",
					message: "Record to update/delete not found",
				},
			];
		}
	} else if (err instanceof Error) {
		message = err.message;
		errorSources = [
			{
				field: "",
				message: err.message,
			},
		];
	}

	res.status(statusCode).json({
		success: false,
		message,
		errors: errorSources,
		stack: config.node_env === "development" ? err?.stack : undefined,
	});
};
