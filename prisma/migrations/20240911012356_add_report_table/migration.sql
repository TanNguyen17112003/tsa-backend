/*
  Warnings:

  - Added the required column `createdAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REPLIED');

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- CreateTable
CREATE TABLE "Report" (
    "orderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reportedAt" VARCHAR(255) NOT NULL,
    "proof" VARCHAR(255) NOT NULL,
    "reply" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Report_pkey" PRIMARY KEY ("orderId")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
