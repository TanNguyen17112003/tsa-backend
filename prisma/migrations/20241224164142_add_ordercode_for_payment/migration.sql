/*
  Warnings:

  - A unique constraint covering the columns `[orderCode]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderCode` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "orderCode" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderCode_key" ON "Payment"("orderCode");
