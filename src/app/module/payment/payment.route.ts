import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

// 1. Initiate Payment (bKash by default, returns bkashURL and paymentID)
router.post(
	"/initiate",
	auth(Role.PATIENT, Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(PaymentValidation.InitiatePaymentZodSchema),
	PaymentController.initiatePayment,
);

// 2. bKash Redirect Callback URL (Public GET invoked by user's browser after bKash interaction)
router.get("/bkash/callback", PaymentController.handleBkashCallback);

// 3. Backend Success, Failure & Cancel Views (Direct browser landing pages)
router.get("/success", PaymentController.paymentSuccess);
router.get("/failed", PaymentController.paymentFailed);
router.get("/cancel", PaymentController.paymentCancel);

// 3. Query bKash Payment Status directly from bKash API
router.get(
	"/bkash/query/:paymentId",
	auth(Role.PATIENT, Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	PaymentController.queryBkashPayment,
);

// 4. Fallback Webhook endpoint (for testing/manual callbacks)
router.post(
	"/webhook",
	validateRequest(PaymentValidation.WebhookPaymentZodSchema),
	PaymentController.handleWebhook,
);

// 5. User Payment History
router.get(
	"/history",
	auth(Role.PATIENT, Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	PaymentController.getPaymentHistory,
);

// 6. Specific Payment Details
router.get(
	"/:id",
	auth(Role.PATIENT, Role.DONOR, Role.ADMIN, Role.SUPER_ADMIN),
	PaymentController.getPaymentById,
);

export const PaymentRoutes = router;
