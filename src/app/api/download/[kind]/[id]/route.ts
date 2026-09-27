import { auth } from '@/auth';
import { db } from '@/lib/db';
import { canAccessAudience, canDownloadArticle } from '@/lib/access';
import { downloadStoredFile } from '@/lib/private-files';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const session = await auth();
  const role = session?.user?.role;
  let file;
  if (kind === 'resource') {
    const resource = await db.resource.findUnique({ where: { id }, include: { article: { select: { status: true, audience: true } } } });
    if (!resource || !canDownloadArticle(resource.article, role)) return new Response(null, { status: 404 });
    file = resource;
  } else if (kind === 'shared') {
    const shared = await db.sharedFile.findUnique({ where: { id }, include: { package: { select: { audience: true, expiresAt: true } } } });
    if (!shared || (shared.package.expiresAt && shared.package.expiresAt <= new Date()) || !canAccessAudience(shared.package.audience, role)) {
      return new Response(null, { status: 404 });
    }
    file = shared;
  } else {
    return new Response(null, { status: 404 });
  }
  try {
    return await downloadStoredFile(file);
  } catch {
    return new Response(null, { status: 404 });
  }
}
