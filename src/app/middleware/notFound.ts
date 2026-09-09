import type { Request, Response } from "express";
import httpStatus from "http-status";

export const notFound = (req: Request, res: Response) => {
	res.status(httpStatus.NOT_FOUND).json({
		success: false,
		message: "API Route Not Found",
		errors: [
			{
				field: "path",
				message: `Requested route '${req.originalUrl}' does not exist on this server.`,
			},
		],
	});
};
