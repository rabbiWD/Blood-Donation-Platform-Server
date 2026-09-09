import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import config from "../config";

cloudinary.config({
	cloud_name: config.cloudinary_cloud_name,
	api_key: config.cloudinary_api_key,
	api_secret: config.cloudinary_api_secret,
});

export const uploadToCloudinary = (
	file: Express.Multer.File,
	folderName = "blood_donation_platform",
): Promise<UploadApiResponse> => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder: folderName,
				resource_type: "auto",
			},
			(error, result) => {
				if (error) {
					return reject(error);
				}
				if (!result) {
					return reject(new Error("Cloudinary upload failed: empty result"));
				}
				resolve(result);
			},
		);

		uploadStream.end(file.buffer);
	});
};

export { cloudinary };
