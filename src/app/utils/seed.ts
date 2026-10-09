import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import config from "../config/index";
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

export const seedTesterPatient = async () => {
	try {
		const patientEmail = "mahinachowdhury0@gmail.com";
		const isPatientExist = await prisma.user.findUnique({
			where: { email: patientEmail },
		});

		if (isPatientExist) {
			return;
		}

		const hashedPassword = await bcrypt.hash(
			"Patient@123456",
			Number(config.bcrypt_salt_rounds) || 10,
		);

		await prisma.user.create({
			data: {
				name: "Mahina Chowdhury",
				email: patientEmail,
				password: hashedPassword,
				role: Role.PATIENT,
				status: "ACTIVE",
				emailVerified: true,
				patientProfile: {
					create: {
						contactNumber: "+8801800000000",
						address: "Dhanmondi, Dhaka",
						hospitalName: "Dhaka Medical College Hospital",
					},
				},
			},
		});

		console.log("Demo Patient seeded successfully:", patientEmail);
	} catch (error) {
		console.error("Error seeding Patient:", error);
	}
};

