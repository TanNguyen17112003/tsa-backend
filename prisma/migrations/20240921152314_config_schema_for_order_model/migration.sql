/*
  Warnings:

  - You are about to drop the column `building` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT', 'CASH', 'MOMO');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "building",
DROP COLUMN "room",
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
