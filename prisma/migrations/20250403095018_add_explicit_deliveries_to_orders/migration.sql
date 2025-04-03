/*
  Warnings:

  - You are about to drop the `_DeliveryToOrder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DeliveryToOrder" DROP CONSTRAINT "_DeliveryToOrder_A_fkey";

-- DropForeignKey
ALTER TABLE "_DeliveryToOrder" DROP CONSTRAINT "_DeliveryToOrder_B_fkey";

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- DropTable
DROP TABLE "_DeliveryToOrder";

-- CreateTable
CREATE TABLE "OrdersOnDeliveries" (
    "orderId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "orderSequence" INTEGER NOT NULL,

    CONSTRAINT "OrdersOnDeliveries_pkey" PRIMARY KEY ("deliveryId","orderId")
);

-- AddForeignKey
ALTER TABLE "OrdersOnDeliveries" ADD CONSTRAINT "OrdersOnDeliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdersOnDeliveries" ADD CONSTRAINT "OrdersOnDeliveries_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
