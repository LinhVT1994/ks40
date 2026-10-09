/** Read-only check before `prisma migrate deploy`. Does not print credentials or change the DB. */
import 'dotenv/config';
import { db } from '../src/lib/db';

async function main() {
  const [tables] = await db.$queryRaw<{ term: boolean; likes: boolean; bookmarks: boolean }[]>`
    SELECT to_regclass('public."GlossaryTerm"') IS NOT NULL     AS term,
           to_regclass('public."GlossaryLike"') IS NOT NULL     AS likes,
           to_regclass('public."GlossaryBookmark"') IS NOT NULL AS bookmarks`;
  const [cover] = await db.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'coverImage') AS exists`;

  // Consultation booking (20261001000000…20261009010000): tables + the last column each migration adds.
  const [consult] = await db.$queryRaw<{ settings: boolean; bookings: boolean; dateOverrides: boolean; meetingUrl: boolean; payments: boolean; canConsult: boolean; guestTimezone: boolean }[]>`
    SELECT to_regclass('public."ConsultationSettings"') IS NOT NULL AS settings,
           to_regclass('public."Consultation"') IS NOT NULL         AS bookings,
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ConsultationSettings' AND column_name = 'dateOverrides') AS "dateOverrides",
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Consultation' AND column_name = 'meetingUrl')            AS "meetingUrl",
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Consultation' AND column_name = 'paymentCode')           AS payments,
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'canConsult')                AS "canConsult",
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Consultation' AND column_name = 'guestTimezone')        AS "guestTimezone"`;
  const consultCount = Object.values(consult).filter(Boolean).length;
  const consultations = consultCount === 7 ? 'all' : consultCount === 0 ? 'none' : 'partial';

  const glossaryCount = [tables.term, tables.likes, tables.bookmarks].filter(Boolean).length;
  const glossary = glossaryCount === 3 ? 'all' : glossaryCount === 0 ? 'none' : 'partial';
  console.log(JSON.stringify({ glossaryTables: { ...tables, state: glossary }, userCoverImageColumn: cover.exists, consultations: { ...consult, state: consultations } }, null, 2));

  if (glossary === 'all') console.log('Glossary tables exist → if 20260429000000_add_glossary_term is pending, mark it applied with `prisma migrate resolve --applied`.');
  if (glossary === 'none') console.log('Glossary tables missing → `prisma migrate deploy` will create them.');
  if (glossary === 'partial') console.log('Glossary tables are PARTIAL → stop and inspect manually. Do not deploy migrations.');
  if (consultations === 'none') console.log('Consultation tables missing → `prisma migrate deploy` will create them.');
  if (consultations === 'partial') console.log('Consultation schema is PARTIAL → compare with `prisma migrate status`; only pending consultation migrations (202610010x, 2026100900xx00) should be missing.');
}

main()
  .catch(error => { console.error('Check failed:', error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
