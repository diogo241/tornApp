import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth endpoints - they need to be public
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Protect all other API routes
  if (pathname.startsWith('/api/')) {
    // Check for session cookie
    const sessionToken =
      request.cookies.get('__Secure-better-auth.session_token')?.value ||
      request.cookies.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No session token provided' },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
