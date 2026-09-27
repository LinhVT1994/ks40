import 'server-only';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';

// Atomic Postgres counters shared by every replica; no process-local bypass.
// Reuses SiteConfig to avoid a deployment-dependent schema migration.
async function consume(key: string, limit: number, windowMs: number): Promise<boolean> {
  const resetAt = Date.now() + windowMs;
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "SiteConfig" ("key", "value", "updatedAt")
    VALUES (${key}, jsonb_build_object('count', 1, 'resetAt', ${resetAt}::bigint), NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "value" = CASE WHEN ("SiteConfig"."value"->>'resetAt')::bigint <= ${Date.now()}::bigint
        THEN EXCLUDED."value"
        ELSE jsonb_set("SiteConfig"."value", '{count}', to_jsonb(("SiteConfig"."value"->>'count')::int + 1)) END,
      "updatedAt" = NOW()
    RETURNING ("value"->>'count')::int AS count
  `;
  return rows[0].count <= limit;
}

export async function allowAuthAttempt(scope: 'login' | 'register' | 'forgot' | 'reset', identifier: string) {
  try {
    // Caps unique-identifier attacks too. Tune to expected legitimate traffic.
    if (!await consume(`rate-limit:${scope}:global`, 600, 15 * 60_000)) return false;
    const digest = createHash('sha256').update(identifier.toLowerCase()).digest('hex');
    return await consume(`rate-limit:${scope}:${digest}`, scope === 'login' ? 10 : 5, 15 * 60_000);
  } catch {
    // Authentication must not silently become unlimited during a DB failure.
    return false;
  }
}
