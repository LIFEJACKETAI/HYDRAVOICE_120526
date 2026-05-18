import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/api/documents',
  '/api/audio',
  '/api/payments',
];

// Routes that require admin role
const ADMIN_ROUTES = [
  '/api/admin',
];

// Routes that are publicly accessible (no auth required)
const PUBLIC_ROUTES = [
  '/api/auth',
  '/pricing',
  '/',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Get JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'hydravoice-dev-secret-change-in-production',
  });

  // Not authenticated
  if (!token) {
    // For API routes, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // For page routes, redirect to sign-in
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check admin routes
  if (isAdminRoute) {
    if (token.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
