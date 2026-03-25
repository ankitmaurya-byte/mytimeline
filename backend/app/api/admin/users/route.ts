import { NextRequest } from 'next/server';
import { ensureDb } from '../../_lib/db';
import { getDbUserFromRequest } from '../../_lib/auth';
import UserModel from '../../../../src/models/user.model';
import { HTTPSTATUS } from '../../../../src/config/http.config';
import { withCORS } from '../../_lib/cors';

export const dynamic = 'force-dynamic';

export const OPTIONS = withCORS(() => new Response(null, { status: 204 }));

export const GET = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
    const admin = await getDbUserFromRequest(req);
    if (!admin) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: HTTPSTATUS.UNAUTHORIZED });
    if (!(admin as any).isAdmin) {
      const existingAdmins = await UserModel.countDocuments({ isAdmin: true });
      if (existingAdmins === 0) {
        await UserModel.updateOne({ _id: (admin as any)._id }, { $set: { isAdmin: true } });
        (admin as any).isAdmin = true;
        console.log('[admin-bootstrap] Promoted first user to admin');
      }
    }
    if (!(admin as any).isAdmin) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), { status: HTTPSTATUS.FORBIDDEN });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));
    const search = url.searchParams.get('search')?.trim();
    const sort = url.searchParams.get('sort') || 'createdAt';
    const dir = url.searchParams.get('dir') === 'asc' ? 1 : -1;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter)
      .select('-password')
      .sort({ [sort]: dir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return new Response(JSON.stringify({
      message: 'ok',
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      }
    }), { status: HTTPSTATUS.OK });
  } catch (e: any) {
    return new Response(JSON.stringify({ message: e?.message || 'Internal Error' }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
  }
});

// POST method to handle admin dismissal fallback
export const POST = withCORS(async (req: NextRequest) => {
  try {
    console.log('🔧 [ADMIN/USERS] POST fallback called for admin dismissal');

    await ensureDb();
    const admin = await getDbUserFromRequest(req);
    if (!admin) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: HTTPSTATUS.UNAUTHORIZED });

    const body = await req.json();
    console.log('🔧 [ADMIN/USERS] Request body:', body);

    // Handle admin dismissal action
    if (body.action === 'dismiss' && body.workspaceId && body.memberId) {
      // Import the admin service here to avoid circular deps
      const { AdminUserManagementService } = await import('../../../../src/services/admin-user-management.service');

      await AdminUserManagementService.dismissUserFromWorkspace(
        String((admin as any)._id),
        body.workspaceId,
        body.memberId
      );

      return new Response(JSON.stringify({ message: 'Admin successfully dismissed' }), { status: HTTPSTATUS.OK });
    }

    return new Response(JSON.stringify({ message: 'Invalid action' }), { status: HTTPSTATUS.BAD_REQUEST });

  } catch (e: any) {
    console.error('[admin/users] POST error:', e);
    return new Response(JSON.stringify({ message: e?.message || 'Internal Error' }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
  }
});

