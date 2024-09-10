/*
  Warnings:

  - Added the required column `createdAt` to the `Delivery` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "acceptedAt" VARCHAR(255),
ADD COLUMN     "createdAt" VARCHAR(255) NOT NULL,
ALTER COLUMN "deliveryAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
