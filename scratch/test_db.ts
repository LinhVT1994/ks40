import { db } from './src/lib/db';

async function test() {
  try {
    const count = await db.articleAnnotation.count();
    console.log('ArticleAnnotation count:', count);
  } catch (err) {
    console.error('Error accessing articleAnnotation:', err);
  } finally {
    process.exit();
  }
}

test();
