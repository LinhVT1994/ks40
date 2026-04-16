'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { unstable_cache, revalidatePath, revalidateTag } from 'next/cache';

export type OccupationOption = {
  id: string;
  value: string;
  label: string;
  emoji: string | null;
  description: string | null;
  order: number;
  enabled: boolean;
};

const _getOccupationOptionsCached = unstable_cache(
  async (): Promise<OccupationOption[]> => {
    return db.occupationOption.findMany({
      where:   { enabled: true },
      orderBy: { order: 'asc' },
    });
  },
  ['occupation-options'],
  { revalidate: 3600, tags: ['occupation-options'] },
);

export async function getOccupationOptionsAction(): Promise<OccupationOption[]> {
  return _getOccupationOptionsCached();
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function saveOnboardingAction(data: {
  occupation: string;
  interestedTopics: string[];
}) {
  const userId = await requireUser();

  const validTopics = await db.topic.findMany({
    where: { id: { in: data.interestedTopics } },
    select: { id: true },
  });
  const validIds = validTopics.map(t => t.id);

  await db.userOnboarding.upsert({
    where:  { userId },
    update: { occupation: data.occupation, interestedTopics: validIds },
    create: { userId, occupation: data.occupation, interestedTopics: validIds },
  });

  await (db as any).topicFollow.deleteMany({ where: { userId } });
  if (validIds.length > 0) {
    await (db as any).topicFollow.createMany({
      data: validIds.map((topicId: string) => ({ userId, topicId })),
      skipDuplicates: true,
    });
  }
}

export async function completeOnboardingAction(data: {
  occupation: string;
  interestedTopics: string[];
}) {
  const userId = await requireUser();

  const validTopics = await db.topic.findMany({
    where: { id: { in: data.interestedTopics } },
    select: { id: true },
  });
  const validIds = validTopics.map(t => t.id);

  await db.$transaction(async (tx) => {
    await tx.userOnboarding.upsert({
      where:  { userId },
      update: { occupation: data.occupation, interestedTopics: validIds, completedAt: new Date(), skippedAt: null },
      create: { userId, occupation: data.occupation, interestedTopics: validIds, completedAt: new Date() },
    });

    await (tx as any).topicFollow.deleteMany({ where: { userId } });
    if (validIds.length > 0) {
      await (tx as any).topicFollow.createMany({
        data: validIds.map((topicId: string) => ({ userId, topicId })),
        skipDuplicates: true,
      });
    }
  });

  revalidatePath('/');
}

export async function getPreferencesAction() {
  const userId = await requireUser();
  return db.userOnboarding.findUnique({
    where:  { userId },
    select: { occupation: true, interestedTopics: true, codeTheme: true },
  });
}

export async function updatePreferencesAction(data: {
  occupation?: string;
  interestedTopics?: string[];
  codeTheme?: string;
}) {
  const userId = await requireUser();
  
  // Get current preferences to handle partial updates
  const current = await db.userOnboarding.findUnique({
    where: { userId },
    select: { occupation: true, interestedTopics: true, codeTheme: true }
  });

  const occupation = data.occupation ?? current?.occupation ?? '';
  const interestedTopics = data.interestedTopics ?? current?.interestedTopics ?? [];
  const codeTheme = data.codeTheme ?? current?.codeTheme ?? 'dracula';

  const validTopics = await db.topic.findMany({
    where: { id: { in: interestedTopics } },
    select: { id: true },
  });
  const validIds = validTopics.map(t => t.id);

  await db.$transaction(async (tx) => {
    await tx.userOnboarding.upsert({
      where:  { userId },
      update: { occupation, interestedTopics: validIds, codeTheme },
      create: { userId, occupation, interestedTopics: validIds, codeTheme, completedAt: new Date() },
    });

    if (data.interestedTopics) {
      await (tx as any).topicFollow.deleteMany({ where: { userId } });
      if (validIds.length > 0) {
        await (tx as any).topicFollow.createMany({
          data: validIds.map((topicId: string) => ({ userId, topicId })),
          skipDuplicates: true,
        });
      }
    }
  });

  revalidatePath('/');
}

export async function skipOnboardingAction() {
  const userId = await requireUser();
  await db.userOnboarding.upsert({
    where:  { userId },
    update: { skippedAt: new Date() },
    create: { userId, skippedAt: new Date() },
  });
}
