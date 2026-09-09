import bcrypt from "bcryptjs";
import { Role } from "../../generated/prisma/client";
import config from "../config";
import { prisma } from "../lib/prisma";

export const seedSuperAdmin = async () => {
	try {
		if (!config.super_admin_email || !config.super_admin_password) {
			return;
		}

		const isSuperAdminExist = await prisma.user.findFirst({
			where: { role: Role.SUPER_ADMIN },
		});

		if (isSuperAdminExist) {
			console.log("Super Admin already exists.");
			return;
		}

		const hashedPassword = await bcrypt.hash(
			config.super_admin_password,
			Number(config.bcrypt_salt_rounds) || 10,
		);

		await prisma.user.create({
			data: {
				name: config.super_admin_name || "Super Admin",
				email: config.super_admin_email,
				password: hashedPassword,
				role: Role.SUPER_ADMIN,
				status: "ACTIVE",
				emailVerified: true,
			},
		});

		console.log("Super Admin seeded successfully.");
	} catch (error) {
		console.error("Error seeding Super Admin:", error);
	}
};

export const seedTesterAdmin = async () => {
	try {
		const adminEmail = config.tester_admin_email || "admin@blooddonation.com";
		const isTesterAdminExist = await prisma.user.findUnique({
			where: { email: adminEmail },
		});

		if (isTesterAdminExist) {
			console.log("Admin account already exists.");
			return;
		}

		const hashedPassword = await bcrypt.hash(
			config.tester_admin_password || "Admin@123456",
			Number(config.bcrypt_salt_rounds) || 10,
		);

		await prisma.user.create({
			data: {
				name: config.tester_admin_name || "Platform Admin",
				email: adminEmail,
				password: hashedPassword,
				role: Role.ADMIN,
				status: "ACTIVE",
				emailVerified: true,
			},
		});

		console.log("Demo Admin seeded successfully:", adminEmail);
	} catch (error) {
		console.error("Error seeding Admin:", error);
	}
};

export const seedTesterDonor = async () => {
	try {
		const donorEmail = "donor@blooddonation.com";
		const isDonorExist = await prisma.user.findUnique({
			where: { email: donorEmail },
		});

		if (isDonorExist) {
			return;
		}

		const hashedPassword = await bcrypt.hash(
			"Donor@123456",
			Number(config.bcrypt_salt_rounds) || 10,
		);

		await prisma.user.create({
			data: {
				name: "John Donor",
				email: donorEmail,
				password: hashedPassword,
				role: Role.DONOR,
				status: "ACTIVE",
				emailVerified: true,
				donorProfile: {
					create: {
						bloodGroup: "O_POSITIVE",
						contactNumber: "+8801700000000",
						address: "Dhanmondi 27",
						city: "Dhaka",
						district: "Dhaka",
						isAvailable: true,
						lastDonationDate: new Date("2024-01-01"),
						totalDonations: 3,
					},
				},
			},
		});

		console.log("Demo Donor seeded successfully:", donorEmail);
	} catch (error) {
		console.error("Error seeding Donor:", error);
	}
};