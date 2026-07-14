import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import authRepository from './auth.repository';
import authService from './auth.service';
import emailService from '../notification/email.service';
import { mapUserToDTO } from '@healthcare/api-contracts';
import { 
  formatSuccessResponse, 
  BadRequestError, 
  ConflictError, 
  UnauthorizedError,
  ErrorCode 
} from '@healthcare/shared-utils';
import { UserRole } from '@healthcare/shared-types';
import PatientModel from '../patient/Patient.model';
import DoctorModel from '../doctor/Doctor.model';

export class AuthController {
  // Helper to get client IP and User Agent
  private getRequestMeta(req: Request) {
    return {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    };
  }

  // ----------------------------------------------------
  // USER SIGNUP
  // ----------------------------------------------------
  public signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName, role, phoneNumber } = req.body;
      const { ipAddress, userAgent } = this.getRequestMeta(req);

      // Check if user already exists
      const existingUser = await authRepository.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('A user with this email address already exists.', ErrorCode.CONFLICT);
      }

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      // Generate verification token (24 hour expiry)
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create user
      const user = await authRepository.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as UserRole,
        phoneNumber,
        emailVerificationToken,
        emailVerificationExpires
      });

      // Create default Patient/Doctor profile if needed to prevent onboarding deadlocks
      if (role === UserRole.PATIENT) {
        await PatientModel.create({
          userId: user._id,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'OTHER',
          bloodGroup: 'O+',
          address: 'Not Specified',
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Other',
            phone: phoneNumber || '0000000000'
          }
        });
      } else if (role === UserRole.DOCTOR) {
        await DoctorModel.create({
          userId: user._id,
          specialization: 'General Medicine',
          departmentId: 'DEP-GEN',
          qualification: ['MBBS'],
          experienceYears: 1,
          consultationFee: 500,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timeSlots: ['09:00 - 17:00'],
          isActive: true
        });
      }

      // Dispatch verification email asynchronously
      emailService.sendVerificationEmail(email, `${firstName} ${lastName}`, emailVerificationToken);

      // Log success audit trail
      await authRepository.logActivity({
        userId: user.id,
        userRole: user.role,
        action: 'SIGNUP_SUCCESS',
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS'
      });

      res.status(201).json(
        formatSuccessResponse('Registration successful. Please check your email to verify your account.', {
          user: mapUserToDTO(user as any)
        })
      );
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // EMAIL VERIFICATION
  // ----------------------------------------------------
  public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.query.token as string;
      const { ipAddress, userAgent } = this.getRequestMeta(req);

      if (!token) {
        throw new BadRequestError('Verification token is required.', ErrorCode.VALIDATION_FAILED);
      }

      const user = await authRepository.findByVerificationToken(token);
      if (!user) {
        throw new BadRequestError('Invalid or expired verification token.', ErrorCode.VALIDATION_FAILED);
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // Log activity
      await authRepository.logActivity({
        userId: user.id,
        userRole: user.role,
        action: 'EMAIL_VERIFICATION_SUCCESS',
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS'
      });

      res.status(200).json(
        formatSuccessResponse('Email address verified successfully. You can now log in.')
      );
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // USER LOGIN
  // ----------------------------------------------------
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { ipAddress, userAgent } = this.getRequestMeta(req);

      const user = await authRepository.findByEmail(email);
      if (!user) {
        // Prevent enumeration attacks by throwing generic unauthorized
        throw new UnauthorizedError('Invalid email or password.', ErrorCode.UNAUTHORIZED);
      }

      // Check account lockout
      if (user.isLocked) {
        throw new UnauthorizedError(
          `Account is locked. Please try again after ${user.lockUntil?.toLocaleTimeString()}`,
          ErrorCode.ACCOUNT_LOCKED
        );
      }

      // Compare passwords
      const isMatch = await authService.comparePassword(password, user.passwordHash);
      if (!isMatch) {
        await authService.handleFailedLogin(user);
        
        await authRepository.logActivity({
          action: 'LOGIN_FAILURE',
          entity: 'User',
          entityId: user.id,
          ipAddress,
          userAgent,
          status: 'FAILURE'
        });

        throw new UnauthorizedError('Invalid email or password.', ErrorCode.UNAUTHORIZED);
      }

      // Reset login attempts on success
      await authService.resetLoginAttempts(user);

      // Create session and tokens
      const { accessToken, refreshToken } = await authService.createSession(
        user.id,
        user.role,
        ipAddress,
        userAgent
      );

      // Set Refresh Token in secure cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching token expiry
      });

      // Log success audit
      await authRepository.logActivity({
        userId: user.id,
        userRole: user.role,
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS'
      });

      res.status(200).json(
        formatSuccessResponse('Login successful.', {
          accessToken,
          user: mapUserToDTO(user as any)
        })
      );
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // TOKEN REFRESH (RTR)
  // ----------------------------------------------------
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const { ipAddress, userAgent } = this.getRequestMeta(req);

      if (!oldRefreshToken) {
        throw new UnauthorizedError('Refresh token missing.', ErrorCode.UNAUTHORIZED);
      }

      const { accessToken, refreshToken: newRefreshToken } = await authService.rotateRefreshToken(
        oldRefreshToken,
        ipAddress,
        userAgent
      );

      // Set new refresh token in cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json(
        formatSuccessResponse('Session tokens rotated successfully.', {
          accessToken
        })
      );
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await authService.revokeSession(refreshToken);
      }

      // Clear cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json(
        formatSuccessResponse('Logged out successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // FORGOT PASSWORD
  // ----------------------------------------------------
  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const { ipAddress, userAgent } = this.getRequestMeta(req);

      const user = await authRepository.findByEmail(email);
      
      // Standard message returned always to prevent email scraping
      const successResponse = formatSuccessResponse(
        'If an account is associated with this email, reset instructions have been dispatched.'
      );

      if (!user) {
        res.status(200).json(successResponse);
        return;
      }

      // Generate reset token (1 hour expiry)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();

      // Dispatch reset email
      emailService.sendPasswordResetEmail(email, `${user.firstName} ${user.lastName}`, resetToken);

      // Audit log
      await authRepository.logActivity({
        userId: user.id,
        userRole: user.role,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS'
      });

      res.status(200).json(successResponse);
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // RESET PASSWORD
  // ----------------------------------------------------
  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      const { ipAddress, userAgent } = this.getRequestMeta(req);

      if (!token) {
        throw new BadRequestError('Reset token is required.', ErrorCode.VALIDATION_FAILED);
      }

      const user = await authRepository.findByResetToken(token);
      if (!user) {
        throw new BadRequestError('Password reset link is invalid or has expired.', ErrorCode.VALIDATION_FAILED);
      }

      // Reset credentials
      user.passwordHash = await authService.hashPassword(newPassword);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      // Invalidate all active sessions for the user as password changed
      await RefreshTokenModel.updateMany({ userId: user.id }, { isRevoked: true });
      await SessionModel.updateMany({ userId: user.id }, { isValid: false });

      // Audit log
      await authRepository.logActivity({
        userId: user.id,
        userRole: user.role,
        action: 'PASSWORD_RESET_SUCCESS',
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS'
      });

      res.status(200).json(
        formatSuccessResponse('Password reset successful. You can now log in with your new credentials.')
      );
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // OTP REQUEST (MOCK SUPPORT)
  // ----------------------------------------------------
  public requestOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const { ipAddress, userAgent } = this.getRequestMeta(req);

      const user = await authRepository.findByEmail(email);
      if (!user) {
        throw new BadRequestError('Account does not exist.', ErrorCode.NOT_FOUND);
      }

      // Generate 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Hash OTP and set 10 minute expiry
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      user.otpHash = otpHash;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      // Dispatch OTP email
      emailService.sendOTPEmail(email, `${user.firstName} ${user.lastName}`, otp);

      // Log request activity
      await authRepository.logActivity({
        userId: user.id,
        userRole: user.role,
        action: 'OTP_REQUESTED',
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS'
      });

      res.status(200).json(
        formatSuccessResponse('6-digit verification code has been dispatched to your registered email.')
      );
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // OTP LOGIN VERIFICATION
  // ----------------------------------------------------
  public verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp } = req.body;
      const { ipAddress, userAgent } = this.getRequestMeta(req);

      const user = await authRepository.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Invalid credentials.', ErrorCode.UNAUTHORIZED);
      }

      if (!user.otpHash || !user.otpExpires || user.otpExpires.getTime() < Date.now()) {
        throw new BadRequestError('Verification code has expired or is invalid.', ErrorCode.VALIDATION_FAILED);
      }

      // Compare SHA256 hashes
      const submittedHash = crypto.createHash('sha256').update(otp).digest('hex');
      if (user.otpHash !== submittedHash) {
        throw new UnauthorizedError('Invalid verification code.', ErrorCode.UNAUTHORIZED);
      }

      // Clear OTP details
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save();

      // Create session tokens
      const { accessToken, refreshToken } = await authService.createSession(
        user.id,
        user.role,
        ipAddress,
        userAgent
      );

      // Set Refresh Token cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Audit log success
      await authRepository.logActivity({
        userId: user.id,
        userRole: user.role,
        action: 'OTP_LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS'
      });

      res.status(200).json(
        formatSuccessResponse('Login verified.', {
          accessToken,
          user: mapUserToDTO(user as any)
        })
      );
    } catch (error) {
      next(error);
    }
  };
}

// Export models inside controller file to satisfy references
import RefreshTokenModel from './RefreshToken.model';
import SessionModel from './Session.model';

export default new AuthController();
