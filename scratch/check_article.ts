import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const article = await prisma.article.findUnique({
    where: { slug: 'claude2' },
    include: { author: true, topic: true, tags: { include: { tag: true } } }
  });
  console.log(JSON.stringify(article, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
