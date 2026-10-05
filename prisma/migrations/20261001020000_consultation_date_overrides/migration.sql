-- Per-date availability overrides replace the blocked-dates list.
ALTER TABLE "ConsultationSettings" ADD COLUMN "dateOverrides" JSONB NOT NULL DEFAULT '{}';

-- Carry existing blocked dates over as "day off" overrides.
UPDATE "ConsultationSettings"
SET "dateOverrides" = (SELECT COALESCE(jsonb_object_agg(d, '[]'::jsonb), '{}'::jsonb) FROM unnest("blockedDates") AS d)
WHERE cardinality("blockedDates") > 0;

ALTER TABLE "ConsultationSettings" DROP COLUMN "blockedDates";
