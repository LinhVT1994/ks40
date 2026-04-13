import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function MyProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  redirect(`/profile/${userId}`);
}
