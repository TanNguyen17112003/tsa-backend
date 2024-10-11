-- DropForeignKey
ALTER TABLE "AuthProvider" DROP CONSTRAINT "AuthProvider_uid_fkey";

-- DropForeignKey
ALTER TABLE "Credentials" DROP CONSTRAINT "Credentials_uid_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- AddForeignKey
ALTER TABLE "Credentials" ADD CONSTRAINT "Credentials_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthProvider" ADD CONSTRAINT "AuthProvider_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
