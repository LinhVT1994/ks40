'use server';

import { db } from '@/lib/db';

const FOLLOWERS_PER_PAGE = 10;

/**
 * Lấy danh sách những người đang theo dõi một người dùng cụ thể (có phân trang)
 */
export async function getFollowersAction(userId: string, page: number = 1, limit: number = FOLLOWERS_PER_PAGE) {
  try {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      db.follow.findMany({
        where: {
          followingId: userId,
        },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
              _count: {
                select: {
                  articles: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      success: true,
      data: followers.map(f => ({
        id: f.follower.id,
        name: f.follower.name,
        image: f.follower.image,
        bio: f.follower.bio,
        articleCount: f.follower._count.articles,
      })),
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error fetching followers:', error);
    return { success: false, error: 'Không thể tải danh sách người theo dõi', total: 0, totalPages: 0 };
  }
}
