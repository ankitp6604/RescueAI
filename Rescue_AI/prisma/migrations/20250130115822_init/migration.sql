-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('POLICE', 'FIRE', 'HOSPITAL');

-- CreateEnum
CREATE TYPE "EmergencyType" AS ENUM ('POLICE', 'FIRE', 'MEDICAL');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('OPEN', 'ASSIGNED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING', 'UNIT_ASSIGNED', 'COMPLETED');

-- CreateTable
CREATE TABLE "EmergencyFacility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FacilityType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emergency" (
    "id" TEXT NOT NULL,
    "type" "EmergencyType" NOT NULL,
    "priority" INTEGER NOT NULL,
    "callerName" TEXT NOT NULL,
    "callerNumber" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "transcript" TEXT NOT NULL,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Emergency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "emergencyId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'PENDING',
    "assignedUnit" TEXT,
    "estimatedArrival" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_emergencyId_fkey" FOREIGN KEY ("emergencyId") REFERENCES "Emergency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "EmergencyFacility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
