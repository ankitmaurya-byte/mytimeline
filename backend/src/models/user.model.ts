import mongoose, { Document, Schema } from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";

export interface BiometricSession {
  deviceId: string;
  deviceFingerprint: string;
  biometricType: 'fingerprint' | 'face' | 'touch';
  lastUsed: Date;
  deviceInfo: string;
  createdAt: Date;
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

export interface UserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  profilePicture: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
  currentWorkspace: mongoose.Types.ObjectId | null;
  isAdmin?: boolean;
  superAdmin?: boolean;
  emailVerified?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpires?: Date | null;
  biometricSessions?: BiometricSession[];
  rememberMeSessions?: RememberMeSession[];
  omitPassword(): Omit<UserDocument, "password">;
}

const biometricSessionSchema = new Schema<BiometricSession>({
  deviceId: { type: String, required: true },
  deviceFingerprint: { type: String, required: true },
  biometricType: {
    type: String,
    enum: ['fingerprint', 'face', 'touch'],
    required: true
  },
  lastUsed: { type: Date, default: Date.now },
  deviceInfo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const rememberMeSessionSchema = new Schema<RememberMeSession>({
  tokenId: { type: String, required: true },
  deviceId: { type: String, required: true },
  deviceInfo: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  lastUsed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, select: true },
    profilePicture: {
      type: String,
      default: null,
    },
    currentWorkspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
    },
    isAdmin: { type: Boolean, default: false },
    superAdmin: { type: Boolean, default: false },
    emailVerified: { type: Date, default: null },
    emailVerificationToken: { type: String, default: null },
    emailVerificationTokenExpires: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    lastSeen: { type: Date, default: null },
    biometricSessions: [biometricSessionSchema],
    rememberMeSessions: [rememberMeSessionSchema]
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    if (this.password) {
      this.password = await hashValue(this.password);
    }
  }
  next();
});

userSchema.methods.omitPassword = function (): Omit<UserDocument, "password"> {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

userSchema.methods.comparePassword = async function (value: string) {
  return compareValue(value, this.password);
};

const UserModel = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

// Performance indexes for common query patterns
userSchema.index({ _id: 1 }); // Primary index for _id queries (should be automatic but explicit for clarity)
userSchema.index({ currentWorkspace: 1 }); // Index for current workspace queries
userSchema.index({ isActive: 1 }); // Index for active user filtering
userSchema.index({ isAdmin: 1 }); // Index for admin filtering
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });

// Indexes for biometric and remember me sessions
userSchema.index({ 'biometricSessions.deviceId': 1 });
userSchema.index({ 'rememberMeSessions.tokenId': 1 }, { unique: true, sparse: true });
userSchema.index({ 'rememberMeSessions.deviceId': 1 });
userSchema.index({ 'rememberMeSessions.expiresAt': 1 }); // For cleanup queries

export default UserModel;
