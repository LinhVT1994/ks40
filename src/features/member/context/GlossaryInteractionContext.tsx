'use client';

import React, { createContext, useContext, ReactNode, useState, useMemo, useCallback, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useGlossaryInteraction } from '../hooks/useGlossaryInteraction';
import { toggleFollowAction } from '@/features/member/actions/follow';
import { ArticleInteractionContext, AuthorSummary } from '@/features/articles/context/ArticleInteractionContext';

export function GlossaryInteractionProvider({
  children,
  termId,
  initialLiked,
  initialBookmarked,
  initialLikeCount,
  author,
  initialIsFollowing,
  initialFollowerCount,
}: {
  children: ReactNode;
  termId: string;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialLikeCount: number;
  author: AuthorSummary;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const interaction = useGlossaryInteraction({
    termId,
    initialLiked,
    initialBookmarked,
    initialLikeCount,
  });

  const [readProgress, setReadProgress] = useState(0);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [followPending, startFollowTransition] = useTransition();

  // Sidebar Visibility Strategy
  const sidebarsVisible = true;
  const showSidebars = useCallback(() => {}, []);
  const hideSidebars = useCallback(() => {}, []);

  const handleFollow = useCallback(() => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!author.id) {
      toast.error('Không xác định được tác giả');
      return;
    }

    if (session.user?.id === author.id) {
      toast.info('Không thể tự theo dõi chính mình.');
      return;
    }

    startFollowTransition(async () => {
      try {
        const result = await toggleFollowAction(author.id);
        if (result.success) {
          setIsFollowing(result.isFollowing);
          setFollowerCount(result.followerCount);
          toast.success(
            result.isFollowing ? `Đang theo dõi ${author.name}` : `Đã hủy theo dõi ${author.name}`
          );
        }
      } catch (error) {
        toast.error('Có lỗi xảy ra khi thực hiện theo dõi');
      }
    });
  }, [session, router, pathname, author.id, author.name]);

  const value = useMemo(() => ({
    ...interaction,
    readProgress,
    setReadProgress,
    author,
    isFollowing,
    followerCount,
    followPending,
    handleFollow,
    sidebarsVisible,
    showSidebars,
    hideSidebars,
  }), [interaction, readProgress, author, isFollowing, followerCount, followPending, handleFollow, sidebarsVisible, showSidebars, hideSidebars]);

  return (
    <ArticleInteractionContext.Provider value={value as any}>
      {children}
    </ArticleInteractionContext.Provider>
  );
}
