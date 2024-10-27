-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photoUrl" VARCHAR(500);

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
