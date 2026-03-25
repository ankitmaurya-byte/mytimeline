import mongoose from "mongoose";
import UserModel from "../models/user.model";
import AccountModel from "../models/account.model";
import WorkspaceModel from "../models/workspace.model";
import RoleModel from "../models/roles-permission.model";
import { Roles } from "../enums/role.enum";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";
import MemberModel from "../models/member.model";
import { ProviderEnum } from "../enums/account-provider.enum";
import { createDefaultProjectForWorkspace } from "./default-project.service";
import crypto from 'crypto';

export const loginOrCreateAccountService = async (data: {
  provider: string;
  displayName: string;
  providerId: string;
  picture?: string;
  email?: string;
}) => {
  const { providerId, provider, displayName, email, picture } = data;

  // console.log('[loginOrCreateAccountService] Called with:', {
  //   provider,
  //   displayName,
  //   email: email ? '***provided***' : 'NOT_PROVIDED',
  //   picture: picture ? '***provided***' : 'NOT_PROVIDED',
  //   pictureUrl: picture
  // });

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find user by email only (legacy clerkId removed)
    let user = await UserModel.findOne({ email }).session(session);

    if (!user) {
      // Create a new user if it doesn't exist
      user = new UserModel({
        email,
        name: displayName,
        profilePicture: picture || null,
        emailVerified: new Date(), // OAuth users have already verified their email with the provider
      });
      await user.save({ session });

      const account = new AccountModel({
        userId: user._id,
        provider: provider,
        providerId: providerId,
      });
      await account.save({ session });

      // NOTE: We don't automatically create a workspace for new users anymore
      // They will be guided to create their first workspace through the onboarding flow
      // This ensures new users see the welcome page and can manually create workspaces
    } else {
      // Handle existing user - check if they have a currentWorkspace
      if (!user.currentWorkspace) {
        // Find user's first workspace (they might have one from manual creation)
        const memberRecord = await MemberModel.findOne({ userId: user._id })
          .session(session);

        if (memberRecord) {
          user.currentWorkspace = memberRecord.workspaceId as mongoose.Types.ObjectId;
          await user.save({ session });
        }
        // NOTE: We don't automatically create workspaces anymore
        // If user has no workspaces, they'll be guided to create one through the UI
      }

      // Update user profile info from provider if needed
      let needsUpdate = false;

      if (user.name !== displayName) {
        user.name = displayName;
        needsUpdate = true;
      }

      // Only update profile picture from OAuth if user doesn't have a custom uploaded one
      // Custom uploaded pictures start with /api/uploads/, /uploads/, or data: (base64)
      const hasCustomProfilePicture = user.profilePicture &&
        (user.profilePicture.startsWith('/api/uploads/') ||
          user.profilePicture.startsWith('/uploads/') ||
          user.profilePicture.startsWith('data:') ||
          user.profilePicture.includes('profile-'));



      // If the user is signing in via OAuth and their email isn't verified yet,
      // mark it as verified since OAuth providers have already verified the email
      if (!user.emailVerified) {
        user.emailVerified = new Date();
        user.emailVerificationToken = null;
        user.emailVerificationTokenExpires = null;
        needsUpdate = true;
      }

      // Check if this OAuth account is already linked to the user
      const existingOAuthAccount = await AccountModel.findOne({
        userId: user._id,
        provider: provider,
        providerId: providerId
      }).session(session);

      // If this is a new OAuth provider for this user, create an account record
      if (!existingOAuthAccount) {
        const newOAuthAccount = new AccountModel({
          userId: user._id,
          provider: provider,
          providerId: providerId,
        });
        await newOAuthAccount.save({ session });
      }

      // (Removed legacy clerkId update logic)

      if (needsUpdate) {
        await user.save({ session });
      }
    }
    await session.commitTransaction();
    session.endSession();

    return { user };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  } finally {
    session.endSession();
  }
};

export const registerUserService = async (body: {
  email: string;
  name: string;
  password: string;
}) => {
  const { email, name, password } = body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await UserModel.findOne({ email }).session(session);
    if (existingUser) {
      throw new BadRequestException("Email already exists");
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new UserModel({
      email,
      name,
      password,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
    });
    await user.save({ session });

    const account = new AccountModel({
      userId: user._id,
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });
    await account.save({ session });

    // NOTE: We don't automatically create a workspace for new users anymore
    // They will be guided to create their first workspace through the onboarding flow
    // This ensures new users see the welcome page and can manually create workspaces

    await session.commitTransaction();
    session.endSession();

    return {
      userId: user._id,
      emailVerificationToken: verificationToken,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error;
  }
};

export const verifyUserService = async ({
  email,
  password,
  provider = ProviderEnum.EMAIL,
}: {
  email: string;
  password: string;
  provider?: string;
}) => {
  const account = await AccountModel.findOne({ provider, providerId: email });
  if (!account) {
    throw new NotFoundException("Invalid email or password");
  }

  const user = await UserModel.findById(account.userId);

  if (!user) {
    throw new NotFoundException("User not found for the given account");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedException("Invalid email or password");
  }

  return user.omitPassword();
};
