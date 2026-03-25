import mongoose, { Document, Schema } from "mongoose";
import { ProviderEnum, ProviderEnumType } from "../enums/account-provider.enum";

export interface AccountDocument extends Document {
  provider: ProviderEnumType;
  providerId: string; // Unique identifier from provider (email for local auth)
  providerAccountId?: string; // Optional field for NextAuth.js compatibility
  userId: mongoose.Types.ObjectId;
  refreshToken: string | null;
  tokenExpiry: Date | null;
  createdAt: Date;
}

const accountSchema = new Schema<AccountDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      required: true,
    },
    providerId: {
      type: String,
      required: true,
      unique: true,
    },
    providerAccountId: {
      type: String,
      sparse: true, // Allow multiple null values but ensure uniqueness for non-null values
    },
    refreshToken: { type: String, default: null },
    tokenExpiry: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        // Use 'delete' only if property is optional
        if ('refreshToken' in ret) {
          (ret as any).refreshToken = undefined;
        }
      },
    },
  }
);

// Create a compound index that handles both providerId and providerAccountId
// This ensures uniqueness while allowing the existing providerId unique constraint
accountSchema.index({ provider: 1, providerAccountId: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { providerAccountId: { $exists: true, $ne: null } }
});

const AccountModel = mongoose.models.Account || mongoose.model<AccountDocument>("Account", accountSchema);
export default AccountModel;
