import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import UserModel from '../../../src/models/user.model';

export const dynamic = 'force-dynamic'; // ensure fresh data, avoid static cache

/*
 GET /api/users
 Query params:
  - limit (number, default 50, max 200)
  - page (number, default 1)
  - search (string, matches name or email, case-insensitive)
  - sort (createdAt|-createdAt|name|-name|lastLogin|-lastLogin)
  - verified (true|false)
  - admin (true|false)

 Response: { users: [...], page, totalPages, total, limit }
*/
export async function GET(req: NextRequest) {
  try {
    if (!process.env.MONGO_URI) {
      return NextResponse.json({ error: 'MONGO_URI not configured', users: [], total: 0 }, { status: 503 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const search = searchParams.get('search')?.trim();
    const sortParam = searchParams.get('sort') || '-createdAt';
    const verified = searchParams.get('verified');
    const admin = searchParams.get('admin');

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (verified === 'true') query.emailVerified = { $ne: null };
    if (verified === 'false') query.emailVerified = null;
    if (admin === 'true') query.isAdmin = true;
    if (admin === 'false') query.isAdmin = { $ne: true };

    // Sorting
    const sort: Record<string, 1 | -1> = {};
    const mapping: Record<string, string> = {
      createdAt: 'createdAt',
      '-createdAt': '-createdAt',
      name: 'name',
      '-name': '-name',
      lastLogin: 'lastLogin',
      '-lastLogin': '-lastLogin'
    };
    const chosen = mapping[sortParam] || '-createdAt';
    if (chosen.startsWith('-')) sort[chosen.substring(1)] = -1; else sort[chosen] = 1;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('name email isAdmin createdAt lastLogin emailVerified profilePicture')
        .lean(),
      UserModel.countDocuments(query)
    ]);

    return NextResponse.json({
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.isAdmin ? 'admin' : 'user',
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        verified: !!u.emailVerified,
        profilePicture: u.profilePicture || null
      })),
      page,
      totalPages: Math.ceil(total / limit) || 1,
      total,
      limit
    });
  } catch (error: any) {
    console.error('Users list error:', error);
    return NextResponse.json({
      error: 'Failed to fetch users',
      message: error?.message || 'Unknown error',
      users: [],
      total: 0
    }, { status: 500 });
  }
}
