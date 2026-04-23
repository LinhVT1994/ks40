'use server';

import { db } from '@/lib/db';

export type SiteAnnouncement = {
  active: boolean;
  type: 'info' | 'warning' | 'maintenance' | 'success';
  message: string;
  expiresAt?: string; // ISO string
};

export async function getAnnouncementAction(): Promise<SiteAnnouncement | null> {
  try {
    const config = await db.siteConfig.findUnique({
      where: { key: 'site_announcement' },
    });
    const data = config?.value as SiteAnnouncement | null;
    if (!data?.active) return null;
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) return null;
    return data;
  } catch (error) {
    // If table does not exist due to pending migrations, return null safely
    return null; 
  }
}

export async function getSiteConfigAction(key: string) {
  try {
    const config = await db.siteConfig.findUnique({
      where: { key },
    });
    return config?.value ?? null;
  } catch (error) {
    return null;
  }
}

export async function setSiteConfigAction(key: string, value: unknown) {
  await db.siteConfig.upsert({
    where: { key },
    update: { value: value as any },
    create: { key, value: value as any },
  });
}
