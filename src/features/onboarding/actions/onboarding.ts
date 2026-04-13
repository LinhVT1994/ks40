'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Occupation } from '@prisma/client';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function saveOnboardingAction(data: {
  occupation: Occupation;
  interestedTopics: string[];
}) {
  const userId = await requireUser();
  await db.userOnboarding.upsert({
    where:  { userId },
    update: { occupation: data.occupation, interestedTopics: data.interestedTopics },
    create: { userId, occupation: data.occupation, interestedTopics: data.interestedTopics },
  });

  // Sync TopicFollow
  await (db as any).topicFollow.deleteMany({ where: { userId } });
  if (data.interestedTopics.length > 0) {
    await (db as any).topicFollow.createMany({
      data: data.interestedTopics.map(topicId => ({ userId, topicId })),
      skipDuplicates: true,
    });
  }
}

export async function completeOnboardingAction(data: {
  occupation: Occupation;
  interestedTopics: string[];
}) {
  const userId = await requireUser();
  const { revalidatePath } = await import('next/cache');

  await db.$transaction(async (tx) => {
    // 1. Mark onboarding as completed
    await tx.userOnboarding.upsert({
      where:  { userId },
      update: { occupation: data.occupation, interestedTopics: data.interestedTopics, completedAt: new Date(), skippedAt: null },
      create: { userId, occupation: data.occupation, interestedTopics: data.interestedTopics, completedAt: new Date() },
    });

    // 2. Synchronize TopicFollow table
    await (tx as any).topicFollow.deleteMany({ where: { userId } });
    if (data.interestedTopics.length > 0) {
      for (const topicId of data.interestedTopics) {
        await (tx as any).topicFollow.upsert({
          where: { userId_topicId: { userId, topicId } },
          update: {},
          create: { userId, topicId }
        });
      }
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

import { revalidatePath } from 'next/cache';

export async function updatePreferencesAction(data: {
  occupation: Occupation;
  interestedTopics: string[];
  codeTheme: string;
}) {
  const userId = await requireUser();
  
  await db.$transaction(async (tx) => {
    // 1. Update legacy UserOnboarding record
    await tx.userOnboarding.upsert({
      where:  { userId },
      update: {
        occupation: data.occupation,
        interestedTopics: data.interestedTopics,
        codeTheme: data.codeTheme
      },
      create: {
        userId,
        occupation: data.occupation,
        interestedTopics: data.interestedTopics,
        codeTheme: data.codeTheme,
        completedAt: new Date()
      },
    });

    // 2. Synchronize TopicFollow table (The new Source of Truth)
    await (tx as any).topicFollow.deleteMany({ where: { userId } });
    if (data.interestedTopics.length > 0) {
      for (const topicId of data.interestedTopics) {
        await (tx as any).topicFollow.upsert({
          where: { userId_topicId: { userId, topicId } },
          update: {}, // No update needed if exists
          create: { userId, topicId }
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
