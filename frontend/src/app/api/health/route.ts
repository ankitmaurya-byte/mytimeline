import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Test backend connectivity
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

        const response = await fetch(`${backendUrl}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (response.ok) {
            const backendData = await response.json();
            return NextResponse.json({
                status: 'ok',
                backend: 'connected',
                backendUrl,
                backendStatus: backendData.status,
                backendChecks: backendData.checks
            });
        } else {
            const errorText = await response.text();
            console.error('[health] Backend returned error:', response.status, errorText);
            return NextResponse.json({
                status: 'error',
                backend: 'unreachable',
                backendUrl,
                error: `Backend returned ${response.status}: ${errorText}`
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[health] Backend connectivity test failed:', error);
        return NextResponse.json({
            status: 'error',
            backend: 'unreachable',
            error: error.message
        }, { status: 500 });
    }
}
