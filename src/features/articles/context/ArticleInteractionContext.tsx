'use client';

import React, { createContext, useContext, ReactNode, useState, useMemo, useCallback, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useArticleInteraction } from '../hooks/useArticleInteraction';
import { toggleFollowAction } from '@/features/member/actions/follow';

export type AuthorSummary = {
  id: string;
  name: string;
  image: string | null;
  username?: string | null;
  articleCount: number;
  bio: string | null;
};

interface ArticleInteractionContextType {
  liked: boolean;
  bookmarked: boolean;
  likes: number;
  likePending: boolean;
  bookmarkPending: boolean;
  bookmarkToast: string | null;
  readProgress: number;
  handleLike: () => void;
  handleBookmark: () => void;
  setBookmarkToast: (msg: string | null) => void;
  setReadProgress: (p: number) => void;
  
  // Author Follow States
  author: AuthorSummary;
  isFollowing: boolean;
  followerCount: number;
  followPending: boolean;
  handleFollow: () => void;

  // Sidebar Visibility
  sidebarsVisible: boolean;
  showSidebars: () => void;
  hideSidebars: () => void;
}

const ArticleInteractionContext = createContext<ArticleInteractionContextType | undefined>(undefined);

export function ArticleInteractionProvider({
  children,
  articleId,
  initialLiked,
  initialBookmarked,
  initialLikeCount,
  author,
  initialIsFollowing,
  initialFollowerCount,
}: {
  children: ReactNode;
  articleId: string;
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
  
  const interaction = useArticleInteraction({
    articleId,
    initialLiked,
    initialBookmarked,
    initialLikeCount,
  });

  const [readProgress, setReadProgress] = useState(0);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [followPending, startFollowTransition] = useTransition();

  // Sidebar Visibility Strategy
  const [sidebarsVisible, setSidebarsVisible] = useState(true);
  const peekTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSidebars = useCallback(() => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    setSidebarsVisible(true);
  }, []);

  const hideSidebars = useCallback(() => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      setSidebarsVisible(false);
    }, 1200);
  }, []);

  // Synchronized Mount Peek
  React.useEffect(() => {
    // Show immediately on mount
    setSidebarsVisible(true);
    
    // Hide after 5 seconds of discovery
    peekTimerRef.current = setTimeout(() => {
      setSidebarsVisible(false);
    }, 5000);

    return () => {
      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const handleFollow = useCallback(() => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    
    startFollowTransition(async () => {
      try {
        const result = await toggleFollowAction(author.id);
        if (result.success) {
          setIsFollowing(result.isFollowing);
          setFollowerCount(result.followerCount);
        }
      } catch (error) {
        console.error('Failed to toggle follow:', error);
      }
    });
  }, [session, router, pathname, author.id]);

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
    <ArticleInteractionContext.Provider value={value}>
      {children}
    </ArticleInteractionContext.Provider>
  );
}

export function useInteraction() {
  const context = useContext(ArticleInteractionContext);
  if (!context) {
    throw new Error('useInteraction must be used within an ArticleInteractionProvider');
  }
  return context;
}

// Returns null when no provider is mounted — safe for components
// that may render in contexts without ArticleInteractionProvider (e.g. onboarding previews).
export function useInteractionOptional() {
  return useContext(ArticleInteractionContext) ?? null;
}
