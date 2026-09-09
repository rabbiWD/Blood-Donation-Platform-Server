// import multer from "multer";
// import httpStatus from "http-status";
// import { AppError } from "../errors/AppError";

// const storage = multer.memoryStorage();

// const fileFilter = (
// 	_req: Express.Request,
// 	file: Express.Multer.File,
// 	cb: multer.FileFilterCallback,
// ) => {
// 	const allowedMimeTypes = [
// 		"image/jpeg",
// 		"image/png",
// 		"image/webp",
// 		"image/jpg",
// 		"application/pdf",
// 	];

// 	if (allowedMimeTypes.includes(file.mimetype)) {
// 		cb(null, true);
// 	} else {
// 		cb(
// 			new AppError(
// 				httpStatus.BAD_REQUEST,
// 				"Invalid file type. Only JPEG, PNG, WEBP images and PDF documents are allowed.",
// 			) as any,
// 		);
// 	}
// };

// export const upload = multer({
// 	storage,
// 	fileFilter,
// 	limits: {
// 		fileSize: 5 * 1024 * 1024, // 5MB limit
// 	},
// });


import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });
