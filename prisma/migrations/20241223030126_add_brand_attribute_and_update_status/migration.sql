-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "brand" VARCHAR(255);

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
