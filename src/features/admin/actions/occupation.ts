'use server';

import { db } from '@/lib/db';
import { updateTag } from 'next/cache';

export type OccupationOptionAdmin = {
  id: string;
  value: string;
  label: string;
  emoji: string | null;
  description: string | null;
  order: number;
  enabled: boolean;
};

export async function getAllOccupationOptionsAction(): Promise<OccupationOptionAdmin[]> {
  return db.occupationOption.findMany({ orderBy: { order: 'asc' } });
}

export async function createOccupationOptionAction(data: {
  value: string;
  label: string;
  emoji?: string;
  description?: string;
}): Promise<{ success: boolean; error?: string }> {
  const raw = data.value.trim().toUpperCase().replace(/\s+/g, '_');
  if (!raw || !data.label.trim()) return { success: false, error: 'Thiếu value hoặc label' };

  const existing = await db.occupationOption.findUnique({ where: { value: raw } });
  if (existing) return { success: false, error: 'Value đã tồn tại' };

  const maxOrder = await db.occupationOption.aggregate({ _max: { order: true } });
  await db.occupationOption.create({
    data: {
      value: raw,
      label: data.label.trim(),
      emoji: data.emoji?.trim() || null,
      description: data.description?.trim() || null,
      order: (maxOrder._max.order ?? 0) + 1,
      enabled: true,
    },
  });

  updateTag('occupation-options');
  return { success: true };
}

export async function updateOccupationOptionAction(
  id: string,
  data: Partial<{ label: string; emoji: string; description: string; enabled: boolean; order: number }>,
): Promise<{ success: boolean; error?: string }> {
  await db.occupationOption.update({
    where: { id },
    data: {
      ...(data.label !== undefined && { label: data.label }),
      ...(data.emoji !== undefined && { emoji: data.emoji || null }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });
  updateTag('occupation-options');
  return { success: true };
}

export async function deleteOccupationOptionAction(id: string): Promise<{ success: boolean }> {
  await db.occupationOption.delete({ where: { id } });
  updateTag('occupation-options');
  return { success: true };
}

export async function reorderOccupationOptionsAction(ids: string[]): Promise<void> {
  await db.$transaction(
    ids.map((id, index) => db.occupationOption.update({ where: { id }, data: { order: index } })),
  );
  updateTag('occupation-options');
}
