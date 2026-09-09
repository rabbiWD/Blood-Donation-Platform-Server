import { Router } from "express";
import { Role } from "../../../generated/prisma/client";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = Router();

// Protect all admin routes with ADMIN and SUPER_ADMIN role guard
router.use(auth(Role.ADMIN, Role.SUPER_ADMIN));

router.get("/users", AdminController.getAllUsers);

router.patch(
	"/users/:id/status",
	validateRequest(AdminValidation.UpdateUserStatusZodSchema),
	AdminController.updateUserStatus,
);

router.patch(
	"/users/:id/role",
	validateRequest(AdminValidation.UpdateUserRoleZodSchema),
	AdminController.updateUserRole,
);

router.get("/dashboard-stats", AdminController.getDashboardStats);

router.get("/audit-logs", AdminController.getAuditLogs);

export const AdminRoutes = router;
