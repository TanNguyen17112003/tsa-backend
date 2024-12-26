-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "remainingAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "counterAccountBankName" VARCHAR(255),
ADD COLUMN     "counterAccountName" VARCHAR(255),
ADD COLUMN     "counterAccountNumber" VARCHAR(255);

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
