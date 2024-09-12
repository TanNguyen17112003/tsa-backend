/*
  Warnings:

  - You are about to drop the column `verified` on the `Order` table. All the data in the column will be lost.
  - Added the required column `checkCode` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "verified",
ADD COLUMN     "checkCode" VARCHAR(255) NOT NULL,
ALTER COLUMN "ordinalNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
