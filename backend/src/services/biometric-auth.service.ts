import crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import UserModel from '../models/user.model';
import AccountModel from '../models/account.model';

export interface BiometricTokenPayload {
  userId: string;
  deviceId: string;
  biometricType: 'fingerprint' | 'face' | 'touch';
  expiresAt: number;
}

export interface BiometricAuthRequest {
  userId: string;
  deviceId: string;
  biometricType: 'fingerprint' | 'face' | 'touch';
  biometricData: string; // Encrypted biometric hash
}

export class BiometricAuthService {
  private static readonly BIOMETRIC_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days
  private static readonly BIOMETRIC_SECRET = process.env.BIOMETRIC_SECRET || process.env.JWT_SECRET || 'biometric-secret-key';

  /**
   * Generate a biometric authentication token
   */
  static async generateBiometricToken(
    userId: string,
    deviceId: string,
    biometricType: 'fingerprint' | 'face' | 'touch'
  ): Promise<string> {
    const payload: BiometricTokenPayload = {
      userId,
      deviceId,
      biometricType,
      expiresAt: Date.now() + this.BIOMETRIC_TOKEN_EXPIRY
    };

    // Generate a unique device fingerprint
    const deviceFingerprint = this.generateDeviceFingerprint(deviceId, biometricType);

    // Store the biometric session in the user's account
    await this.storeBiometricSession(userId, deviceId, deviceFingerprint, biometricType);

    return jwt.sign(payload, this.BIOMETRIC_SECRET, {
      expiresIn: '30d',
      issuer: 'timeline-app',
      audience: 'mobile-app'
    });
  }

  /**
   * Validate a biometric authentication token
   */
  static async validateBiometricToken(token: string): Promise<{
    isValid: boolean;
    userId?: string;
    deviceId?: string;
    biometricType?: string;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.BIOMETRIC_SECRET, {
        issuer: 'timeline-app',
        audience: 'mobile-app'
      }) as BiometricTokenPayload;

      // Check if token is expired
      if (decoded.expiresAt < Date.now()) {
        return { isValid: false, error: 'Token expired' };
      }

      // Verify the biometric session exists and is valid
      const isValidSession = await this.verifyBiometricSession(
        decoded.userId,
        decoded.deviceId,
        decoded.biometricType
      );

      if (!isValidSession) {
        return { isValid: false, error: 'Invalid biometric session' };
      }

      return {
        isValid: true,
        userId: decoded.userId,
        deviceId: decoded.deviceId,
        biometricType: decoded.biometricType
      };
    } catch (error) {
      return { isValid: false, error: 'Invalid token' };
    }
  }

  /**
   * Revoke biometric authentication for a device
   */
  static async revokeBiometricAuth(userId: string, deviceId: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return false;

      // Remove the device from biometric sessions
      if (user.biometricSessions) {
        user.biometricSessions = user.biometricSessions.filter(
          session => session.deviceId !== deviceId
        );
        await user.save();
      }

      return true;
    } catch (error) {
      console.error('Error revoking biometric auth:', error);
      return false;
    }
  }

  /**
   * Get all active biometric sessions for a user
   */
  static async getBiometricSessions(userId: string): Promise<Array<{
    deviceId: string;
    biometricType: string;
    lastUsed: Date;
    deviceInfo: string;
  }>> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.biometricSessions) return [];

      return user.biometricSessions.map(session => ({
        deviceId: session.deviceId,
        biometricType: session.biometricType,
        lastUsed: session.lastUsed,
        deviceInfo: session.deviceInfo
      }));
    } catch (error) {
      console.error('Error getting biometric sessions:', error);
      return [];
    }
  }

  /**
   * Generate a unique device fingerprint
   */
  private static generateDeviceFingerprint(deviceId: string, biometricType: string): string {
    const data = `${deviceId}-${biometricType}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Store biometric session in user document
   */
  private static async storeBiometricSession(
    userId: string,
    deviceId: string,
    deviceFingerprint: string,
    biometricType: string
  ): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');

    // Initialize biometricSessions array if it doesn't exist
    if (!user.biometricSessions) {
      user.biometricSessions = [];
    }

    // Remove existing session for this device
    user.biometricSessions = user.biometricSessions.filter(
      session => session.deviceId !== deviceId
    );

    // Add new session
    user.biometricSessions.push({
      deviceId,
      deviceFingerprint,
      biometricType,
      lastUsed: new Date(),
      deviceInfo: `Mobile Device (${biometricType})`,
      createdAt: new Date()
    });

    await user.save();
  }

  /**
   * Verify biometric session exists and is valid
   */
  private static async verifyBiometricSession(
    userId: string,
    deviceId: string,
    biometricType: string
  ): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.biometricSessions) return false;

      const session = user.biometricSessions.find(
        s => s.deviceId === deviceId && s.biometricType === biometricType
      );

      if (!session) return false;

      // Update last used timestamp
      session.lastUsed = new Date();
      await user.save();

      return true;
    } catch (error) {
      console.error('Error verifying biometric session:', error);
      return false;
    }
  }
}

