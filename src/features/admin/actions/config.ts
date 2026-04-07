'use server';

import { db } from '@/lib/db';

export type SiteAnnouncement = {
  active: boolean;
  type: 'info' | 'warning' | 'maintenance' | 'success';
  message: string;
  expiresAt?: string; // ISO string
};

export async function getAnnouncementAction(): Promise<SiteAnnouncement | null> {
  const rows = await db.$queryRaw<{ value: unknown }[]>`
    SELECT value FROM "SiteConfig" WHERE key = 'site_announcement' LIMIT 1
  `;
  const data = rows[0]?.value as SiteAnnouncement | null;
  if (!data?.active) return null;
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) return null;
  return data;
}

export async function getSiteConfigAction(key: string) {
  const rows = await db.$queryRaw<{ value: unknown }[]>`
    SELECT value FROM "SiteConfig" WHERE key = ${key} LIMIT 1
  `;
  return rows[0]?.value ?? null;
}

export async function setSiteConfigAction(key: string, value: unknown) {
  const json = JSON.stringify(value);
  await db.$executeRaw`
    INSERT INTO "SiteConfig" (key, value, "updatedAt")
    VALUES (${key}, ${json}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = ${json}::jsonb, "updatedAt" = NOW()
  `;
}
