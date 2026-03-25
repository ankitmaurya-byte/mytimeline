import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Redirect to workspace if authenticated, otherwise to sign-in
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    if (authHeader || (cookieHeader && cookieHeader.includes('__session'))) {
        return NextResponse.redirect(`/api/workspace`);
    }

    return NextResponse.redirect(`${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/sign-in`);
}

export async function POST(request: NextRequest) {
    return NextResponse.json({ message: 'API endpoint' });
}
