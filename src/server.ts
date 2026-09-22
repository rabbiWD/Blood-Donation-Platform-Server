import app from "./app.js";
import config from "./app/config/index.js";
import { transporter } from "./app/lib/nodemailer.js";
import { prisma } from "./app/lib/prisma.js";
import { redisClient } from "./app/lib/redis.js";
import {
	seedSuperAdmin,
	seedTesterAdmin,
	seedTesterDonor,
} from "./app/utils/seed.js";

const PORT = config.port || 5000;

const main = async () => {
	try {
		await prisma.$connect();
		console.log("Connected to the database successfully.");

		// try {
		// 	await getRedisClient();
		// } catch (redisErr) {
		// 	console.warn("Redis startup notification:", redisErr);
		// }

		await redisClient.connect();
		console.log("Connected to Redis successfully.");

		app.listen(Number(PORT), "0.0.0.0", () => {
			console.log(`Server is running on port ${PORT}`);
		});

		if (config.smtp_user && config.smtp_password) {
			try {
				await transporter.verify();
				console.log("Nodemailer Connected Successfully");
			} catch (smtpErr) {
				console.warn("Nodemailer verification warning:", smtpErr);
			}
		} else {
			console.log("Nodemailer skipped: SMTP credentials not provided.");
		}

		seedSuperAdmin().catch((e) => console.error("SuperAdmin seed error:", e));
		seedTesterAdmin().catch((e) => console.error("TesterAdmin seed error:", e));
		seedTesterDonor().catch((e) => console.error("TesterDonor seed error:", e));
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
