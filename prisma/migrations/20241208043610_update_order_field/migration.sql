/*
  Warnings:

  - You are about to drop the column `adminId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `ordinalNumber` on the `Order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_orderId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "adminId",
DROP COLUMN "ordinalNumber";

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
