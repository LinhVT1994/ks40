import 'server-only';
import { auth } from '@/auth';

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN' || session.user.status === 'LOCKED') {
    throw new Error('Unauthorized');
  }
  return session.user;
}
