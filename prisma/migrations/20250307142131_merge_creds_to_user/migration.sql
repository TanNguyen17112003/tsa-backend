/*
  Warnings:

  - The `createdAt` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Credentials` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Credentials" DROP CONSTRAINT "Credentials_uid_fkey";

-- DropForeignKey
ALTER TABLE "VerificationEmail" DROP CONSTRAINT "VerificationEmail_userId_fkey";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" VARCHAR(50) NOT NULL,
ADD COLUMN     "password" VARCHAR(255),
DROP COLUMN "createdAt",
ADD COLUMN     "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes',
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3);

-- DropTable
DROP TABLE "Credentials";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "VerificationEmail" ADD CONSTRAINT "VerificationEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
