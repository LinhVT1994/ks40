import { getArticlesAction } from './src/features/articles/actions/article';

async function test() {
  console.log('Starting search...');
  try {
    const result = await getArticlesAction({ search: 'test', limit: 5 });
    console.log('Search result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Search error:', error);
  }
}

test();
