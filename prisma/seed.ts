import bcrypt from "bcryptjs";
import { prisma } from "../src/app/lib/prisma";

async function main() {
	console.log("Seeding database...");

	const hashedPassword = await bcrypt.hash("Admin@123456", 10);
	const donorPassword = await bcrypt.hash("Donor@123456", 10);
	const patientPassword = await bcrypt.hash("Patient@123456", 10);

	// 1. Create Demo Admin
	const adminUser = await prisma.user.upsert({
		where: { email: "admin@blooddonation.com" },
		update: {},
		create: {
			name: "Platform Admin",
			email: "admin@blooddonation.com",
			password: hashedPassword,
			role: "ADMIN",
			status: "ACTIVE",
			emailVerified: true,
		},
	});

	console.log("Admin account seeded:", adminUser.email);

	// 2. Create Demo Donor
	const donorUser = await prisma.user.upsert({
		where: { email: "donor@blooddonation.com" },
		update: {},
		create: {
			name: "John Donor",
			email: "donor@blooddonation.com",
			password: donorPassword,
			role: "DONOR",
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
					totalDonations: 4,
				},
			},
		},
	});

	console.log("Donor account seeded:", donorUser.email);

	// 3. Create Demo Patient
	const patientUser = await prisma.user.upsert({
		where: { email: "patient@blooddonation.com" },
		update: {},
		create: {
			name: "Jane Patient",
			email: "patient@blooddonation.com",
			password: patientPassword,
			role: "PATIENT",
			status: "ACTIVE",
			emailVerified: true,
			patientProfile: {
				create: {
					contactNumber: "+8801800000000",
					address: "Gulshan 2",
					hospitalName: "Square Hospital",
				},
			},
		},
	});

	console.log("Patient account seeded:", patientUser.email);

	// 4. Create Sample Blood Request
	const sampleRequest = await prisma.bloodRequest.create({
		data: {
			requesterId: patientUser.id,
			patientName: "Jane Patient",
			bloodGroup: "O_POSITIVE",
			unitsNeeded: 2,
			hospitalName: "Square Hospital",
			hospitalAddress: "Panthapath, Dhaka",
			city: "Dhaka",
			district: "Dhaka",
			urgency: "CRITICAL",
			status: "PENDING",
			neededBy: new Date(Date.now() + 86400000 * 2), // 2 days from now
			additionalNotes: "Urgent need for surgical operation",
			isVerified: true,
		},
	});

	console.log("Sample blood request seeded ID:", sampleRequest.id);
	console.log("Seeding completed successfully.");
}

main()
	.catch((e) => {
		console.error("Error during seeding:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
