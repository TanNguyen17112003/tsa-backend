/*
  Warnings:

  - You are about to drop the column `acceptedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `cancelReason` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `deliveredAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `rejectReason` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[latestStatusId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `product` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "acceptedAt",
DROP COLUMN "address",
DROP COLUMN "cancelReason",
DROP COLUMN "cancelledAt",
DROP COLUMN "createdAt",
DROP COLUMN "deliveredAt",
DROP COLUMN "rejectReason",
DROP COLUMN "rejectedAt",
DROP COLUMN "status",
ADD COLUMN     "building" VARCHAR(255),
ADD COLUMN     "deliveryDate" TEXT,
ADD COLUMN     "dormitory" "Dormitory",
ADD COLUMN     "latestStatusId" VARCHAR(255),
ADD COLUMN     "phone" VARCHAR(15),
ADD COLUMN     "product" VARCHAR(255) NOT NULL,
ADD COLUMN     "room" VARCHAR(255);

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" VARCHAR(255) NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "reason" TEXT,
    "time" VARCHAR(255) NOT NULL,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_latestStatusId_key" ON "Order"("latestStatusId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_latestStatusId_fkey" FOREIGN KEY ("latestStatusId") REFERENCES "OrderStatusHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
