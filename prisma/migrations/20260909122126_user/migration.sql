/*
  Warnings:

  - The values [DOCTOR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `patients` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('CRITICAL', 'HIGH', 'STANDARD');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'VERIFIED', 'MATCHED', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('STRIPE', 'BKASH', 'SSLCOMMERZ');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DONOR', 'PATIENT');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PATIENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "patients" DROP CONSTRAINT "patients_userId_fkey";

-- DropTable
DROP TABLE "patients";

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood_requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "unitsNeeded" INTEGER NOT NULL DEFAULT 1,
    "hospitalName" TEXT NOT NULL,
    "hospitalAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'STANDARD',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "neededBy" TIMESTAMP(3) NOT NULL,
    "additionalNotes" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blood_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_assignments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "lastDonationDate" TIMESTAMP(3),
    "totalDonations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactNumber" TEXT,
    "address" TEXT,
    "hospitalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "gateway" "PaymentGateway" NOT NULL DEFAULT 'STRIPE',
    "transactionId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blood_requests_bloodGroup_status_urgency_idx" ON "blood_requests"("bloodGroup", "status", "urgency");

-- CreateIndex
CREATE INDEX "blood_requests_city_district_idx" ON "blood_requests"("city", "district");

-- CreateIndex
CREATE INDEX "donor_assignments_donorId_status_idx" ON "donor_assignments"("donorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "donor_assignments_requestId_donorId_key" ON "donor_assignments"("requestId", "donorId");

-- CreateIndex
CREATE UNIQUE INDEX "donor_profiles_userId_key" ON "donor_profiles"("userId");

-- CreateIndex
CREATE INDEX "donor_profiles_bloodGroup_isAvailable_lastDonationDate_idx" ON "donor_profiles"("bloodGroup", "isAvailable", "lastDonationDate");

-- CreateIndex
CREATE INDEX "donor_profiles_city_district_idx" ON "donor_profiles"("city", "district");

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_userId_key" ON "patient_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_userId_status_idx" ON "payments"("userId", "status");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_requests" ADD CONSTRAINT "blood_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_assignments" ADD CONSTRAINT "donor_assignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "blood_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_assignments" ADD CONSTRAINT "donor_assignments_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "blood_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
