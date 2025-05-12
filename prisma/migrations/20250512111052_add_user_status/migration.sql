/*
  Warnings:

  - You are about to drop the column `status` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Student` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserStatus" ADD VALUE 'DEACTIVATED';
ALTER TYPE "UserStatus" ADD VALUE 'BANNED';

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "status",
ADD COLUMN     "numberFault" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'AVAILABLE';
