/*
  Warnings:

  - A unique constraint covering the columns `[displayId]` on the table `Delivery` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "displayId" TEXT;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_displayId_key" ON "Delivery"("displayId");
