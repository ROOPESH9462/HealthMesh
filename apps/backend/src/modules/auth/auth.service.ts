import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { IUserDocument } from './User.model';
import RefreshTokenModel from './RefreshToken.model';
import SessionModel from './Session.model';
import logger from '../../utils/logger';
import { UnauthorizedError, ErrorCode } from '@healthcare/shared-utils';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS || '12', 10);

export interface ITokenPayload {
  userId: string;
  role: string;
}

export class AuthService {
  // ----------------------------------------------------
  // PASSWORD CRYPTOGRAPHY
  // ----------------------------------------------------
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // ----------------------------------------------------
  // ACCOUNT LOCKOUT SECURITY
  // ----------------------------------------------------
  public async handleFailedLogin(user: IUserDocument): Promise<void> {
    user.loginAttempts += 1;
    
    // Lock account for 15 minutes after 5 failed attempts
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      logger.warn(`User account locked due to excessive failed attempts: ${user.email}`);
    }
    
    await user.save();
  }

  public async resetLoginAttempts(user: IUserDocument): Promise<void> {
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }
  }

  // ----------------------------------------------------
  // JWT GENERATION
  // ----------------------------------------------------
  public generateAccessToken(payload: ITokenPayload): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY as any });
  }

  public generateRefreshToken(payload: ITokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY as any });
  }

  public verifyAccessToken(token: string): ITokenPayload {
    try {
      return jwt.verify(token, JWT_ACCESS_SECRET) as ITokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid access token.', ErrorCode.UNAUTHORIZED);
    }
  }

  // ----------------------------------------------------
  // REFRESH TOKEN ROTATION (RTR) & REVOCATION
  // ----------------------------------------------------
  public async rotateRefreshToken(
    oldToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: any;
    try {
      decoded = jwt.verify(oldToken, JWT_REFRESH_SECRET);
    } catch (err) {
      logger.error('Failed to verify old refresh token:', err);
      throw new UnauthorizedError('Invalid or expired session token.', ErrorCode.UNAUTHORIZED);
    }

    const userId = decoded.userId;
    const role = decoded.role;

    // Find token record in database
    const tokenRecord = await RefreshTokenModel.findOne({ token: oldToken });

    // REUSE DETECTION LOGIC: If token is not found or is already revoked
    if (!tokenRecord || tokenRecord.isRevoked) {
      logger.warn(`POTENTIAL TOKEN REUSE DETECTED. Revoking all refresh tokens for user ID: ${userId}`);
      
      // Revoke all refresh tokens for the user to force re-authentication
      await RefreshTokenModel.updateMany({ userId }, { isRevoked: true });
      await SessionModel.updateMany({ userId }, { isValid: false });
      
      throw new UnauthorizedError(
        'Potential session hijacking detected. Please login again.',
        ErrorCode.UNAUTHORIZED
      );
    }

    // Mark current token as revoked and rotated
    const newAccessToken = this.generateAccessToken({ userId, role });
    const newRefreshToken = this.generateRefreshToken({ userId, role });
    
    // Decode new refresh token expiry
    const newDecoded: any = jwt.decode(newRefreshToken);
    const expiresAt = new Date(newDecoded.exp * 1000);

    // Save rotation lineage under transaction session if required, here we use simple queries
    tokenRecord.isRevoked = true;
    tokenRecord.replacedByToken = newRefreshToken;
    await tokenRecord.save();

    // Save new refresh token record
    await RefreshTokenModel.create({
      token: newRefreshToken,
      userId: new mongoose.Types.ObjectId(userId),
      expiresAt,
      isRevoked: false
    });

    // Update session token
    await SessionModel.findOneAndUpdate(
      { token: oldToken },
      {
        token: newRefreshToken,
        expiresAt,
        ipAddress,
        userAgent
      }
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  public async createSession(
    userId: string,
    role: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken({ userId, role });
    const refreshToken = this.generateRefreshToken({ userId, role });

    // Decode refresh token to get exact expiry date
    const decoded: any = jwt.decode(refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);

    // Save refresh token record
    await RefreshTokenModel.create({
      token: refreshToken,
      userId: new mongoose.Types.ObjectId(userId),
      expiresAt,
      isRevoked: false
    });

    // Save session record
    await SessionModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      token: refreshToken,
      ipAddress,
      userAgent,
      expiresAt,
      isValid: true
    });

    return { accessToken, refreshToken };
  }

  public async revokeSession(token: string): Promise<void> {
    // Revoke refresh token and invalidate browser session
    await RefreshTokenModel.findOneAndUpdate({ token }, { isRevoked: true });
    await SessionModel.findOneAndUpdate({ token }, { isValid: false });
  }
}

export default new AuthService();
