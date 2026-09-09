import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import type { TokenPayload } from "google-auth-library";
import httpStatus from "http-status";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import path from "path";
import { AuthProvider, Role, UserStatus } from "../../../generated/prisma/client";
import config from "../../config";
import { AppError } from "../../errors/AppError";
import { googleClient } from "../../lib/googleAuth";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import type {
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterUserPayload,
	IRequestUser,
	IResetPasswordPayload,
	IVerifyEmailPayload,
} from "./auth.interface";
import { redisClient } from "../../lib/redis";

const registerUser = async (payload: IRegisterUserPayload) => {
	const { name, password, role = Role.PATIENT, donor, patient } = payload;
	const email = payload.email.trim().toLowerCase();

	const isUserExists = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserExists) {
		throw new Error("User with this email already exists");
	}

	const hashedPassword = await bcrypt.hash(
		password,
		Number(config.bcrypt_salt_rounds) || 10,
	);

	const otpValue = crypto.randomInt(100000, 1000000).toString();
	const expirationSeconds = 5 * 60; // 5 minutes

	const redisKeyOtp = `register-user-otp:${email}`;
	const redisKeyData = `register-user-data:${email}`;

	const redisUserDataPayload = {
		name,
		email,
		password: hashedPassword,
		role,
		donor,
		patient,
	};

	const redis = await redisClient;
	if (redis) {
		await redis.set(redisKeyOtp, otpValue, {
			expiration: { type: "EX", value: expirationSeconds },
		});

		await redis.set(redisKeyData, JSON.stringify(redisUserDataPayload), {
			expiration: { type: "EX", value: expirationSeconds },
		});
	}

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/register-user-otp.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name,
		email,
		otp: otpValue,
		expirationMinutes: expirationSeconds / 60,
	});

	if (config.smtp_user && config.smtp_password) {
		await transporter.sendMail({
			from: config.email_sender || config.smtp_user,
			to: email,
			subject: "Email Verification - OTP",
			html,
		});
	}

	return { message: "Verification OTP Sent Successfully" };
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
	const { otp } = payload;
	const email = payload.email.trim().toLowerCase();

	const isUserExist = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserExist?.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User account is blocked");
	}

	if (isUserExist?.emailVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
	}

	if (isUserExist?.isDeleted) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User account is deleted");
	}

	const redisKeyOtp = `register-user-otp:${email}`;
	const redisKeyData = `register-user-data:${email}`;

	const redis = await redisClient;
	let redisOtp: string | null = null;
	let redisUserData: string | null = null;

	if (redis) {
		redisOtp = await redis.get(redisKeyOtp);
		redisUserData = await redis.get(redisKeyData);
	}

	if (redisOtp && redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP Does not match or has expired");
	}

	let registerPayload: IRegisterUserPayload;

	if (redisUserData) {
		registerPayload = JSON.parse(redisUserData);
	} else {
		throw new AppError(httpStatus.BAD_REQUEST, "Registration session expired. Please register again.");
	}

	const { name, role = Role.PATIENT, password, donor, patient } = registerPayload;

	let createdUser: any;

	if (role === Role.DONOR && donor) {
		createdUser = await prisma.user.create({
			data: {
				name,
				email,
				password,
				role: Role.DONOR,
				status: UserStatus.ACTIVE,
				emailVerified: true,
				donorProfile: {
					create: {
						bloodGroup: donor.bloodGroup,
						contactNumber: donor.contactNumber,
						address: donor.address || "",
						city: donor.city,
						district: donor.district,
						isAvailable: donor.isAvailable !== undefined ? donor.isAvailable : true,
						lastDonationDate: donor.lastDonationDate
							? new Date(donor.lastDonationDate)
							: null,
					},
				},
			},
			include: { donorProfile: true },
		});
	} else {
		createdUser = await prisma.user.create({
			data: {
				name,
				email,
				password,
				role: Role.PATIENT,
				status: UserStatus.ACTIVE,
				emailVerified: true,
				patientProfile: {
					create: {
						contactNumber: patient?.contactNumber || "",
						address: patient?.address || "",
						hospitalName: patient?.hospitalName || "",
					},
				},
			},
			include: { patientProfile: true },
		});
	}

	if (redis) {
		await redis.del([redisKeyOtp, redisKeyData]);
	}

	if (config.smtp_user && config.smtp_password) {
		const templatePath = path.join(
			process.cwd(),
			"src/app/templates/welcome-email.ejs",
		);
		const html = await ejs.renderFile(templatePath, {
			name: createdUser.name,
			role: createdUser.role,
		});

		await transporter.sendMail({
			from: config.email_sender || config.smtp_user,
			to: email,
			subject: "Welcome to Blood Donation Platform",
			html,
		});
	}

	const { password: _, ...userData } = createdUser;

	const jwtPayload = {
		userId: userData.id,
		name: userData.name,
		email: userData.email,
		role: userData.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		user: userData,
		accessToken,
		refreshToken,
	};
};

