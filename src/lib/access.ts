// Fail closed for unknown roles/audiences. Reused by pages and download endpoints.
export function canAccessAudience(audience: string, role?: string) {
  if (audience === 'PUBLIC') return true;
  if (role === 'ADMIN') return ['MEMBERS', 'PREMIUM', 'PRIVATE'].includes(audience);
  if (audience === 'MEMBERS') return role === 'MEMBER' || role === 'PREMIUM';
  return audience === 'PREMIUM' && role === 'PREMIUM';
}

export function canDownloadArticle(article: { status: string; audience: string }, role?: string) {
  return (article.status === 'PUBLISHED' || role === 'ADMIN') && canAccessAudience(article.audience, role);
}
