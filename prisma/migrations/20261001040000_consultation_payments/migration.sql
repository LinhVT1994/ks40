-- Paid consultations: guests transfer to the system bank account with a generated code,
-- an admin confirms the transfer, then the host is asked.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONSULTATION_PAID';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONSULTATION_PAYMENT_REPORTED';
ALTER TYPE "ConsultationStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT' BEFORE 'PENDING';

ALTER TABLE "ConsultationSettings" ADD COLUMN "price" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ConsultationSettings" ADD CONSTRAINT "ConsultationSettings_price_check" CHECK ("price" >= 0);

ALTER TABLE "Consultation" ADD COLUMN "price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "paymentCode" TEXT,
ADD COLUMN "paymentReportedAt" TIMESTAMP(3),
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "paymentConfirmedById" TEXT,
ADD COLUMN "refundedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Consultation_paymentCode_key" ON "Consultation"("paymentCode");

-- A held (awaiting payment) slot blocks the slot too. The new enum value can't be referenced in the
-- same transaction it was added in, so the predicate lists the inactive statuses instead.
DROP INDEX "Consultation_active_host_slot_key";
CREATE UNIQUE INDEX "Consultation_active_host_slot_key" ON "Consultation"("hostId", "startAt") WHERE "status" NOT IN ('DECLINED', 'CANCELLED');
