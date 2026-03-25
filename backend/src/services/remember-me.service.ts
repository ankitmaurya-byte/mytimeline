import crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import UserModel from '../models/user.model';
import AccountModel from '../models/account.model';

export interface RememberMeTokenPayload {
  userId: string;
  deviceId: string;
  tokenId: string;
  expiresAt: number;
  lastUsed: number;
}

export interface RememberMeSession {
  tokenId: string;
  deviceId: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  lastUsed: Date;
  createdAt: Date;
  expiresAt: Date;
}

export class RememberMeService {
  private static readonly REMEMBER_ME_EXPIRY = 14 * 24 * 60 * 60 * 1000; // 14 days
  private static readonly REMEMBER_ME_SECRET = process.env.REMEMBER_ME_SECRET || process.env.JWT_SECRET || 'remember-me-secret-key';
  private static readonly MAX_DEVICES_PER_USER = 3;

  /**
   * Generate a remember me token
   */
  static async generateRememberMeToken(
    userId: string,
    deviceId: string,
    deviceInfo: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ token: string; expiresAt: Date }> {
    // Check if user has too many devices
    const deviceCount = await this.getUserDeviceCount(userId);
    if (deviceCount >= this.MAX_DEVICES_PER_USER) {
      throw new Error('Maximum number of remembered devices reached. Please remove a device first.');
    }

    const tokenId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.REMEMBER_ME_EXPIRY);

    const payload: RememberMeTokenPayload = {
      userId,
      deviceId,
      tokenId,
      expiresAt: expiresAt.getTime(),
      lastUsed: Date.now()
    };

    // Store the remember me session
    await this.storeRememberMeSession(userId, tokenId, deviceId, deviceInfo, ipAddress, userAgent, expiresAt);

    const token = jwt.sign(payload, this.REMEMBER_ME_SECRET, {
      expiresIn: '14d',
      issuer: 'timeline-app',
      audience: 'web-app'
    });

    return { token, expiresAt };
  }

  /**
   * Validate a remember me token
   */
  static async validateRememberMeToken(token: string): Promise<{
    isValid: boolean;
    userId?: string;
    deviceId?: string;
    tokenId?: string;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.REMEMBER_ME_SECRET, {
        issuer: 'timeline-app',
        audience: 'web-app'
      }) as RememberMeTokenPayload;

      // Check if token is expired
      if (decoded.expiresAt < Date.now()) {
        return { isValid: false, error: 'Token expired' };
      }

      // Verify the remember me session exists and is valid
      const isValidSession = await this.verifyRememberMeSession(
        decoded.userId,
        decoded.tokenId,
        decoded.deviceId
      );

      if (!isValidSession) {
        return { isValid: false, error: 'Invalid remember me session' };
      }

      // Update last used timestamp
      await this.updateLastUsed(decoded.userId, decoded.tokenId);

      return {
        isValid: true,
        userId: decoded.userId,
        deviceId: decoded.deviceId,
        tokenId: decoded.tokenId
      };
    } catch (error) {
      return { isValid: false, error: 'Invalid token' };
    }
  }

  /**
   * Revoke remember me token for a specific device
   */
  static async revokeRememberMeToken(userId: string, tokenId: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return false;

      if (user.rememberMeSessions) {
        user.rememberMeSessions = user.rememberMeSessions.filter(
          session => session.tokenId !== tokenId
        );
        await user.save();
      }

      return true;
    } catch (error) {
      console.error('Error revoking remember me token:', error);
      return false;
    }
  }

  /**
   * Revoke all remember me tokens for a user
   */
  static async revokeAllRememberMeTokens(userId: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return false;

      if (user.rememberMeSessions) {
        user.rememberMeSessions = [];
        await user.save();
      }

      return true;
    } catch (error) {
      console.error('Error revoking all remember me tokens:', error);
      return false;
    }
  }

  /**
   * Get all remember me sessions for a user
   */
  static async getRememberMeSessions(userId: string): Promise<RememberMeSession[]> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.rememberMeSessions) return [];

      return user.rememberMeSessions.map(session => ({
        tokenId: session.tokenId,
        deviceId: session.deviceId,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastUsed: session.lastUsed,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      }));
    } catch (error) {
      console.error('Error getting remember me sessions:', error);
      return [];
    }
  }

  /**
   * Clean up expired remember me sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const users = await UserModel.find({
        'rememberMeSessions.expiresAt': { $lt: new Date() }
      });

      let cleanedCount = 0;
      for (const user of users) {
        if (user.rememberMeSessions) {
          const originalCount = user.rememberMeSessions.length;
          user.rememberMeSessions = user.rememberMeSessions.filter(
            session => session.expiresAt > new Date()
          );

          if (user.rememberMeSessions.length < originalCount) {
            await user.save();
            cleanedCount += (originalCount - user.rememberMeSessions.length);
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get count of user's remembered devices
   */
  private static async getUserDeviceCount(userId: string): Promise<number> {
    try {
      const user = await UserModel.findById(userId);
      return user?.rememberMeSessions?.length || 0;
    } catch (error) {
      console.error('Error getting user device count:', error);
      return 0;
    }
  }

  /**
   * Store remember me session in user document
   */
  private static async storeRememberMeSession(
    userId: string,
    tokenId: string,
    deviceId: string,
    deviceInfo: string,
    ipAddress: string,
    userAgent: string,
    expiresAt: Date
  ): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');

    // Initialize rememberMeSessions array if it doesn't exist
    if (!user.rememberMeSessions) {
      user.rememberMeSessions = [];
    }

    // Remove existing session for this device
    user.rememberMeSessions = user.rememberMeSessions.filter(
      session => session.deviceId !== deviceId
    );

    // Add new session
    user.rememberMeSessions.push({
      tokenId,
      deviceId,
      deviceInfo,
      ipAddress,
      userAgent,
      lastUsed: new Date(),
      createdAt: new Date(),
      expiresAt
    });

    await user.save();
  }

  /**
   * Verify remember me session exists and is valid
   */
  private static async verifyRememberMeSession(
    userId: string,
    tokenId: string,
    deviceId: string
  ): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.rememberMeSessions) return false;

      const session = user.rememberMeSessions.find(
        s => s.tokenId === tokenId && s.deviceId === deviceId
      );

      if (!session) return false;

      // Check if session is expired
      if (session.expiresAt < new Date()) return false;

      return true;
    } catch (error) {
      console.error('Error verifying remember me session:', error);
      return false;
    }
  }

  /**
   * Update last used timestamp for a session
   */
  private static async updateLastUsed(userId: string, tokenId: string): Promise<void> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.rememberMeSessions) return;

      const session = user.rememberMeSessions.find(s => s.tokenId === tokenId);
      if (session) {
        session.lastUsed = new Date();
        await user.save();
      }
    } catch (error) {
      console.error('Error updating last used timestamp:', error);
    }
  }
}

