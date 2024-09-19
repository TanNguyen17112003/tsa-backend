-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_studentId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "weight" DOUBLE PRECISION,
ALTER COLUMN "shippingFee" DROP NOT NULL,
ALTER COLUMN "studentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE SET NULL ON UPDATE CASCADE;
