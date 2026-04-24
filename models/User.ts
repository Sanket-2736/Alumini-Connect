import mongoose, { Document, Schema } from 'mongoose';

import { UserRole, VerificationStatus } from '@/lib/enums';

export interface IWorkDetails {
  company: string;
  jobTitle: string;
  experienceYears: number;
}

export interface ISocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
}

export interface INotificationPreferences {
  emailOnMessage: boolean;
  emailOnConnection: boolean;
  emailOnJob: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  university: mongoose.Types.ObjectId;
  department: string;
  batch: string;
  profilePicture?: string; // Cloudinary URL
  bio?: string;
  workDetails?: IWorkDetails;
  skills: string[];
  socialLinks?: ISocialLinks;
  verificationStatus: VerificationStatus;
  verificationDocs: string[]; // Cloudinary URLs for documents
  rejectionReason?: string;
  isEmailVerified: boolean;
  isBanned: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  refreshTokens: string[]; // Hashed refresh tokens
  lastSeen?: Date;
  savedPosts: mongoose.Types.ObjectId[];
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const workDetailsSchema = new Schema<IWorkDetails>({
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  experienceYears: { type: Number, required: true, min: 0 },
});

const socialLinksSchema = new Schema<ISocialLinks>({
  linkedin: { type: String },
  github: { type: String },
  twitter: { type: String },
});

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    university: {
      type: Schema.Types.ObjectId,
      ref: 'University',
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicture: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    workDetails: workDetailsSchema,
    skills: [{
      type: String,
      trim: true,
    }],
    socialLinks: socialLinksSchema,
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.NOT_SUBMITTED,
    },
    verificationDocs: [{
      type: String, // Cloudinary URLs
    }],
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpiry: {
      type: Date,
    },
    refreshTokens: [{
      type: String, // Hashed tokens
    }],
    lastSeen: { type: Date },
    savedPosts: [{
      type: Schema.Types.ObjectId,
      ref: 'Post'
    }],
    notificationPreferences: {
      emailOnMessage: { type: Boolean, default: true },
      emailOnConnection: { type: Boolean, default: true },
      emailOnJob: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ verificationStatus: 1 });
userSchema.index({ isBanned: 1 });

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;