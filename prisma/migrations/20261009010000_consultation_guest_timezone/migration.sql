-- Guest time zone at booking time, used to word emails/notifications in the guest's own clock.
ALTER TABLE "Consultation" ADD COLUMN "guestTimezone" TEXT;
