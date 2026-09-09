import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import { upload } from "../../lib/multer";

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

router.patch("/profile-image",
     auth(Role.SUPER_ADMIN, Role.ADMIN, Role.DONOR, Role.PATIENT),
     upload.single("profileImage"),
     UserController.uploadProfileImage);


export const UserRoutes = router;
