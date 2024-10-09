/*
  Warnings:

  - The primary key for the `Delivery` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `acceptedAt` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `delayTime` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryAt` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryId` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `shipperId` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryId` on the `Order` table. All the data in the column will be lost.
  - The required column `id` was added to the `Delivery` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Changed the type of `limitTime` on the `Delivery` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeliveryStatus" ADD VALUE 'FINISHED';
ALTER TYPE "DeliveryStatus" ADD VALUE 'CANCELED';

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_shipperId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_deliveryId_fkey";

-- AlterTable
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_pkey",
DROP COLUMN "acceptedAt",
DROP COLUMN "delayTime",
DROP COLUMN "deliveryAt",
DROP COLUMN "deliveryId",
DROP COLUMN "shipperId",
DROP COLUMN "status",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "staffId" VARCHAR(255),
DROP COLUMN "limitTime",
ADD COLUMN     "limitTime" INTEGER NOT NULL,
ADD CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryId";

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- CreateTable
CREATE TABLE "DeliveryStatusHistory" (
    "id" TEXT NOT NULL,
    "deliveryId" VARCHAR(255) NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "reason" TEXT,
    "time" VARCHAR(255) NOT NULL,

    CONSTRAINT "DeliveryStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DeliveryToOrder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DeliveryToOrder_AB_unique" ON "_DeliveryToOrder"("A", "B");

-- CreateIndex
CREATE INDEX "_DeliveryToOrder_B_index" ON "_DeliveryToOrder"("B");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("staffId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryStatusHistory" ADD CONSTRAINT "DeliveryStatusHistory_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeliveryToOrder" ADD CONSTRAINT "_DeliveryToOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeliveryToOrder" ADD CONSTRAINT "_DeliveryToOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
