import { NextResponse } from 'next/server';

const PROTECTED = [/^\/workspace(.*)/, /^\/dashboard(.*)/];
const ADMIN_ROUTES = [/^\/admin(.*)/];

export function middleware(req: any) {
    const { pathname, searchParams } = req.nextUrl;
    const token = req.cookies.get('auth_token')?.value;
    const rememberMeToken = req.cookies.get('remember_me')?.value;
    const isProtected = PROTECTED.some(r => r.test(pathname));
    const isAdminRoute = ADMIN_ROUTES.some(r => r.test(pathname));

    // Debug logging
    /*  console.log('[Middleware] Request:', {
         pathname,
         search: req.nextUrl.search,
         hasToken: !!token,
         isProtected,
         oauthSuccess: searchParams.get('oauth') === 'success',
         oauthToken: searchParams.get('token') ? 'present' : 'null',
         allCookies: req.cookies.getAll().map(c => c.name),
         authTokenCookie: req.cookies.get('auth_token')
     }); */

    // Check if this is an OAuth success redirect
    const oauthSuccess = searchParams.get('oauth') === 'success';
    const oauthToken = searchParams.get('token');

    // If OAuth success with token, allow access to workspace and auth endpoints even without auth_token cookie
    // The WorkspaceRedirect component will set the auth_token cookie from the URL token
    if (oauthSuccess && oauthToken && (pathname === '/workspace' || pathname === '/api/auth/me')) {
        // console.log('[Middleware] Allowing OAuth success request with token:', pathname);
        return NextResponse.next();
    }

    if (!token && (isProtected || isAdminRoute)) {
        // If no auth token but has remember me token, redirect to sign-in
        // The sign-in page will handle the remember me automatic login
        const url = req.nextUrl.clone();
        url.pathname = '/sign-in';
        // Preserve any query parameters
        url.search = req.nextUrl.search;
        return NextResponse.redirect(url);
    }

    if (token && (pathname === '/' || pathname === '/dashboard' || pathname === '/sign-in')) {
        const url = req.nextUrl.clone();
        url.pathname = '/workspace';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = { matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'] };
