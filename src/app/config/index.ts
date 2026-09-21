import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	node_env: process.env.NODE_ENV || "development",
	port: process.env.PORT || 5000,
	database_url: process.env.DATABASE_URL || "",
	bak_url: process.env.APP_URL || "",
	frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
	bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || "10",
	jwt_access_secret: process.env.JWT_ACCESS_SECRET || "default_access_secret",
	jwt_refresh_secret:
		process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
	jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
	jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
	google_client_id: process.env.GOOGLE_CLIENT_ID || "",
	super_admin_name: process.env.SUPER_ADMIN_NAME || "Super Admin",
	super_admin_email: process.env.SUPER_ADMIN_EMAIL || "superadmin@gmail.com",
	super_admin_password: process.env.SUPER_ADMIN_PASSWORD || "Super@admin12345",
	tester_admin_name: process.env.TESTER_ADMIN_NAME || "Tester Admin",
	tester_admin_email: process.env.TESTER_ADMIN_EMAIL || "testeradmin@gmail.com",
	tester_admin_password:
		process.env.TESTER_ADMIN_PASSWORD || "Tester@admin12345",
	tester_doctor_name: process.env.TESTER_DOCTOR_NAME || "Tester Doctor",
	tester_doctor_email:
		process.env.TESTER_DOCTOR_EMAIL || "testerdoctor@gmail.com",
	tester_doctor_password:
		process.env.TESTER_DOCTOR_PASSWORD || "Tester@doctor12345",
	redis_user: process.env.REDIS_USER || "default",
	redis_password: process.env.REDIS_PASSWORD || "",
	redis_host: process.env.REDIS_HOST || "localhost",
	redis_port: process.env.REDIS_PORT || "6379",
	smtp_user: process.env.SMTP_USER || "",
	smtp_password: process.env.SMTP_PASSWORD || "",
	email_sender: process.env.EMAIL_SENDER || "",
	backend_url: process.env.BACKEND_URL || "http://localhost:5000",
	cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
	cloudinary_api_key: process.env.CLOUDINARY_API_KEY || "",
	cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET || "",
	bkash_base_url:
		process.env.BKASH_BASE_URL ||
		"https://tokenized.sandbox.bka.sh/v1.2.0-beta",
	bkash_app_key: process.env.BKASH_APP_KEY || "",
	bkash_app_secret: process.env.BKASH_APP_SECRET || "",
	bkash_username: process.env.BKASH_USERNAME || "",
	bkash_password: process.env.BKASH_PASSWORD || "",
	bkash_callback_url:
		process.env.BKASH_CALLBACK_URL ||
		"http://localhost:5000/api/v1/payments/bkash/callback",
};
