/*
  Warnings:

  - Made the column `displayId` on table `Delivery` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Delivery" ALTER COLUMN "displayId" SET NOT NULL;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
