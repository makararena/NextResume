import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Enhanced middleware for Clerk authentication with additional security headers
 * Handles authentication, redirection, and sets security headers for production
 */
export default clerkMiddleware({
  // Define public routes that don't require authentication
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    '/api/(.*)public(.*)',
    '/api/user/usage',
    '/terms',
    '/privacy',
    '/pricing',
    '/contact',
    '/fonts/(.*)',
    '/images/(.*)',
    '/tos',
    '/_next/(.*)' // Make Next.js static files public
  ],
  
  // Clerk cookie options for secure token storage
  cookieOptions: {
    // Use secure cookies in production
    secure: process.env.NODE_ENV === 'production',
    // HttpOnly prevents JavaScript access to the cookie
    httpOnly: true,
    // SameSite helps prevent CSRF attacks
    sameSite: 'lax',
    // 7 day expiration (same as Clerk default)
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  
  afterAuth(authState, req) {
    // Get the response to modify it later
    const response = NextResponse.next();

    // If the user is trying to access a protected route but isn't signed in,
    // redirect them to the sign-in page
    if (!authState.userId && !authState.isPublicRoute) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // If the user is signed in and tries to access auth pages, redirect to resumes
    if (authState.userId && 
        (req.nextUrl.pathname.startsWith('/sign-in') || 
         req.nextUrl.pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/resumes', req.url));
    }

    // Add security headers for all responses
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Set strict Content Security Policy for production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.io https://cdn.clerk.io https://js.clerk.io https://*.clerk.com; connect-src 'self' https://*.clerk.io https://*.clerk.com https://api.openai.com https://*.vercel-storage.com; img-src 'self' data: https://*.clerk.com https://*.clerk.io https://*.public.blob.vercel-storage.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://*.clerk.com https://accounts.clerk.com;"
      );
    }

    return response;
  }
});

// Configure the middleware to match specific paths
export const config = {
  matcher: ['/((?!_next/static|_next/image|_next/script|_next/font|favicon.ico|images|fonts|public).*)'],
};
