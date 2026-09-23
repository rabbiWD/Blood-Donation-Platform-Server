import { Router } from "express";
// import { Role } from "@prisma/client";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AdminController } from "./admin.controller.js";
import { AdminValidation } from "./admin.validation.js";
import { Role } from "../../../generated/prisma/enums.js";

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
