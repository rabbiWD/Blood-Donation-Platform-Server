import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import { Role } from "../../../generated/prisma/enums";

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
