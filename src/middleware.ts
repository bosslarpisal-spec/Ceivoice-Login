import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const protectedPaths = [
  '/api/tickets',
  '/api/users',
  '/admin',
  '/tickets',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtected = protectedPaths.some((p) =>
    path.startsWith(p)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  /* ---------- Read Token ---------- */

  const token = request.cookies.get('auth_token')?.value; // ✅ FIXED

  if (!token) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const { payload } = await jwtVerify(token, secret);

    const headers = new Headers(request.headers);

    headers.set('x-user-email', payload.email as string);
    headers.set('x-user-role', payload.role as string);

    return NextResponse.next({
      request: { headers },
    });

  } catch (err) {
    console.error('JWT error:', err);

    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }
}

export const config = {
  matcher: [
    '/api/tickets/:path*',
    '/api/users/:path*',
    '/admin/:path*',
    '/tickets/:path*',
  ],
};