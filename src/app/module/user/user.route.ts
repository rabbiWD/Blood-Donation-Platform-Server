import { Router } from "express";

import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { UserController } from "./user.controller.js";
import { UserValidation } from "./user.validation.js";
import { upload } from "../../lib/multer.js";
import { Role } from "../../../generated/prisma/enums.js";
// import { Role } from "@prisma/client/index-browser";

const router = Router();

router.patch(
	"/me",
	auth(Role.ADMIN, Role.DONOR, Role.PATIENT, Role.SUPER_ADMIN),
	validateRequest(UserValidation.UpdateUserProfileZodSchema),
	UserController.updateMyProfile,
);

router.patch(
	"/donor-profile",
	auth(Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(UserValidation.UpdateDonorProfileZodSchema),
	UserController.updateDonorProfile,
);

router.get(
	"/donors",
	auth(Role.ADMIN, Role.PATIENT, Role.DONOR, Role.SUPER_ADMIN),
	UserController.getEligibleDonors,
);

router.patch(
	"/profile-image",
	auth(Role.SUPER_ADMIN, Role.ADMIN, Role.DONOR, Role.PATIENT),
	upload.single("profileImage"),
	UserController.uploadProfileImage,
);

export const UserRoutes = router;
