import { auth } from './auth';
import { NextResponse } from 'next/server';

export default auth((request) => {
  let pathname: string;
  try { pathname = decodeURIComponent(request.nextUrl.pathname); }
  catch { return new NextResponse(null, { status: 400 }); }
  // Old local documents must also go through the permission-checked download API.
  if (/^\/uploads\/(files|shared)(\/|$)/i.test(pathname)) {
    return new NextResponse(null, { status: 404 });
  }
  const response = NextResponse.next();
  if (/^\/(admin|settings|history|bookmarks|notifications|write|onboarding|login|register|forgot-password|reset-password|search|download|shared)(\/|$)/.test(pathname)) {
    response.headers.set('X-Robots-Tag', pathname === '/search' ? 'noindex, follow' : 'noindex, nofollow');
  }
  return response;
});

export const config = {
  // Bỏ qua static files và _next internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
