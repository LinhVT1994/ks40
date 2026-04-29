'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toggleGlossaryLikeAction, toggleGlossaryBookmarkAction } from '../actions/glossary';

interface UseGlossaryInteractionProps {
  termId: string;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialLikeCount: number;
}

export function useGlossaryInteraction({
  termId,
  initialLiked,
  initialBookmarked,
  initialLikeCount,
}: UseGlossaryInteractionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [likes, setLikes] = useState(initialLikeCount);
  const [likePending, startLike] = useTransition();
  const [bookmarkPending, startBookmark] = useTransition();
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  const requireAuth = () => {
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  };

  const handleLike = React.useCallback(() => {
    if (!session) {
      requireAuth();
      return;
    }
    startLike(async () => {
      try {
        const result = await toggleGlossaryLikeAction(termId);
        setLiked(result.isLiked);
        setLikes(result.count);
      } catch (error) {
        console.error('Failed to toggle like:', error);
      }
    });
  }, [session, termId, router, pathname]);

  const handleBookmark = React.useCallback(() => {
    if (!session) {
      requireAuth();
      return;
    }
    const next = !bookmarked;
    setBookmarked(next);
    startBookmark(async () => {
      try {
        const result = await toggleGlossaryBookmarkAction(termId);
        setBookmarked(result.isBookmarked);
        const msg = result.isBookmarked ? 'Đã lưu thuật ngữ' : 'Đã bỏ lưu';
        setBookmarkToast(msg);
        setTimeout(() => setBookmarkToast(null), 2000);
      } catch (error) {
        setBookmarked(!next); // Revert
        console.error('Failed to toggle bookmark:', error);
      }
    });
  }, [session, termId, bookmarked, router, pathname]);

  return React.useMemo(() => ({
    liked,
    bookmarked,
    likes,
    likePending,
    bookmarkPending,
    bookmarkToast,
    handleLike,
    handleBookmark,
    setBookmarkToast,
  }), [liked, bookmarked, likes, likePending, bookmarkPending, bookmarkToast, handleLike, handleBookmark]);
}
