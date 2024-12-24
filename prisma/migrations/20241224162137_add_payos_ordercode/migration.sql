-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "payOsOrderCode" INTEGER;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