export const DELETE = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
    const admin = await getDbUserFromRequest(req);
    if (!admin) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: HTTPSTATUS.UNAUTHORIZED });
    if (!(admin as any).isAdmin) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), { status: HTTPSTATUS.FORBIDDEN });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, userIds } = body || {};

    // Handle single user deletion
    if (userId && !userIds) {
      // Prevent admin from deleting themselves
      if (String((admin as any)._id) === String(userId)) {
        return new Response(JSON.stringify({ message: 'Cannot delete your own account' }), { status: HTTPSTATUS.BAD_REQUEST });
      }

      // Check if user exists
      const userToDelete = await UserModel.findById(userId);
      if (!userToDelete) {
        return new Response(JSON.stringify({ message: 'User not found' }), { status: HTTPSTATUS.NOT_FOUND });
      }

      // Prevent deletion of other admins
      if ((userToDelete as any).isAdmin) {
        return new Response(JSON.stringify({ message: 'Cannot delete admin accounts' }), { status: HTTPSTATUS.FORBIDDEN });
      }

      // Delete the user
      await UserModel.deleteOne({ _id: userId });

      console.log(`[admin/users] User deleted by admin ${(admin as any)._id}: ${userId}`);

      return new Response(JSON.stringify({
        message: 'User deleted successfully',
        deletedUserId: userId
      }), { status: HTTPSTATUS.OK });
    }

    // Handle bulk user deletion
    if (userIds && Array.isArray(userIds)) {
      // Prevent admin from deleting themselves
      const filteredUserIds = userIds.filter(id => String(id) !== String((admin as any)._id));

      if (filteredUserIds.length === 0) {
        return new Response(JSON.stringify({ message: 'No valid users to delete' }), { status: HTTPSTATUS.BAD_REQUEST });
      }

      // Check if any of the users are admins
      const usersToDelete = await UserModel.find({
        _id: { $in: filteredUserIds },
        isAdmin: { $ne: true } // Exclude admins
      }).select('_id');

      const validUserIds = usersToDelete.map(u => String(u._id));

      if (validUserIds.length === 0) {
        return new Response(JSON.stringify({ message: 'No valid users to delete' }), { status: HTTPSTATUS.BAD_REQUEST });
      }

      // Delete the users
      const result = await UserModel.deleteMany({ _id: { $in: validUserIds } });

      console.log(`[admin/users] Bulk delete by admin ${(admin as any)._id}: ${result.deletedCount} users deleted`);

      return new Response(JSON.stringify({
        message: `Successfully deleted ${result.deletedCount} users`,
        deletedCount: result.deletedCount,
        deletedUserIds: validUserIds
      }), { status: HTTPSTATUS.OK });
    }

    return new Response(JSON.stringify({ message: 'Either userId or userIds array is required' }), { status: HTTPSTATUS.BAD_REQUEST });

  } catch (e: any) {
    console.error('[admin/users] DELETE error:', e);
    return new Response(JSON.stringify({ message: e?.message || 'Internal Error' }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
  }
});

