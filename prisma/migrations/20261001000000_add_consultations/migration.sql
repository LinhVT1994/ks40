-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONSULTATION_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONSULTATION_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONSULTATION_DECLINED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONSULTATION_CANCELLED';

-- CreateTable
CREATE TABLE "ConsultationSettings" (
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "intro" TEXT,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "meetingUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "weeklySlots" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'PENDING',
    "declineReason" TEXT,
    "cancelledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consultation_hostId_startAt_idx" ON "Consultation"("hostId", "startAt");

-- CreateIndex
CREATE INDEX "Consultation_guestId_startAt_idx" ON "Consultation"("guestId", "startAt");

-- AddForeignKey
ALTER TABLE "ConsultationSettings" ADD CONSTRAINT "ConsultationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Only one active (pending/confirmed) booking per host and start time; declined/cancelled rows don't block rebooking.
CREATE UNIQUE INDEX "Consultation_active_host_slot_key" ON "Consultation"("hostId", "startAt") WHERE "status" IN ('PENDING', 'CONFIRMED');

ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_time_range_check" CHECK ("endAt" > "startAt");

