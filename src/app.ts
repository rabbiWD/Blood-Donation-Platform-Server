import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config/index.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";
import { AdminRoutes } from "./app/module/admin/admin.route.js";
import { AuthRoutes } from "./app/module/auth/auth.route.js";
import { BloodRequestRoutes } from "./app/module/bloodRequest/bloodRequest.route.js";
// import { FileRoutes } from "./app/module/file/file.route.js";
import { PaymentRoutes } from "./app/module/payment/payment.route.js";
import { UserRoutes } from "./app/module/user/user.route.js";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url || "*",
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing and JSON parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// API Routes (Versioned /api/v1)
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/blood-requests", BloodRequestRoutes);
app.use("/api/v1/payments", PaymentRoutes);
app.use("/api/v1/admin", AdminRoutes);
// app.use("/api/v1/files", FileRoutes);

// Health check route
app.get("/", (_req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to Blood Donation & Emergency Assistance Platform API",
		version: "1.0.0",
	});
});

// Error handling middleware
app.use(globalErrorHandler);
app.use(notFound);

export default app;
