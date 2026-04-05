import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If env vars are missing, let the request through (build time / misconfigured)
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                for (const { name, value } of cookiesToSet) {
                    request.cookies.set(name, value);
                }
                supabaseResponse = NextResponse.next({
                    request,
                });
                for (const { name, value, options } of cookiesToSet) {
                    supabaseResponse.cookies.set(name, value, options);
                }
            },
        },
    });

    // Refresh the session (important — keeps tokens alive)
    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Public routes that don't require auth
    const isAuthRoute = pathname === '/login' || pathname === '/register';
    const isApiRoute = pathname.startsWith('/api/');
    const isStaticAsset = pathname.startsWith('/_next/') || pathname.startsWith('/favicon');

    // Allow API routes and static assets through
    if (isApiRoute || isStaticAsset) {
        return supabaseResponse;
    }

    // Not logged in — redirect to login (unless already on auth page)
    if (!user && !isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Logged in — redirect away from auth pages to dashboard
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
