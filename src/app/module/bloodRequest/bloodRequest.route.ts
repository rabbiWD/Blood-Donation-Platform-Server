import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { BloodRequestController } from "./bloodRequest.controller";
import { BloodRequestValidation } from "./bloodRequest.validation";

const router = Router();

router.post(
	"/",
	auth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(BloodRequestValidation.CreateBloodRequestZodSchema),
	BloodRequestController.createBloodRequest,
);

router.get("/", BloodRequestController.getAllBloodRequests);

router.get(
	"/my-requests",
	auth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
	BloodRequestController.getMyBloodRequests,
);

router.get(
	"/compatible-requests",
	auth(Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	BloodRequestController.getCompatibleRequestsForDonor,
);

router.get("/:id", BloodRequestController.getBloodRequestById);

router.patch(
	"/:id",
	auth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(BloodRequestValidation.UpdateBloodRequestZodSchema),
	BloodRequestController.updateBloodRequest,
);

router.delete(
	"/:id",
	auth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
	BloodRequestController.deleteBloodRequest,
);

router.post(
	"/:id/accept",
	auth(Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	BloodRequestController.acceptBloodRequest,
);

router.patch(
	"/:id/complete",
	auth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
	BloodRequestController.completeBloodDonation,
);

export const BloodRequestRoutes = router;
