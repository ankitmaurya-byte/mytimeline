import { NextRequest } from 'next/server';
import { withCORS } from '../../_lib/cors';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import { HTTPSTATUS } from '@/src/config/http.config';
import UserModel from '@/src/models/user.model';
import { getProfilePicturesWithCache } from '@/src/utils/profile-picture-cache';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
    const startTime = Date.now();
    try {
        const dbStart = Date.now();
        await ensureDb();
        const dbTime = Date.now() - dbStart;

        const authStart = Date.now();
        const authUser = await getDbUserFromRequest(req);
        const authTime = Date.now() - authStart;

        if (!authUser) {
            return new Response(JSON.stringify({ message: 'Unauthorized' }), {
                status: HTTPSTATUS.UNAUTHORIZED,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const url = new URL(req.url);
        const userIds = url.searchParams.get('userIds');

        if (!userIds) {
            return new Response(JSON.stringify({ message: 'userIds parameter is required' }), {
                status: HTTPSTATUS.BAD_REQUEST,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse comma-separated user IDs
        const userIdArray = userIds.split(',').filter(id => id.trim());

        if (userIdArray.length === 0) {
            return new Response(JSON.stringify({ message: 'No valid user IDs provided' }), {
                status: HTTPSTATUS.BAD_REQUEST,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Limit to prevent abuse
        if (userIdArray.length > 50) {
            return new Response(JSON.stringify({ message: 'Too many user IDs requested (max 50)' }), {
                status: HTTPSTATUS.BAD_REQUEST,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fetch profile pictures with caching
        const queryStart = Date.now();
        const profilePictures = await getProfilePicturesWithCache(
            userIdArray,
            async (userIds: string[]) => {
                // Database fetch function
                const users = userIds.length === 1
                    ? [await UserModel.findById(userIds[0], { _id: 1, profilePicture: 1 }).lean()]
                    : await UserModel.find(
                        { _id: { $in: userIds } },
                        { _id: 1, profilePicture: 1 }
                    ).lean();

                // Create a map of userId -> profilePicture
                return users.reduce((acc, user: any) => {
                    if (user) { // Check if user exists (findById can return null)
                        acc[user._id.toString()] = user.profilePicture;
                    }
                    return acc;
                }, {} as Record<string, string | null>);
            }
        );
        const queryTime = Date.now() - queryStart;

        const totalTime = Date.now() - startTime;
        // Performance logging (can be removed in production)
        if (totalTime > 1000) {
            console.log(`[Profile Pictures API] Slow response: ${totalTime}ms for ${userIdArray.length} users`);
        }

        return new Response(JSON.stringify({
            message: 'Profile pictures fetched successfully',
            profilePictures
        }), {
            status: HTTPSTATUS.OK,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5 minutes, CDN cache for 10 minutes
                'ETag': `"${Date.now()}-${Object.keys(profilePictures).length}"`, // Simple ETag for browser caching
                'Vary': 'Authorization' // Cache varies by authorization
            }
        });

    } catch (error) {
        console.error('Error fetching profile pictures:', error);
        return new Response(JSON.stringify({
            message: 'Failed to fetch profile pictures',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: HTTPSTATUS.INTERNAL_SERVER_ERROR,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
