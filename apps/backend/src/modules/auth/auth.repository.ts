import mongoose from 'mongoose';
import UserModel, { IUserDocument } from './User.model';
import ActivityLogModel, { IActivityLogDocument } from '../analytics/ActivityLog.model';
import { UserRole } from '@healthcare/shared-types';

export class AuthRepository {
  public async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email, isDeleted: false });
  }

  public async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id);
  }

  public async findByVerificationToken(token: string): Promise<IUserDocument | null> {
    return UserModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });
  }

  public async findByResetToken(token: string): Promise<IUserDocument | null> {
    return UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
  }

  public async createUser(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phoneNumber?: string;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
  }): Promise<IUserDocument> {
    return UserModel.create(userData);
  }

  // ----------------------------------------------------
  // AUDIT LOG REGISTRATION
  // ----------------------------------------------------
  public async logActivity(activity: {
    userId?: string;
    userRole?: UserRole;
    action: string;
    entity: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    status: 'SUCCESS' | 'FAILURE';
  }): Promise<IActivityLogDocument> {
    return ActivityLogModel.create({
      userId: activity.userId ? new mongoose.Types.ObjectId(activity.userId) : undefined,
      userRole: activity.userRole,
      action: activity.action,
      entity: activity.entity,
      entityId: activity.entityId,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      status: activity.status,
      timestamp: new Date()
    });
  }
}

export default new AuthRepository();
