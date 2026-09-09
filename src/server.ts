import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { seedSuperAdmin, seedTesterAdmin, seedTesterDonor } from "./app/utils/seed";

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

		await transporter.verify();
		console.log("Nodemailer Connected Successfully")

		await seedSuperAdmin();
		await seedTesterAdmin();
		await seedTesterDonor();

		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
