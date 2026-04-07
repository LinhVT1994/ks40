import { db } from './lib/db';

async function checkTags() {
  try {
    const tags = await db.tag.findMany({
      include: {
        _count: {
          select: { articles: true }
        }
      }
    });
    console.log('--- TAGS ---');
    console.log('Total Tags:', tags.length);
    tags.forEach(t => console.log(`Tag: ${t.name} (slug: ${t.slug}), Articles: ${t._count.articles}`));

    const articles = await db.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true, slug: true, audience: true, tags: { include: { tag: true } } }
    });
    console.log('\n--- PUBLISHED ARTICLES ---');
    console.log('Total Published Articles:', articles.length);
    articles.forEach(a => {
      console.log(`Article: ${a.title} (${a.audience}), Tags: ${a.tags.map(at => at.tag.slug).join(', ')}`);
    });
  } catch (err) {
    console.error('Prisma Error:', err);
  } finally {
    await db.$disconnect();
  }
}

checkTags();
