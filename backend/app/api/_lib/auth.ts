import { NextRequest } from 'next/server';
import UserModel from '../../../src/models/user.model';
import { verifyJwt } from '@/src/utils/jwt';

function getHeader(req: NextRequest, name: string): string | undefined {
  if (!req) return undefined;
  return req.headers.get(name) || undefined;
}

function getCookie(req: NextRequest, name: string): string | undefined {
  if (!req) return undefined;
  return req.cookies.get(name)?.value;
}

export async function getDbUserFromRequest(req?: NextRequest) {
  if (!req) return null;

  // Support forced user id for internal/testing
  const forcedId = getHeader(req, 'x-user-id');
  if (forcedId) {
    try {
      const user = await UserModel.findById(forcedId).select('-password');
      if (user) {
        return user;
      }
    } catch { /* ignore */ }
  }

  const bearer = getHeader(req, 'authorization');
  const bearerToken = bearer?.startsWith('Bearer ') ? bearer.slice('Bearer '.length) : undefined;
  const cookieToken = getCookie(req, 'auth_token');
  const token = cookieToken || bearerToken;

  if (!token) {
    return null;
  }

  try {
    const decoded = verifyJwt(token);
    if (!decoded?.sub) {
      return null;
    }

    const user = await UserModel.findById(decoded.sub).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}
