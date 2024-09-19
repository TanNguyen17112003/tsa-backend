/*
  Warnings:

  - The values [SHIPPER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `shipperId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Shipper` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ordinalNumber` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ACCEPTED', 'SUCCESS');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('AVAILABLE', 'BUSY');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'CUSTOMER', 'STAFF');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_shipperId_fkey";

-- DropForeignKey
ALTER TABLE "Shipper" DROP CONSTRAINT "Shipper_shipperId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "shipperId",
ADD COLUMN     "building" VARCHAR(20),
ADD COLUMN     "deliveryId" TEXT,
ADD COLUMN     "ordinalNumber" SMALLINT NOT NULL,
ADD COLUMN     "room" VARCHAR(20),
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "deliveredAt" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "cancelledAt" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "rejectedAt" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "acceptedAt" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "status" "StaffStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- DropTable
DROP TABLE "Shipper";

-- CreateTable
CREATE TABLE "Delivery" (
    "deliveryId" TEXT NOT NULL,
    "deliveryAt" VARCHAR(255) NOT NULL,
    "limitTime" VARCHAR(255) NOT NULL,
    "delayTime" VARCHAR(255),
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "shipperId" VARCHAR(255),

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("deliveryId")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("deliveryId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "Staff"("staffId") ON DELETE SET NULL ON UPDATE CASCADE;
