'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function getAuthorInfoAction(authorId: string) {
  const session = await auth();
  const userId  = session?.user?.id;

  const [author, followerCount, articleCount, isFollowing] = await Promise.all([
    db.user.findUnique({
      where:  { id: authorId },
      select: { id: true, name: true, image: true, bio: true },
    }),
    db.follow.count({ where: { followingId: authorId } }),
    db.article.count({ where: { authorId, status: 'PUBLISHED' } }),
    userId ? db.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: authorId } } }) : null,
  ]);

  if (!author) return null;
  return { ...author, followerCount, articleCount, isFollowing: !!isFollowing };
}

export async function toggleFollowAction(authorId: string): Promise<{ success: boolean; isFollowing: boolean; followerCount: number }> {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return { success: false, isFollowing: false, followerCount: 0 };
  if (userId === authorId) return { success: false, isFollowing: false, followerCount: 0 };

  const existing = await db.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: authorId } } });

  if (existing) {
    await db.follow.delete({ where: { followerId_followingId: { followerId: userId, followingId: authorId } } });
  } else {
    await db.follow.create({ data: { followerId: userId, followingId: authorId } });
  }

  const followerCount = await db.follow.count({ where: { followingId: authorId } });
  return { success: true, isFollowing: !existing, followerCount };
}
