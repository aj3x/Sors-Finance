import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register'];

// Public API routes that don't require authentication
const publicApiRoutes = ['/api/auth/login', '/api/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes to pass through
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public API routes to pass through
  if (publicApiRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('sors_session');

  if (!sessionCookie) {
    // For API routes, return 401 JSON response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists, allow request through
  // Full session validation happens in API routes via requireAuth helper
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
