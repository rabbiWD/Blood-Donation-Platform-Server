import type { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import type {
	IDonorSearchQuery,
	IUpdateDonorProfilePayload,
	IUpdateUserProfilePayload,
} from "./user.interface";
import { cloudinary } from "../../lib/cloudinary";
import { UploadApiResponse } from "cloudinary";

const updateMyProfile = async (
	userId: string,
	payload: IUpdateUserProfilePayload,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { patientProfile: true, donorProfile: true },
	});

	if (!user || user.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "User profile not found");
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			name: payload.name || user.name,
			...(user.role === "PATIENT" && user.patientProfile
				? {
						patientProfile: {
							update: {
								contactNumber: payload.contactNumber ?? user.patientProfile.contactNumber,
								address: payload.address ?? user.patientProfile.address,
								hospitalName: payload.hospitalName ?? user.patientProfile.hospitalName,
							},
						},
				  }
				: {}),
		},
		include: {
			donorProfile: true,
			patientProfile: true,
		},
	});

	const { password: _, ...result } = updatedUser;
	return result;
};

const updateDonorProfile = async (
	userId: string,
	payload: IUpdateDonorProfilePayload,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { donorProfile: true },
	});

	if (user?.role !== "DONOR") {
		throw new AppError(httpStatus.FORBIDDEN, "Only donors can update donor profiles");
	}

	if (!user.donorProfile) {
		throw new AppError(httpStatus.NOT_FOUND, "Donor profile does not exist for this account");
	}

	const updatedDonorProfile = await prisma.donorProfile.update({
		where: { userId },
		data: {
			bloodGroup: payload.bloodGroup || user.donorProfile.bloodGroup,
			contactNumber: payload.contactNumber || user.donorProfile.contactNumber,
			address: payload.address || user.donorProfile.address,
			city: payload.city || user.donorProfile.city,
			district: payload.district || user.donorProfile.district,
			isAvailable:
				payload.isAvailable !== undefined
					? payload.isAvailable
					: user.donorProfile.isAvailable,
			lastDonationDate: payload.lastDonationDate
				? new Date(payload.lastDonationDate)
				: user.donorProfile.lastDonationDate,
		},
	});

	return updatedDonorProfile;
};

const getEligibleDonors = async (query: IDonorSearchQuery) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;
	const skip = (page - 1) * limit;

	const whereConditions: Prisma.DonorProfileWhereInput = {
		user: {
			status: "ACTIVE",
			isDeleted: false,
		},
	};

	if (query.bloodGroup) {
		whereConditions.bloodGroup = query.bloodGroup;
	}

	if (query.city) {
		whereConditions.city = { contains: query.city, mode: "insensitive" };
	}

	if (query.district) {
		whereConditions.district = { contains: query.district, mode: "insensitive" };
	}

	if (query.isAvailable !== undefined) {
		whereConditions.isAvailable = query.isAvailable === "true";
	}

	if (query.search) {
		whereConditions.OR = [
			{ city: { contains: query.search, mode: "insensitive" } },
			{ district: { contains: query.search, mode: "insensitive" } },
			{ address: { contains: query.search, mode: "insensitive" } },
			{ user: { name: { contains: query.search, mode: "insensitive" } } },
		];
	}

	const [donors, total] = await Promise.all([
		prisma.donorProfile.findMany({
			where: whereConditions,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
						status: true,
					},
				},
			},
			skip,
			take: limit,
			orderBy: query.sortBy
				? { [query.sortBy]: query.sortOrder || "desc" }
				: { createdAt: "desc" },
		}),
		prisma.donorProfile.count({ where: whereConditions }),
	]);

	// Enrich with eligibility flag (90 days cooldown check)
	const now = new Date();
	const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

	const enrichedDonors = donors.map((donor) => {
		const isEligibleByDate =
			!donor.lastDonationDate || donor.lastDonationDate <= ninetyDaysAgo;
		return {
			...donor,
			isEligibleToDonate: donor.isAvailable && isEligibleByDate,
		};
	});

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: enrichedDonors,
	};
};

const uploadProfileImage = async(buffer: Buffer, userId: string)=>{

    const currentUser = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            profileImage: true,
            imagePublicId: true
        }
    })
  
const clodinaryResult = await new Promise<UploadApiResponse> ((resolve, reject) => {
    cloudinary.uploader.upload_stream(
        {
        resource_type: "auto",
       },


       async(error, result) => {
        if(error){
            return reject(error)
        }

        if(!result){
            return reject(new Error("No result returned from Cloudinary"))
        }

        resolve(result)

        
        
       }
).end(buffer)
})

const updateUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                profileImage: clodinaryResult?.secure_url,
                imagePublicId: clodinaryResult?.public_id
            },

            omit: {
                password: true,
            }
      });

      if(currentUser?.imagePublicId && currentUser.profileImage){
        await cloudinary.uploader.destroy(currentUser.imagePublicId)
      }
   

      return updateUser

}

export const UserService = {
	updateMyProfile,
	updateDonorProfile,
	getEligibleDonors,
	uploadProfileImage,
};
