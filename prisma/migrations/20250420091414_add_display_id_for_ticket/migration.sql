/*
  Warnings:

  - A unique constraint covering the columns `[displayId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "displayId" TEXT;

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_displayId_key" ON "Ticket"("displayId");
