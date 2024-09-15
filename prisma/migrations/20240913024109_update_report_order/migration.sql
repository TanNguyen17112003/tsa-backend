/*
  Warnings:

  - The primary key for the `Report` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `orderId` on the `Report` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - The required column `id` was added to the `Report` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_orderId_fkey";

-- AlterTable
ALTER TABLE "Report" DROP CONSTRAINT "Report_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "repliedAt" VARCHAR(255),
ALTER COLUMN "orderId" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "Report_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "createdAt" SET DEFAULT now();

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
