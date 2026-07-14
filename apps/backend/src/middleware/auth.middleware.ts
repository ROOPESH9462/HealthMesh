import { Request, Response, NextFunction } from 'express';
import UserModel, { IUserDocument } from '../modules/auth/User.model';
import authService from '../modules/auth/auth.service';
import logger from '../utils/logger';
import { UnauthorizedError, ForbiddenError, ErrorCode } from '@healthcare/shared-utils';
import { UserRole } from '@healthcare/shared-types';

// Extend Request type to include user object
export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
}

export async function protect(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // Read Bearer token from Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Fallback: read from cookies
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new UnauthorizedError('You are not logged in. Please log in to get access.', ErrorCode.UNAUTHORIZED));
    }

    // Verify access token
    const decoded = authService.verifyAccessToken(token);

    // Fetch user from database
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.', ErrorCode.UNAUTHORIZED));
    }

    // Check if account has been soft-deleted
    if (user.isDeleted) {
      return next(new UnauthorizedError('This account has been deactivated.', ErrorCode.UNAUTHORIZED));
    }

    // Check if account is currently locked
    if (user.isLocked) {
      return next(new UnauthorizedError('This account is locked. Please try again later or reset your password.', ErrorCode.ACCOUNT_LOCKED));
    }

    // Attach user profile to request scope
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function restrictTo(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('You are not logged in.', ErrorCode.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Forbidden access attempt. User ID: ${req.user.id} (Role: ${req.user.role}) tried to access resource requiring: [${roles.join(', ')}]`);
      return next(new ForbiddenError('You do not have permission to perform this action.', ErrorCode.FORBIDDEN));
    }

    next();
  };
}
