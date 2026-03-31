import { NextRequest, NextResponse } from 'next/server';
import { fetchEmailById, updateEmail, deleteEmail } from '@/lib/supabase/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const email = await fetchEmailById(id);

        if (!email) {
            return NextResponse.json({ error: 'Email not found' }, { status: 404 });
        }

        return NextResponse.json({ email });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // If approving, add approved_at timestamp
        if (body.status === 'approved') {
            body.approved_at = new Date().toISOString();
        }

        const email = await updateEmail(id, body);

        if (!email) {
            return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
        }

        return NextResponse.json({ email });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const success = await deleteEmail(id);

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