export const PATCH = withCORS(async (req: NextRequest) => {
  try {
    await ensureDb();
    const admin = await getDbUserFromRequest(req);
    if (!admin) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: HTTPSTATUS.UNAUTHORIZED });
    if (!(admin as any).isAdmin) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), { status: HTTPSTATUS.FORBIDDEN });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, action, userIds } = body || {};

    // Handle single user verification
    if (userId && action === 'verify' && !userIds) {
      // Check if user exists
      const userToVerify = await UserModel.findById(userId);
      if (!userToVerify) {
        return new Response(JSON.stringify({ message: 'User not found' }), { status: HTTPSTATUS.NOT_FOUND });
      }

      // Update user verification status
      await UserModel.updateOne(
        { _id: userId },
        {
          $set: {
            emailVerified: new Date(),
            emailVerificationTokenExpires: null
          },
          $unset: {
            emailVerificationToken: 1
          }
        }
      );

      console.log(`[admin/users] User verified by admin ${(admin as any)._id}: ${userId}`);

      return new Response(JSON.stringify({
        message: 'User verified successfully',
        verifiedUserId: userId
      }), { status: HTTPSTATUS.OK });
    }

    // Handle single user admin toggle
    if (userId && action === 'toggle-admin' && !userIds) {
      // Double-check admin status from database
      const adminFromDb = await UserModel.findById((admin as any)._id).select('isAdmin superAdmin');

      // Check if user exists
      const userToToggle = await UserModel.findById(userId);
      if (!userToToggle) {
        return new Response(JSON.stringify({ message: 'User not found' }), { status: HTTPSTATUS.NOT_FOUND });
      }

      // Prevent admin from removing their own admin status
      if (String((admin as any)._id) === String(userId) && (userToToggle as any).isAdmin) {
        return new Response(JSON.stringify({ message: 'Cannot remove your own admin privileges' }), { status: HTTPSTATUS.BAD_REQUEST });
      }

      // Enhanced Protection: Only super admins can demote other admins
      // Use database value if admin object doesn't have superAdmin field
      const isSuperAdmin = (admin as any).superAdmin || (adminFromDb as any)?.superAdmin;
      if ((userToToggle as any).isAdmin && !isSuperAdmin) {
        console.log('[DEBUG] Permission check failed: userToToggle.isAdmin =', (userToToggle as any).isAdmin, 'admin.superAdmin =', (admin as any).superAdmin, 'adminFromDb.superAdmin =', (adminFromDb as any)?.superAdmin);
        return new Response(JSON.stringify({
          message: 'Only super administrators can demote other administrators'
        }), { status: HTTPSTATUS.FORBIDDEN });
      }

      // Prevent demotion of super admins by non-super admins
      if ((userToToggle as any).superAdmin && !isSuperAdmin) {
        return new Response(JSON.stringify({
          message: 'Super administrators cannot be demoted by regular administrators'
        }), { status: HTTPSTATUS.FORBIDDEN });
      }

      // Prevent super admin from demoting themselves (keep at least one super admin)
      if (String((admin as any)._id) === String(userId) && isSuperAdmin) {
        const superAdminCount = await UserModel.countDocuments({ superAdmin: true });
        if (superAdminCount <= 1) {
          return new Response(JSON.stringify({
            message: 'Cannot remove the last super administrator. Promote another user to super admin first.'
          }), { status: HTTPSTATUS.BAD_REQUEST });
        }
      }

      // Toggle admin status
      const newAdminStatus = !(userToToggle as any).isAdmin;
      await UserModel.updateOne(
        { _id: userId },
        { $set: { isAdmin: newAdminStatus } }
      );

      console.log(`[admin/users] User admin status toggled by admin ${(admin as any)._id}: ${userId} -> ${newAdminStatus}`);

      return new Response(JSON.stringify({
        message: `User ${newAdminStatus ? 'promoted to' : 'removed from'} admin successfully`,
        userId: userId,
        isAdmin: newAdminStatus
      }), { status: HTTPSTATUS.OK });
    }

    // Handle super admin promotion (only super admins can do this)
    if (userId && action === 'toggle-super-admin' && !userIds) {
      // Only super admins can manage super admin status
      if (!(admin as any).superAdmin) {
        return new Response(JSON.stringify({
          message: 'Only super administrators can manage super admin privileges'
        }), { status: HTTPSTATUS.FORBIDDEN });
      }

      // Check if user exists
      const userToToggle = await UserModel.findById(userId);
      if (!userToToggle) {
        return new Response(JSON.stringify({ message: 'User not found' }), { status: HTTPSTATUS.NOT_FOUND });
      }

      // User must be an admin before becoming super admin
      if (!(userToToggle as any).isAdmin && !(userToToggle as any).superAdmin) {
        return new Response(JSON.stringify({
          message: 'User must be an administrator before becoming a super administrator'
        }), { status: HTTPSTATUS.BAD_REQUEST });
      }

      // Prevent super admin from removing their own super admin status if they're the last one
      if (String((admin as any)._id) === String(userId) && (admin as any).superAdmin) {
        const superAdminCount = await UserModel.countDocuments({ superAdmin: true });
        if (superAdminCount <= 1) {
          return new Response(JSON.stringify({
            message: 'Cannot remove the last super administrator. Promote another user to super admin first.'
          }), { status: HTTPSTATUS.BAD_REQUEST });
        }
      }

      const newSuperAdminStatus = !(userToToggle as any).superAdmin;
      let previousSuperAdminId: string | null = null;

      // If promoting to super admin, ensure only 1 super admin exists
      if (newSuperAdminStatus) {
        const currentSuperAdmin = await UserModel.findOne({ superAdmin: true });
        if (currentSuperAdmin && String(currentSuperAdmin._id) !== String(userId)) {
          // Demote current super admin to regular admin
          await UserModel.updateOne(
            { _id: currentSuperAdmin._id },
            { $set: { superAdmin: false, isAdmin: true } }
          );
          previousSuperAdminId = String(currentSuperAdmin._id);
          console.log(`[admin/users] Previous super admin demoted: ${currentSuperAdmin._id}`);
        }
      }

      // Toggle super admin status
      await UserModel.updateOne(
        { _id: userId },
        {
          $set: {
            superAdmin: newSuperAdminStatus,
            isAdmin: true // Ensure they're also admin
          }
        }
      );

      console.log(`[admin/users] User super admin status toggled by admin ${(admin as any)._id}: ${userId} -> ${newSuperAdminStatus}`);

      const response: any = {
        message: `User ${newSuperAdminStatus ? 'promoted to' : 'removed from'} super admin successfully`,
        userId: userId,
        superAdmin: newSuperAdminStatus
      };

      if (newSuperAdminStatus && previousSuperAdminId) {
        response.previousSuperAdmin = previousSuperAdminId;
        response.note = 'Previous super admin was automatically demoted to maintain single super admin policy';
      }

      return new Response(JSON.stringify(response), { status: HTTPSTATUS.OK });
    }

    // Handle bulk user verification
    if (userIds && Array.isArray(userIds) && action === 'verify') {
      // Check if users exist
      const usersToVerify = await UserModel.find({
        _id: { $in: userIds }
      }).select('_id');

      const validUserIds = usersToVerify.map(u => String(u._id));

      if (validUserIds.length === 0) {
        return new Response(JSON.stringify({ message: 'No valid users to verify' }), { status: HTTPSTATUS.BAD_REQUEST });
      }

      // Update users verification status
      const result = await UserModel.updateMany(
        { _id: { $in: validUserIds } },
        {
          $set: {
            emailVerified: new Date(),
            emailVerificationTokenExpires: null
          },
          $unset: {
            emailVerificationToken: 1
          }
        }
      );

      console.log(`[admin/users] Bulk verify by admin ${(admin as any)._id}: ${result.modifiedCount} users verified`);

      return new Response(JSON.stringify({
        message: `Successfully verified ${result.modifiedCount} users`,
        verifiedCount: result.modifiedCount,
        verifiedUserIds: validUserIds
      }), { status: HTTPSTATUS.OK });
    }

    // Handle bulk admin toggle
    if (userIds && Array.isArray(userIds) && (action === 'promote-admin' || action === 'demote-admin')) {
      // Double-check admin status from database for bulk operations
      const adminFromDb = await UserModel.findById((admin as any)._id).select('isAdmin superAdmin');

      // For demotion: Enhanced protection checks
      if (action === 'demote-admin') {
        // Only super admins can demote other admins
        const isSuperAdmin = (admin as any).superAdmin || (adminFromDb as any)?.superAdmin;
        if (!isSuperAdmin) {
          console.log('[DEBUG] Bulk demotion permission check failed: admin.superAdmin =', (admin as any).superAdmin, 'adminFromDb.superAdmin =', (adminFromDb as any)?.superAdmin);
          return new Response(JSON.stringify({
            message: 'Only super administrators can demote other administrators'
          }), { status: HTTPSTATUS.FORBIDDEN });
        }

        // Check if any of the users to demote are super admins
        const usersToCheck = await UserModel.find({
          _id: { $in: userIds }
        }).select('_id superAdmin');

        const superAdminsInList = usersToCheck.filter(u => (u as any).superAdmin);
        if (superAdminsInList.length > 0) {
          return new Response(JSON.stringify({
            message: 'Cannot demote super administrators through bulk operations. Use individual actions.'
          }), { status: HTTPSTATUS.FORBIDDEN });
        }
      }

      // Filter out current admin from being demoted
      const filteredUserIds = action === 'demote-admin'
        ? userIds.filter(id => String(id) !== String((admin as any)._id))
        : userIds;

      if (filteredUserIds.length === 0) {
        return new Response(JSON.stringify({ message: 'No valid users to update' }), { status: HTTPSTATUS.BAD_REQUEST });
      }

      // Check if users exist
      const usersToUpdate = await UserModel.find({
        _id: { $in: filteredUserIds }
      }).select('_id');

      const validUserIds = usersToUpdate.map(u => String(u._id));

      if (validUserIds.length === 0) {
        return new Response(JSON.stringify({ message: 'No valid users to update' }), { status: HTTPSTATUS.BAD_REQUEST });
      }

      // Update users admin status
      const newAdminStatus = action === 'promote-admin';
      const result = await UserModel.updateMany(
        { _id: { $in: validUserIds } },
        { $set: { isAdmin: newAdminStatus } }
      );

      console.log(`[admin/users] Bulk admin ${action} by admin ${(admin as any)._id}: ${result.modifiedCount} users updated`);

      return new Response(JSON.stringify({
        message: `Successfully ${newAdminStatus ? 'promoted' : 'demoted'} ${result.modifiedCount} users`,
        updatedCount: result.modifiedCount,
        updatedUserIds: validUserIds,
        isAdmin: newAdminStatus
      }), { status: HTTPSTATUS.OK });
    }

    return new Response(JSON.stringify({ message: 'Invalid action or missing required fields' }), { status: HTTPSTATUS.BAD_REQUEST });

  } catch (e: any) {
    console.error('[admin/users] PATCH error:', e);
    return new Response(JSON.stringify({ message: e?.message || 'Internal Error' }), { status: HTTPSTATUS.INTERNAL_SERVER_ERROR });
  }
});
