'use server';

import { db } from '@/lib/db';

// ── Tags ──────────────────────────────────────────────────────

export async function getTagsWithCountAction() {
  return db.tag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { articles: true } } },
  });
}

export async function createTagAction(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return db.tag.create({ data: { name: name.trim(), slug } });
}

export async function updateTagAction(id: string, name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return db.tag.update({ where: { id }, data: { name: name.trim(), slug } });
}

export async function deleteTagAction(id: string) {
  return db.tag.delete({ where: { id } });
}
