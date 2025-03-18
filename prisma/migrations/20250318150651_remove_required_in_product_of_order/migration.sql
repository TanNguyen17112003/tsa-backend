-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "product" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
