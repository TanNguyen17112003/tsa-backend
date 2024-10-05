/*
  Warnings:

  - You are about to drop the `Sample` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- DropTable
DROP TABLE "Sample";
