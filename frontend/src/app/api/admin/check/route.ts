import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        // Get the auth token from the request
        const authToken = req.cookies.get('auth_token')?.value;

        if (!authToken) {
            return NextResponse.json(
                {
                    success: false,
                    isAdmin: false,
                    error: 'Authentication required',
                    message: 'Please log in to access admin features'
                },
                { status: 401 }
            );
        }

        // Forward the request to the backend admin check endpoint
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/api/admin/check`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Cookie': `auth_token=${authToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    success: false,
                    isAdmin: false,
                    error: data.error || 'Admin check failed',
                    message: data.message || 'Unable to verify admin access'
                },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Admin check proxy error:', error);
        return NextResponse.json(
            {
                success: false,
                isAdmin: false,
                error: 'Failed to check admin status',
                message: 'Unable to verify admin access'
            },
            { status: 500 }
        );
    }
}

