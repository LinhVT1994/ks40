'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { startOfDay, subDays, isSameDay } from 'date-fns';

export async function getDashboardStatsAction() {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return null;

  const [readHistories, bookHistories, notesCount] = await Promise.all([
    db.readHistory.findMany({
      where: { userId },
      select: { readAt: true, progress: true },
      orderBy: { readAt: 'desc' },
    }),
    db.bookReadHistory.findMany({
      where: { userId },
      select: { readAt: true },
      orderBy: { readAt: 'desc' },
    }),
    db.note.count({
      where: { userId },
    }),
  ]);

  // Total Completed (Articles with progress > 0.9 + Chapters)
  const completedArticles = readHistories.filter(h => h.progress > 0.9).length;
  const completedChapters = bookHistories.length;
  const totalCompleted = completedArticles + completedChapters;

  // Streak Calculation
  const allReadDates = [
    ...readHistories.map(h => h.readAt),
    ...bookHistories.map(h => h.readAt),
  ].sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  if (allReadDates.length > 0) {
    const uniqueDays = Array.from(new Set(allReadDates.map(d => startOfDay(d).getTime())))
      .map(t => new Date(t));
    
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    
    let currentInStreak = today;
    
    // If no activity today, check if yesterday was part of a streak
    const hasActivityToday = uniqueDays.some(d => isSameDay(d, today));
    const hasActivityYesterday = uniqueDays.some(d => isSameDay(d, yesterday));

    if (hasActivityToday) {
      currentInStreak = today;
    } else if (hasActivityYesterday) {
      currentInStreak = yesterday;
    } else {
      return { totalCompleted, notesCount, streak: 0, last7Days: [] };
    }

    // Iterate backwards to find streak
    for (let i = 0; i < 365; i++) {
        const targetDay = subDays(currentInStreak, i);
        if (uniqueDays.some(d => isSameDay(d, targetDay))) {
            streak++;
        } else {
            break;
        }
    }
  }

  // Last 7 days activity (for the tiny dots)
  const last7Days = [];
  const today = startOfDay(new Date());
  for (let i = 6; i >= 0; i--) {
    const day = subDays(today, i);
    const hasActivity = allReadDates.some(d => isSameDay(d, day));
    last7Days.push(hasActivity);
  }

  return {
    totalCompleted,
    notesCount,
    streak,
    last7Days,
  };
}

export async function getContinueReadingAction() {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return null;

  const [lastArticle, lastChapter] = await Promise.all([
    db.readHistory.findFirst({
        where: { userId, progress: { lt: 0.95 } },
        orderBy: { readAt: 'desc' },
        include: {
            article: {
                select: { id: true, title: true, slug: true, thumbnail: true, summary: true, readTime: true }
            }
        }
    }),
    db.bookReadHistory.findFirst({
        where: { userId },
        orderBy: { readAt: 'desc' },
        include: {
            chapter: {
                select: { id: true, title: true, slug: true, book: { select: { title: true, slug: true } } }
            }
        }
    })
  ]);

  // Return the one that was read most recently
  if (!lastArticle && !lastChapter) return null;
  if (lastArticle && !lastChapter) return { type: 'article', data: lastArticle };
  if (!lastArticle && lastChapter) return { type: 'chapter', data: lastChapter };

  if (lastArticle!.readAt > lastChapter!.readAt) {
    return { type: 'article', data: lastArticle };
  } else {
    return { type: 'chapter', data: lastChapter };
  }
}
