-- AlterTable
ALTER TABLE "DeliveryStatusHistory" ADD COLUMN     "canceledImage" VARCHAR(255);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "finishedImage" VARCHAR(255);

-- AlterTable
ALTER TABLE "OrderStatusHistory" ADD COLUMN     "canceledImage" VARCHAR(255);

-- AlterTable
ALTER TABLE "VerificationEmail" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '3 minutes';
