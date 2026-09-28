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

  const glossaryCount = [tables.term, tables.likes, tables.bookmarks].filter(Boolean).length;
  const glossary = glossaryCount === 3 ? 'all' : glossaryCount === 0 ? 'none' : 'partial';
  console.log(JSON.stringify({ glossaryTables: { ...tables, state: glossary }, userCoverImageColumn: cover.exists }, null, 2));

  if (glossary === 'all') console.log('Glossary tables exist → if 20260429000000_add_glossary_term is pending, mark it applied with `prisma migrate resolve --applied`.');
  if (glossary === 'none') console.log('Glossary tables missing → `prisma migrate deploy` will create them.');
  if (glossary === 'partial') console.log('Glossary tables are PARTIAL → stop and inspect manually. Do not deploy migrations.');
}

main()
  .catch(error => { console.error('Check failed:', error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
