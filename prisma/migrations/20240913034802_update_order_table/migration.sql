/*
  Warnings:

  - The values [CANCELLED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'DELIVERED', 'CANCELED', 'IN_TRANSPORT');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "rejectReason" TEXT;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "replierId" VARCHAR(255);

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_replierId_fkey" FOREIGN KEY ("replierId") REFERENCES "Admin"("adminId") ON DELETE SET NULL ON UPDATE CASCADE;
