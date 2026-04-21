import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function MyProfilePage() {
  const session = await auth();
  const userId   = session?.user?.id;
  const username = (session?.user as { username?: string | null })?.username;

  if (!userId) {
    redirect('/login');
  }

  redirect('/me');
}
