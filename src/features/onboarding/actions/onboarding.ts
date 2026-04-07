'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ArticleCategory, Occupation } from '@prisma/client';

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function saveOnboardingAction(data: {
  occupation: Occupation;
  interestedCategories: ArticleCategory[];
}) {
  const userId = await requireUser();
  await db.userOnboarding.upsert({
    where:  { userId },
    update: { occupation: data.occupation, interestedCategories: data.interestedCategories },
    create: { userId, occupation: data.occupation, interestedCategories: data.interestedCategories },
  });
}

export async function completeOnboardingAction(data: {
  occupation: Occupation;
  interestedCategories: ArticleCategory[];
}) {
  const userId = await requireUser();
  await db.userOnboarding.upsert({
    where:  { userId },
    update: { occupation: data.occupation, interestedCategories: data.interestedCategories, completedAt: new Date() },
    create: { userId, occupation: data.occupation, interestedCategories: data.interestedCategories, completedAt: new Date() },
  });
}

export async function getPreferencesAction() {
  const userId = await requireUser();
  return db.userOnboarding.findUnique({
    where:  { userId },
    select: { occupation: true, interestedCategories: true, codeTheme: true },
  });
}

export async function updatePreferencesAction(data: {
  occupation: Occupation;
  interestedCategories: ArticleCategory[];
  codeTheme: string;
}) {
  const userId = await requireUser();
  await db.userOnboarding.upsert({
    where:  { userId },
    update: { 
      occupation: data.occupation, 
      interestedCategories: data.interestedCategories,
      codeTheme: data.codeTheme 
    },
    create: { 
      userId, 
      occupation: data.occupation, 
      interestedCategories: data.interestedCategories,
      codeTheme: data.codeTheme,
      completedAt: new Date() 
    },
  });
}

export async function skipOnboardingAction() {
  const userId = await requireUser();
  await db.userOnboarding.upsert({
    where:  { userId },
    update: { skippedAt: new Date() },
    create: { userId, skippedAt: new Date() },
  });
}
