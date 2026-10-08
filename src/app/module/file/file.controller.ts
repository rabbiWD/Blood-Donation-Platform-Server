// import type { Request, Response } from "express";
// import httpStatus from "http-status";
// import { AppError } from "../../errors/AppError";
// import { uploadToCloudinary } from "../../lib/cloudinary";
// import { catchAsync } from "../../utils/catchAsync";
// import { sendResponse } from "../../utils/sendResponse";

// const uploadSingleFile = catchAsync(async (req: Request, res: Response) => {
// 	if (!req.file) {
// 		throw new AppError(httpStatus.BAD_REQUEST, "Please select a file to upload");
// 	}

// 	const cloudinaryResult = await uploadToCloudinary(req.file, "blood_donation_files");

// 	sendResponse(res, {
// 		statusCode: httpStatus.OK,
// 		success: true,
// 		message: "File uploaded to Cloudinary successfully",
// 		data: {
// 			url: cloudinaryResult.secure_url,
// 			publicId: cloudinaryResult.public_id,
// 			format: cloudinaryResult.format,
// 			bytes: cloudinaryResult.bytes,
// 		},
// 	});
// });

// const uploadMultipleFiles = catchAsync(async (req: Request, res: Response) => {
// 	const files = req.files as Express.Multer.File[];
// 	if (!files || files.length === 0) {
// 		throw new AppError(httpStatus.BAD_REQUEST, "Please select at least one file to upload");
// 	}

// 	const uploadPromises = files.map((file) =>
// 		uploadToCloudinary(file, "blood_donation_files"),
// 	);
// 	const results = await Promise.all(uploadPromises);

// 	const uploadedFiles = results.map((result) => ({
// 		url: result.secure_url,
// 		publicId: result.public_id,
// 		format: result.format,
// 		bytes: result.bytes,
// 	}));

// 	sendResponse(res, {
// 		statusCode: httpStatus.OK,
// 		success: true,
// 		message: "Multiple files uploaded to Cloudinary successfully",
// 		data: uploadedFiles,
// 	});
// });

// export const FileController = {
// 	uploadSingleFile,
// 	uploadMultipleFiles,
// };
