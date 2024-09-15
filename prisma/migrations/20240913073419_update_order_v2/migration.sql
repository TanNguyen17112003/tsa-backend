/*
  Warnings:

  - You are about to drop the column `staffId` on the `Order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_staffId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "staffId",
ADD COLUMN     "adminId" VARCHAR(255),
ADD COLUMN     "shipperId" VARCHAR(255);

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "studentId" VARCHAR(255);

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "Staff"("staffId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE SET NULL ON UPDATE CASCADE;
