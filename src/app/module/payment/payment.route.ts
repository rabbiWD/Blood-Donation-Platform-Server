import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

router.post(
	"/initiate",
	auth(Role.PATIENT, Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(PaymentValidation.InitiatePaymentZodSchema),
	PaymentController.initiatePayment,
);

router.post(
	"/webhook",
	validateRequest(PaymentValidation.WebhookPaymentZodSchema),
	PaymentController.handleWebhook,
);

router.get(
	"/history",
	auth(Role.PATIENT, Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	PaymentController.getPaymentHistory,
);

router.get(
	"/:id",
	auth(Role.PATIENT, Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	PaymentController.getPaymentById,
);

export const PaymentRoutes = router;
