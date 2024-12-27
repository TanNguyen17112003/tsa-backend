-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "latestStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "numberOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
