'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';

export type NoteItem = {
  id: string;
  title: string | null;
  content: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

async function requireAuth(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

export async function getNotesAction(): Promise<NoteItem[]> {
  const userId = await requireAuth();

  return db.note.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      content: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createNoteAction(data: {
  title?: string;
  content: string;
  color?: string;
}): Promise<NoteItem> {
  const userId = await requireAuth();

  return db.note.create({
    data: {
      userId,
      title: data.title || null,
      content: data.content,
      color: data.color ?? 'yellow',
    },
    select: {
      id: true,
      title: true,
      content: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateNoteAction(
  id: string,
  data: { title?: string; content?: string; color?: string },
): Promise<NoteItem> {
  const userId = await requireAuth();

  // Ensure note belongs to the authenticated user
  const existing = await db.note.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error('Note not found');
  }

  return db.note.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title || null } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
    },
    select: {
      id: true,
      title: true,
      content: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteNoteAction(id: string): Promise<void> {
  const userId = await requireAuth();

  const existing = await db.note.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error('Note not found');
  }

  await db.note.delete({ where: { id } });
}
