import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AdminRoutes } from "./app/module/admin/admin.route";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { BloodRequestRoutes } from "./app/module/bloodRequest/bloodRequest.route";
// import { FileRoutes } from "./app/module/file/file.route";
import { PaymentRoutes } from "./app/module/payment/payment.route";
import { UserRoutes } from "./app/module/user/user.route";

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
