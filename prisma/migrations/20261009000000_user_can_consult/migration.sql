-- Only admins may let a user host consultations.
ALTER TABLE "User" ADD COLUMN "canConsult" BOOLEAN NOT NULL DEFAULT false;

-- Keep hosts who already turned bookings on, so their open schedules don't vanish.
UPDATE "User" SET "canConsult" = true
WHERE "id" IN (SELECT "userId" FROM "ConsultationSettings" WHERE "enabled" = true);
