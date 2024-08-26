/*
  Warnings:

  - You are about to drop the column `name` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Sample` table. All the data in the column will be lost.
  - Added the required column `content` to the `Sample` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "Sample" DROP COLUMN "name",
DROP COLUMN "status",
DROP COLUMN "type",
DROP COLUMN "version",
ADD COLUMN     "content" VARCHAR(255) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
