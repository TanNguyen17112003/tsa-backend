/*
  Warnings:

  - You are about to drop the column `otp` on the `VerificationEmail` table. All the data in the column will be lost.
  - Added the required column `token` to the `VerificationEmail` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Dormitory" AS ENUM ('A', 'B');

-- AlterTable
ALTER TABLE "Credentials" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "building" TEXT,
ADD COLUMN     "dormitory" "Dormitory",
ADD COLUMN     "room" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "phoneNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VerificationEmail" DROP COLUMN "otp",
ADD COLUMN     "token" TEXT NOT NULL,
ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
