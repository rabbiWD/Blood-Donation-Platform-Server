import type { BloodGroup, Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import type {
	IBloodRequestQuery,
	ICreateBloodRequestPayload,
	IUpdateBloodRequestPayload,
} from "./bloodRequest.interface";

// Blood compatibility map: Donor Blood Group -> Compatible Recipient Blood Groups
const donorCompatibilityMap: Record<BloodGroup, BloodGroup[]> = {
	A_POSITIVE: ["A_POSITIVE", "AB_POSITIVE"],
	A_NEGATIVE: ["A_POSITIVE", "A_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE"],
	B_POSITIVE: ["B_POSITIVE", "AB_POSITIVE"],
	B_NEGATIVE: ["B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE"],
	AB_POSITIVE: ["AB_POSITIVE"],
	AB_NEGATIVE: ["AB_POSITIVE", "AB_NEGATIVE"],
	O_POSITIVE: ["A_POSITIVE", "B_POSITIVE", "AB_POSITIVE", "O_POSITIVE"],
	O_NEGATIVE: [
		"A_POSITIVE",
		"A_NEGATIVE",
		"B_POSITIVE",
		"B_NEGATIVE",
		"AB_POSITIVE",
		"AB_NEGATIVE",
		"O_POSITIVE",
		"O_NEGATIVE",
	],
};

const createBloodRequest = async (
	userId: string,
	payload: ICreateBloodRequestPayload,
) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user || user.isDeleted) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User account not found");
	}

	const bloodRequest = await prisma.bloodRequest.create({
		data: {
			requesterId: userId,
			patientName: payload.patientName,
			bloodGroup: payload.bloodGroup,
			unitsNeeded: payload.unitsNeeded || 1,
			hospitalName: payload.hospitalName,
			hospitalAddress: payload.hospitalAddress,
			city: payload.city,
			district: payload.district,
			urgency: payload.urgency || "STANDARD",
			status: "PENDING",
			neededBy: new Date(payload.neededBy),
			additionalNotes: payload.additionalNotes,
			isVerified: user.role === "ADMIN" || user.role === "SUPER_ADMIN",
		},
	});

	return bloodRequest;
};

const getAllBloodRequests = async (query: IBloodRequestQuery) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const whereConditions: Prisma.BloodRequestWhereInput = {
		isDeleted: false,
	};

	if (query.bloodGroup) {
		whereConditions.bloodGroup = query.bloodGroup;
	}

	if (query.urgency) {
		whereConditions.urgency = query.urgency;
	}

	if (query.status) {
		whereConditions.status = query.status;
	}

	if (query.city) {
		whereConditions.city = { contains: query.city, mode: "insensitive" };
	}

	if (query.district) {
		whereConditions.district = { contains: query.district, mode: "insensitive" };
	}

	if (query.search) {
		whereConditions.OR = [
			{ patientName: { contains: query.search, mode: "insensitive" } },
			{ hospitalName: { contains: query.search, mode: "insensitive" } },
			{ city: { contains: query.search, mode: "insensitive" } },
			{ district: { contains: query.search, mode: "insensitive" } },
		];
	}

	const [requests, total] = await Promise.all([
		prisma.bloodRequest.findMany({
			where: whereConditions,
			include: {
				requester: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				matches: {
					include: {
						donor: {
							select: {
								id: true,
								name: true,
								donorProfile: true,
							},
						},
					},
				},
			},
			skip,
			take: limit,
			orderBy: query.sortBy
				? { [query.sortBy]: query.sortOrder || "desc" }
				: { createdAt: "desc" },
		}),
		prisma.bloodRequest.count({ where: whereConditions }),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: requests,
	};
};

const getBloodRequestById = async (id: string) => {
	const request = await prisma.bloodRequest.findUnique({
		where: { id },
		include: {
			requester: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			matches: {
				include: {
					donor: {
						select: {
							id: true,
							name: true,
							email: true,
							donorProfile: true,
						},
					},
				},
			},
		},
	});

	if (!request || request.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
	}

	return request;
};

const updateBloodRequest = async (
	id: string,
	userId: string,
	userRole: string,
	payload: IUpdateBloodRequestPayload,
) => {
	const request = await prisma.bloodRequest.findUnique({ where: { id } });

	if (!request || request.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
	}

	if (request.requesterId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
		throw new AppError(httpStatus.FORBIDDEN, "Not authorized to update this blood request");
	}

	const updated = await prisma.bloodRequest.update({
		where: { id },
		data: {
			patientName: payload.patientName || request.patientName,
			bloodGroup: payload.bloodGroup || request.bloodGroup,
			unitsNeeded: payload.unitsNeeded || request.unitsNeeded,
			hospitalName: payload.hospitalName || request.hospitalName,
			hospitalAddress: payload.hospitalAddress || request.hospitalAddress,
			city: payload.city || request.city,
			district: payload.district || request.district,
			urgency: payload.urgency || request.urgency,
			status: payload.status || request.status,
			neededBy: payload.neededBy ? new Date(payload.neededBy) : request.neededBy,
			additionalNotes: payload.additionalNotes ?? request.additionalNotes,
			isVerified:
				payload.isVerified !== undefined ? payload.isVerified : request.isVerified,
		},
	});

	return updated;
};

const deleteBloodRequest = async (id: string, userId: string, userRole: string) => {
	const request = await prisma.bloodRequest.findUnique({ where: { id } });

	if (!request || request.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
	}

	if (request.requesterId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
		throw new AppError(httpStatus.FORBIDDEN, "Not authorized to delete this request");
	}

	await prisma.bloodRequest.update({
		where: { id },
		data: {
			isDeleted: true,
			deletedAt: new Date(),
			status: "CANCELLED",
		},
	});

	return { message: "Blood request soft-deleted successfully" };
};

