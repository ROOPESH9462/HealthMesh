import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole } from '@healthcare/shared-types';

export interface IUserDocument extends Omit<IUser, 'id'>, Document {
  passwordHash: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  otpHash?: string;
  otpExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  isLocked?: boolean;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: [true, 'User role is required']
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    // Authentication security counters
    loginAttempts: {
      type: Number,
      default: 0,
      required: true
    },
    lockUntil: {
      type: Date
    },
    // Verification & Reset tokens
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    otpHash: String,
    otpExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Soft Delete history preservation
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true
    },
    deletedAt: Date,
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const json = ret as any;
        json.id = json._id.toString();
        delete json._id;
        delete json.__v;
        delete json.passwordHash;
        delete json.emailVerificationToken;
        delete json.emailVerificationExpires;
        delete json.otpHash;
        delete json.otpExpires;
        delete json.resetPasswordToken;
        delete json.resetPasswordExpires;
        return json;
      }
    }
  }
);

// Indexes for query optimizations
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Helper instance method to check if user account is locked
UserSchema.virtual('isLocked').get(function (this: IUserDocument) {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

const UserModel = mongoose.model<IUserDocument>('User', UserSchema);

export default UserModel;
