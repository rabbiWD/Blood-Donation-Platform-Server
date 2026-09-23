import { Router } from "express";
// import { Role } from "@prisma/client";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AuthController } from "./auth.controller.js";
import { UserValidation } from "./auth.validation.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

router.post(
	"/register",
	validateRequest(UserValidation.RegisterUserZodSchema),
	AuthController.registerUser,
);

router.post(
	"/verify-email",
	validateRequest(UserValidation.VerifyEmailZodSchema),
	AuthController.verifyEmail,
);

router.post(
	"/login",
	validateRequest(UserValidation.LoginZodSchema),
	AuthController.loginUser,
);

router.get(
	"/me",
	auth(Role.ADMIN, Role.DONOR, Role.PATIENT, Role.SUPER_ADMIN),
	AuthController.getMe,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
	"/google",
	// validateRequest(UserValidation.GoogleLoginZodSchema),
	AuthController.googleLogin,
);

router.post(
	"/forgot-password",
	validateRequest(UserValidation.ForgotPasswordZodSchema),
	AuthController.forgotPassword,
);

router.post(
	"/reset-password",
	validateRequest(UserValidation.ResetPasswordZodSchema),
	AuthController.resetPassword,
);

export const AuthRoutes = router;
