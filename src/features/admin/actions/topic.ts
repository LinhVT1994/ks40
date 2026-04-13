'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export type TopicItem = {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
  color: string | null;
  order: number;
  enabled: boolean;
  parentId: string | null;
  children?: TopicItem[];
  _count?: { articles: number };
};

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
}

/** Flat list of all topics (including children) */
export async function getTopicsAction(): Promise<TopicItem[]> {
  return db.topic.findMany({ orderBy: { order: 'asc' } });
}

export async function getTopicBySlugAction(slug: string): Promise<TopicItem | null> {
  return db.topic.findUnique({
    where: { slug },
    include: { _count: { select: { articles: true } } }
  });
}

/** Tree: parent topics with nested children - with AGGREGATED counts */
export async function getTopicTreeAction(): Promise<TopicItem[]> {
  const all = await db.topic.findMany({ 
    orderBy: { order: 'asc' },
    include: { _count: { select: { articles: true } } }
  });

  // Aggregation logic: Add child counts to parents
  const idToTopic = new Map(all.map(t => [t.id, { ...t, _count: { articles: t._count?.articles ?? 0 } }]));
  for (const t of all) {
    if (t.parentId) {
      const parent = idToTopic.get(t.parentId);
      if (parent) {
        parent._count!.articles += (t._count?.articles ?? 0);
      }
    }
  }

  const processed = Array.from(idToTopic.values());
  const parents = processed.filter(t => !t.parentId);
  return parents.map(p => ({
    ...p,
    children: processed.filter(c => c.parentId === p.id),
  }));
}

/** Enabled topics as tree - with AGGREGATED counts */
export async function getEnabledTopicTreeAction(): Promise<TopicItem[]> {
  const all = await db.topic.findMany({ where: { enabled: true }, orderBy: { order: 'asc' }, include: { _count: { select: { articles: true } } } });
  
  // Aggregation logic
  const idToTopic = new Map(all.map(t => [t.id, { ...t, _count: { articles: t._count?.articles ?? 0 } }]));
  for (const t of all) {
    if (t.parentId) {
      const parent = idToTopic.get(t.parentId);
      if (parent) {
        parent._count!.articles += (t._count?.articles ?? 0);
      }
    }
  }

  const processed = Array.from(idToTopic.values());
  const parents = processed.filter(t => !t.parentId);
  return parents.map(p => ({
    ...p,
    children: processed.filter(c => c.parentId === p.id),
  }));
}

/** Flat list of enabled topics - with AGGREGATED counts for parents */
export async function getEnabledTopicsAction(): Promise<TopicItem[]> {
  const all = await db.topic.findMany({ 
    where: { enabled: true }, 
    orderBy: { order: 'asc' },
    include: { _count: { select: { articles: true } } }
  });

  // Aggregation logic: update parents with their children's counts
  const idToTopic = new Map(all.map(t => [t.id, { ...t, _count: { articles: t._count?.articles ?? 0 } }]));
  for (const t of all) {
    if (t.parentId) {
      const parent = idToTopic.get(t.parentId);
      if (parent) {
        parent._count!.articles += (t._count?.articles ?? 0);
      }
    }
  }

  return Array.from(idToTopic.values());
}

export async function saveTopicsAction(topics: TopicItem[]): Promise<void> {
  await requireAdmin();

  // Flatten tree → flat list with parentId set
  const flat: Omit<TopicItem, 'children'>[] = [];
  let order = 0;
  for (const t of topics) {
    flat.push({ ...t, order: order++, parentId: null });
    if (t.children) {
      for (const c of t.children) {
        flat.push({ ...c, order: order++, parentId: t.id.startsWith('new-') ? undefined as any : t.id });
      }
    }
  }

  const incomingIds = flat.filter(t => t.id && !t.id.startsWith('new-')).map(t => t.id);

  await db.$transaction(async (tx) => {
    // Remove children first (FK constraint), then parents
    await tx.topic.deleteMany({ where: { id: { notIn: incomingIds }, parentId: { not: null } } });
    await tx.topic.deleteMany({ where: { id: { notIn: incomingIds } } });

    // Create parents first, then children
    const parentItems = flat.filter(t => !t.parentId);
    const childItems = flat.filter(t => t.parentId);

    // Map old temp IDs → new real IDs
    const idMap = new Map<string, string>();

    for (const t of parentItems) {
      const data = { slug: t.slug, label: t.label, emoji: t.emoji, color: t.color, order: t.order, enabled: t.enabled, parentId: null };
      if (!t.id || t.id.startsWith('new-')) {
        const upserted = await tx.topic.upsert({ where: { slug: t.slug }, update: data, create: data });
        idMap.set(t.id, upserted.id);
      } else {
        await tx.topic.upsert({ where: { id: t.id }, update: data, create: { id: t.id, ...data } });
        idMap.set(t.id, t.id);
      }
    }

    for (const t of childItems) {
      const realParentId = idMap.get(t.parentId!) ?? t.parentId!;
      const data = { slug: t.slug, label: t.label, emoji: t.emoji, color: t.color, order: t.order, enabled: t.enabled, parentId: realParentId };
      if (!t.id || t.id.startsWith('new-')) {
        const upserted = await tx.topic.upsert({ where: { slug: t.slug }, update: data, create: data });
        idMap.set(t.id, upserted.id);
      } else {
        await tx.topic.upsert({ where: { id: t.id }, update: data, create: { id: t.id, ...data } });
      }
    }
  });

  revalidatePath('/');
  revalidatePath('/admin/settings');
  revalidatePath('/admin/topics');
}

// ── Topic Follow ──────────────────────────────────────────────

export async function toggleTopicFollowAction(topicId: string): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');

  const existing = await (db as any).topicFollow.findUnique({
    where: { userId_topicId: { userId, topicId } },
  });

  if (existing) {
    await (db as any).topicFollow.delete({ where: { userId_topicId: { userId, topicId } } });
    revalidatePath('/');
    revalidatePath('/topics');
    return false; // unfollowed
  } else {
    await (db as any).topicFollow.create({ data: { userId, topicId } });
    revalidatePath('/');
    revalidatePath('/topics');
    return true; // followed
  }
}

export async function getTopicFollowStatus(topicId: string): Promise<{ isFollowing: boolean; followerCount: number }> {
  const session = await auth();
  const userId = session?.user?.id;

  const [followerCount, follow] = await Promise.all([
    (db as any).topicFollow.count({ where: { topicId } }),
    userId ? (db as any).topicFollow.findUnique({ where: { userId_topicId: { userId, topicId } } }) : null,
  ]);

  return { isFollowing: !!follow, followerCount };
}
