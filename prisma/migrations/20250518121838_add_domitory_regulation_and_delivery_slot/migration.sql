-- CreateTable
CREATE TABLE "DormitoryRegulation" (
    "id" TEXT NOT NULL,
    "name" "Dormitory" NOT NULL,
    "banThreshold" INTEGER NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DormitoryRegulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowedDeliverySlot" (
    "id" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllowedDeliverySlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DormitoryRegulation_name_key" ON "DormitoryRegulation"("name");

-- AddForeignKey
ALTER TABLE "AllowedDeliverySlot" ADD CONSTRAINT "AllowedDeliverySlot_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "DormitoryRegulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
