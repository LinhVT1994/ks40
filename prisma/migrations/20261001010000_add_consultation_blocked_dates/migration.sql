-- AlterTable
ALTER TABLE "ConsultationSettings" ADD COLUMN     "blockedDates" TEXT[] DEFAULT ARRAY[]::TEXT[];

