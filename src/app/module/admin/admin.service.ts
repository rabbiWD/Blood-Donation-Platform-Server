import type { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import type {
	IAdminUserQuery,
	IUpdateUserRolePayload,
	IUpdateUserStatusPayload,
} from "./admin.interface";

const getAllUsers = async (query: IAdminUserQuery) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const whereConditions: Prisma.UserWhereInput = {
		isDeleted: false,
	};

	if (query.role) {
		whereConditions.role = query.role;
	}

	if (query.status) {
		whereConditions.status = query.status;
	}

	if (query.search) {
		whereConditions.OR = [
			{ name: { contains: query.search, mode: "insensitive" } },
			{ email: { contains: query.search, mode: "insensitive" } },
		];
	}

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where: whereConditions,
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				status: true,
				createdAt: true,
				donorProfile: true,
				patientProfile: true,
			},
			skip,
			take: limit,
			orderBy: query.sortBy
				? { [query.sortBy]: query.sortOrder || "desc" }
				: { createdAt: "desc" },
		}),
		prisma.user.count({ where: whereConditions }),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: users,
	};
};

const updateUserStatus = async (
	adminUserId: string,
	targetUserId: string,
	payload: IUpdateUserStatusPayload,
) => {
	const user = await prisma.user.findUnique({ where: { id: targetUserId } });
	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User to moderate not found");
	}

	const updatedUser = await prisma.user.update({
		where: { id: targetUserId },
		data: {
			status: payload.status,
			...(payload.status === "DELETED"
				? { isDeleted: true, deletedAt: new Date() }
				: {}),
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			isDeleted: true,
		},
	});

	// Create Audit Log
	await prisma.auditLog.create({
		data: {
			userId: adminUserId,
			action: "USER_STATUS_UPDATED",
			details: `Admin ${adminUserId} changed status of user ${targetUserId} (${user.email}) to ${payload.status}`,
		},
	});

	return updatedUser;
};

const updateUserRole = async (
	adminUserId: string,
	targetUserId: string,
	payload: IUpdateUserRolePayload,
) => {
	const user = await prisma.user.findUnique({ where: { id: targetUserId } });
	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "Target user not found");
	}

	const updatedUser = await prisma.user.update({
		where: { id: targetUserId },
		data: { role: payload.role },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
		},
	});

	// Create Audit Log
	await prisma.auditLog.create({
		data: {
			userId: adminUserId,
			action: "USER_ROLE_UPDATED",
			details: `Admin ${adminUserId} updated role of user ${targetUserId} (${user.email}) to ${payload.role}`,
		},
	});

	return updatedUser;
};

const getDashboardStats = async () => {
	const [
		totalUsers,
		totalDonors,
		totalPatients,
		totalRequests,
		fulfilledRequests,
		pendingRequests,
		matchedRequests,
		totalPayments,
		paidPaymentsTotal,
		bloodGroupSupply,
	] = await Promise.all([
		prisma.user.count({ where: { isDeleted: false } }),
		prisma.user.count({ where: { role: "DONOR", isDeleted: false } }),
		prisma.user.count({ where: { role: "PATIENT", isDeleted: false } }),
		prisma.bloodRequest.count({ where: { isDeleted: false } }),
		prisma.bloodRequest.count({ where: { status: "FULFILLED", isDeleted: false } }),
		prisma.bloodRequest.count({ where: { status: "PENDING", isDeleted: false } }),
		prisma.bloodRequest.count({ where: { status: "MATCHED", isDeleted: false } }),
		prisma.payment.count(),
		prisma.payment.aggregate({
			_sum: { amount: true },
			where: { status: "PAID" },
		}),
		prisma.donorProfile.groupBy({
			by: ["bloodGroup"],
			_count: { id: true },
		}),
	]);

	const fulfillmentRate =
		totalRequests > 0
			? Number(((fulfilledRequests / totalRequests) * 100).toFixed(2))
			: 0;

	return {
		users: {
			total: totalUsers,
			donors: totalDonors,
			patients: totalPatients,
		},
		bloodRequests: {
			total: totalRequests,
			fulfilled: fulfilledRequests,
			pending: pendingRequests,
			matched: matchedRequests,
			fulfillmentRatePercentage: `${fulfillmentRate}%`,
		},
		financials: {
			totalTransactions: totalPayments,
			totalRevenueCollected: paidPaymentsTotal._sum.amount || 0,
		},
		bloodGroupSupplyDistribution: bloodGroupSupply.map((item) => ({
			bloodGroup: item.bloodGroup,
			count: item._count.id,
		})),
	};
};

const getAuditLogs = async (page = 1, limit = 20) => {
	const skip = (page - 1) * limit;

	const [logs, total] = await Promise.all([
		prisma.auditLog.findMany({
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
					},
				},
			},
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		}),
		prisma.auditLog.count(),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: logs,
	};
};

export const AdminService = {
	getAllUsers,
	updateUserStatus,
	updateUserRole,
	getDashboardStats,
	getAuditLogs,
};
