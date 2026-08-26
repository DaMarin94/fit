-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentGroup" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,

    CONSTRAINT "EquipmentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentGroupItem" (
    "id" TEXT NOT NULL,
    "equipmentGroupId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "EquipmentGroupItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EquipmentGroup" ADD CONSTRAINT "EquipmentGroup_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentGroupItem" ADD CONSTRAINT "EquipmentGroupItem_equipmentGroupId_fkey" FOREIGN KEY ("equipmentGroupId") REFERENCES "EquipmentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentGroupItem" ADD CONSTRAINT "EquipmentGroupItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
