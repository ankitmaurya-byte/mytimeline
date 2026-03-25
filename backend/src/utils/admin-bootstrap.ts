import UserModel from '../models/user.model';
import AccountModel from '../models/account.model';
import { ProviderEnum } from '../enums/account-provider.enum';
import mongoose from 'mongoose';

let ran = false;

export async function ensureAdminBootstrap() {
  if (ran) return; // idempotent
  ran = true;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return; // nothing to do

  try {
    let user = await UserModel.findOne({ email });
    if (!user) {
      user = new UserModel({
        email,
        name: 'Admin',
        isAdmin: true,
        currentWorkspace: null,
        password, // hashed by pre-save hook
        emailVerified: new Date(),
      } as any);
      await user.save();
      const acct = new AccountModel({
        provider: ProviderEnum.EMAIL,
        providerId: email,
        userId: user._id as mongoose.Types.ObjectId,
      });
      await acct.save();
      console.log('[admin-bootstrap] Created admin user', email);
    } else {
      let updated = false;
      if (!user.isAdmin) { user.isAdmin = true; updated = true; }
      if (password) { user.password = password; updated = true; }
      if (!user.emailVerified) { user.emailVerified = new Date(); updated = true; }
      // Ensure account exists
      const existingAcct = await AccountModel.findOne({ provider: ProviderEnum.EMAIL, providerId: email });
      if (!existingAcct) {
        const acct = new AccountModel({
          provider: ProviderEnum.EMAIL,
          providerId: email,
          userId: user._id as mongoose.Types.ObjectId,
        });
        await acct.save();
        console.log('[admin-bootstrap] Created missing account record for admin email');
      }
      if (updated) {
        await user.save();
        console.log('[admin-bootstrap] Updated existing user (admin/promoted/password rotated)', email);
      }
    }
  } catch (err: any) {
    console.error('[admin-bootstrap] Failed:', err?.message || err);
  }
}