const getMyBloodRequests = async (userId: string) => {
	const requests = await prisma.bloodRequest.findMany({
		where: { requesterId: userId, isDeleted: false },
		include: {
			matches: {
				include: {
					donor: {
						select: {
							id: true,
							name: true,
							donorProfile: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return requests;
};

const getCompatibleRequestsForDonor = async (userId: string) => {
	const donorProfile = await prisma.donorProfile.findUnique({
		where: { userId },
	});

	if (!donorProfile) {
		throw new AppError(httpStatus.NOT_FOUND, "Donor profile not found");
	}

	const compatibleGroups = donorCompatibilityMap[donorProfile.bloodGroup] || [
		donorProfile.bloodGroup,
	];

	const requests = await prisma.bloodRequest.findMany({
		where: {
			isDeleted: false,
			status: { in: ["PENDING", "VERIFIED"] },
			bloodGroup: { in: compatibleGroups },
		},
		include: {
			requester: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
		orderBy: [{ urgency: "asc" }, { createdAt: "desc" }],
	});

	return requests;
};

const acceptBloodRequest = async (requestId: string, donorUserId: string) => {
	// 1. Verify donor profile & eligibility (90-day cooldown check)
	const donorProfile = await prisma.donorProfile.findUnique({
		where: { userId: donorUserId },
	});

	if (!donorProfile) {
		throw new AppError(httpStatus.NOT_FOUND, "Donor profile not found");
	}

	if (!donorProfile.isAvailable) {
		throw new AppError(httpStatus.BAD_REQUEST, "Donor availability is currently set to UNAVAILABLE.");
	}

	const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
	if (donorProfile.lastDonationDate && donorProfile.lastDonationDate > ninetyDaysAgo) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Donor is not eligible yet. Last donation was on ${donorProfile.lastDonationDate.toISOString().split("T")[0]}. Must wait 90 days between donations.`,
		);
	}

	// 2. Execute DB Transaction with Concurrency Lock to prevent duplicate donor assignment
	const result = await prisma.$transaction(async (tx) => {
		const request = await tx.bloodRequest.findUnique({
			where: { id: requestId },
			include: { matches: true },
		});

		if (!request || request.isDeleted) {
			throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
		}

		if (request.status === "FULFILLED" || request.status === "CANCELLED") {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				`Cannot accept request. Current status is ${request.status}.`,
			);
		}

		// Check if donor already assigned
		const existingAssignment = request.matches.find(
			(match) => match.donorId === donorUserId,
		);

		if (existingAssignment && existingAssignment.status === "ACCEPTED") {
			throw new AppError(httpStatus.CONFLICT, "You have already accepted this blood request.");
		}

		// Check if request accepted units limit reached
		const acceptedCount = request.matches.filter(
			(match) => match.status === "ACCEPTED",
		).length;

		if (acceptedCount >= request.unitsNeeded) {
			throw new AppError(
				httpStatus.CONFLICT,
				"This blood request has already reached its required donor quota.",
			);
		}

		// Create or update donor assignment
		const assignment = await tx.donorAssignment.upsert({
			where: {
				requestId_donorId: {
					requestId,
					donorId: donorUserId,
				},
			},
			update: {
				status: "ACCEPTED",
				respondedAt: new Date(),
			},
			create: {
				requestId,
				donorId: donorUserId,
				status: "ACCEPTED",
				respondedAt: new Date(),
			},
		});

		// Update Blood Request status to MATCHED
		const updatedRequest = await tx.bloodRequest.update({
			where: { id: requestId },
			data: { status: "MATCHED" },
		});

		return { assignment, updatedRequest };
	});

	return result;
};

const completeBloodDonation = async (
	requestId: string,
	donorUserId: string,
	requesterId: string,
	userRole: string,
) => {
	const request = await prisma.bloodRequest.findUnique({
		where: { id: requestId },
		include: { matches: true },
	});

	if (!request || request.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Blood request not found");
	}

	if (
		request.requesterId !== requesterId &&
		userRole !== "ADMIN" &&
		userRole !== "SUPER_ADMIN"
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Not authorized to mark this donation as completed",
		);
	}

	// Transaction to complete assignment, update donor stats, mark request FULFILLED
	const result = await prisma.$transaction(async (tx) => {
		const assignment = await tx.donorAssignment.update({
			where: {
				requestId_donorId: {
					requestId,
					donorId: donorUserId,
				},
			},
			data: {
				status: "COMPLETED",
				completedAt: new Date(),
			},
		});

		// Update Donor Profile stats & last donation date
		await tx.donorProfile.update({
			where: { userId: donorUserId },
			data: {
				lastDonationDate: new Date(),
				totalDonations: { increment: 1 },
			},
		});

		// Check total completed
		const completedMatches = await tx.donorAssignment.count({
			where: { requestId, status: "COMPLETED" },
		});

		let updatedRequest = request;
		if (completedMatches >= request.unitsNeeded) {
			updatedRequest = await tx.bloodRequest.update({
				where: { id: requestId },
				data: { status: "FULFILLED" },
				include: { matches: true },
			});
		}

		return { assignment, updatedRequest };
	});

	return result;
};

export const BloodRequestService = {
	createBloodRequest,
	getAllBloodRequests,
	getBloodRequestById,
	updateBloodRequest,
	deleteBloodRequest,
	getMyBloodRequests,
	getCompatibleRequestsForDonor,
	acceptBloodRequest,
	completeBloodDonation,
};
