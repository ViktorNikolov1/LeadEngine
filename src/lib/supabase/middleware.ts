import { type NextRequest, NextResponse } from 'next/server';

export function updateSession(request: NextRequest) {
    // TODO: Implement Supabase auth middleware
    // This will handle session refresh and route protection
    return NextResponse.next();
}