const loginUser = async (payload: ILoginUserPayload) => {
	const { password } = payload;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (user.isDeleted) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User account is deleted");
	}

	if (!user.password && user.googleId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User is registered with Google. Please login with Google.",
		);
	}

	const isPasswordMatched = await bcrypt.compare(password, user.password as string);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			status: user.status,
		},
		accessToken,
		refreshToken,
	};
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
	let googlePayload: TokenPayload | null | undefined = null;
	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});
		googlePayload = ticket.getPayload();
	} catch (error) {
		console.error("Google Id Token Verification Failed", error);
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or Expired Google Id Token");
	}

	if (!googlePayload || !googlePayload.email || !googlePayload.name) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google email or name not found");
	}

	const email = googlePayload.email.trim().toLowerCase();
	let user = await prisma.user.findUnique({
		where: { email },
		include: { donorProfile: true, patientProfile: true },
	});

	if (user) {
		if (user.status === UserStatus.BLOCKED || user.isDeleted) {
			throw new AppError(httpStatus.FORBIDDEN, "User account is blocked or deleted");
		}

		if (!user.googleId) {
			user = await prisma.user.update({
				where: { id: user.id },
				data: {
					googleId: googlePayload.sub,
					authProvider: AuthProvider.GOOGLE,
					emailVerified: true,
				},
				include: { donorProfile: true, patientProfile: true },
			});
		}
	} else {
		const userRole = payload.role || Role.PATIENT;
		user = await prisma.user.create({
			data: {
				name: googlePayload.name,
				email,
				googleId: googlePayload.sub,
				authProvider: AuthProvider.GOOGLE,
				role: userRole,
				status: UserStatus.ACTIVE,
				emailVerified: true,
				patientProfile: {
					create: {
						contactNumber: "",
						address: "",
					},
				},
			},
			include: { donorProfile: true, patientProfile: true },
		});

		if (config.smtp_user && config.smtp_password) {
			const templatePath = path.join(
				process.cwd(),
				"src/app/templates/welcome-email.ejs",
			);
			const html = await ejs.renderFile(templatePath, {
				name: user.name,
				role: user.role,
			});

			await transporter.sendMail({
				from: config.email_sender || config.smtp_user,
				to: user.email,
				subject: "Welcome to Blood Donation Platform",
				html,
			});
		}
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	const { password: _, ...userData } = user;

	return {
		user: userData,
		accessToken,
		refreshToken,
	};
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const email = payload.email.trim().toLowerCase();
	const user = await prisma.user.findUnique({ where: { email } });

	if (!user || user.isDeleted || user.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User does not exist, is blocked or deleted",
		);
	}

	if (user.googleId && user.authProvider === AuthProvider.GOOGLE) {
		throw new AppError(httpStatus.BAD_REQUEST, "User has account with Google");
	}

	const otp = crypto.randomInt(100000, 1000000).toString();
	const redisKey = `forgot-password-otp:${email}`;
	const expirationSeconds = 5 * 60; // 5 minutes

	const redis = await redisClient;
	if (redis) {
		await redis.set(redisKey, otp, {
			expiration: { type: "EX", value: expirationSeconds },
		});
	}

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/forgot-password.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name: user.name,
		otp,
		expirationMinutes: expirationSeconds / 60,
	});

	if (config.smtp_user && config.smtp_password) {
		await transporter.sendMail({
			from: config.email_sender || config.smtp_user,
			to: user.email,
			subject: "Forgot Password OTP",
			html,
		});
	}

	return { message: `OTP Sent to Email: ${email}` };
};

const resetPassword = async (payload: IResetPasswordPayload) => {
	const { email, otp, newPassword } = payload;
	const formattedEmail = email.trim().toLowerCase();

	const user = await prisma.user.findUnique({ where: { email: formattedEmail } });

	if (!user || user.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
	}

	if (user.status === UserStatus.BLOCKED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}

	if (user.googleId && user.authProvider === AuthProvider.GOOGLE) {
		throw new AppError(httpStatus.BAD_REQUEST, "User has account with Google");
	}

	const redisKey = `forgot-password-otp:${formattedEmail}`;
	const redis = await redisClient;
	let redisOtp: string | null = null;

	if (redis) {
		redisOtp = await redis.get(redisKey);
	}

	if (redisOtp && redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP Does not match or expired");
	}

	const hashedNewPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds) || 10,
	);

	await prisma.user.update({
		where: { email: formattedEmail },
		data: { password: hashedNewPassword },
	});

	if (redis) {
		await redis.del([redisKey]);
	}

	if (config.smtp_user && config.smtp_password) {
		const templatePath = path.join(
			process.cwd(),
			"src/app/templates/reset-password-success.ejs",
		);
		const html = await ejs.renderFile(templatePath, { name: user.name });

		await transporter.sendMail({
			from: config.email_sender || config.smtp_user,
			to: formattedEmail,
			subject: "Password Changed Successfully",
			html,
		});
	}

	return { message: "Password Changed successfully" };
};

const getMe = async (userPayload: IRequestUser) => {
	const user = await prisma.user.findUnique({
		where: { id: userPayload.userId },
		include: {
			donorProfile: true,
			patientProfile: true,
		},
	});

	if (!user || user.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "User profile not found");
	}

	const { password: _, ...userData } = user;
	return userData;
};

const refreshToken = async (token: string) => {
	const verifiedRefreshToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret);

	if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
	}

	const data = verifiedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUnique({
		where: { id: data.userId },
	});

	if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User account inactive or not found");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const newRefreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken: newRefreshToken,
	};
};

export const AuthService = {
	registerUser,
	verifyEmail,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
};
