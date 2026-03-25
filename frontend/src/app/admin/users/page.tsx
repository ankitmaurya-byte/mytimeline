"use client";
import React, { useEffect, useState } from 'react';
import {
  Trash2, Users, AlertTriangle, RefreshCw, Search, Filter, MoreHorizontal, UserX, Database,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle, Shield, ShieldCheck, ShieldOff, Crown
} from 'lucide-react';
import API from '@/lib/axios-client';
import { useToast } from '@/hooks/use-toast';

interface User {
  _id: string;
  email: string;
  name: string;
  emailVerified: Date | null;
  isAdmin: boolean;
  superAdmin?: boolean;
  isActive: boolean;
  createdAt: string;
  emailVerificationTokenExpires?: string;
}

interface UsersResponse {
  users: User[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

interface CleanupStats {
  expiredUnverified: number;
  totalUnverified: number;
  totalUsers: number;
  currentTime: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState<string | null>(null);
  const [bulkVerifyLoading, setBulkVerifyLoading] = useState(false);
  const [adminToggleLoading, setAdminToggleLoading] = useState<string | null>(null);
  const [bulkAdminLoading, setBulkAdminLoading] = useState(false);
  const { toast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchCurrentUser = async () => {
    try {
      const response = await API.get('/auth/me');
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchUsers = async (page: number = currentPage, search: string = searchTerm) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sort: sortBy,
        dir: sortDirection,
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      // Remove type argument from API.get to fix lint error
      const res = await API.get(`/admin/users?${params.toString()}`);
      const data = res.data;

      setUsers(data.users || []);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalUsers(data.pagination?.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupStats = async () => {
    try {
      const res = await API.get('/admin/cleanup');
      setCleanupStats(res.data.statistics);
    } catch (e) {
      // Silent fail for cleanup stats
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCleanupStats();
    fetchCurrentUser();
  }, [currentPage, pageSize, sortBy, sortDirection]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to first page when searching
      } else {
        fetchUsers(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // When page changes, reset to first page and fetch
  useEffect(() => {
    if (currentPage === 1) {
      fetchUsers(1, searchTerm);
    }
  }, [currentPage]);

  const handleRefresh = () => {
    fetchUsers(currentPage, searchTerm);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u._id === userId);
    const userName = user?.name || user?.email || 'Unknown user';

    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(userId);
      await API.delete('/admin/users', { data: { userId } });

      // Remove user from state directly instead of refreshing
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      setSelectedUsers(selectedUsers.filter(id => id !== userId));

      // Update total count
      setTotalUsers(prev => prev - 1);

      toast({
        title: "User Deleted",
        description: `${userName} has been successfully deleted.`,
        variant: "success",
      });

      fetchCleanupStats(); // Refresh stats only
    } catch (e: any) {
      toast({
        title: "Delete Failed",
        description: `Failed to delete ${userName}: ${e?.response?.data?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    const user = users.find(u => u._id === userId);
    const userName = user?.name || user?.email || 'Unknown user';

    try {
      setVerifyLoading(userId);
      await API.patch('/admin/users', { userId, action: 'verify' });

      // Update user state directly instead of refreshing
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === userId
            ? { ...user, emailVerified: new Date() }
            : user
        )
      );

      toast({
        title: "User Verified",
        description: `${userName} has been successfully verified.`,
        variant: "success",
      });

      fetchCleanupStats(); // Refresh stats only
    } catch (e: any) {
      toast({
        title: "Verification Failed",
        description: `Failed to verify ${userName}: ${e?.response?.data?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setVerifyLoading(null);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    const user = users.find(u => u._id === userId);
    const userName = user?.name || user?.email || 'Unknown user';
    const isCurrentlyAdmin = user?.isAdmin;

    // Security check: Only super admins can demote other admins
    if (isCurrentlyAdmin && !currentUser?.superAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super administrators can demote other administrators.",
        variant: "destructive",
      });
      return;
    }

    // Security check: Cannot demote super admins
    if (user?.superAdmin && !currentUser?.superAdmin) {
      toast({
        title: "Access Denied",
        description: "Super administrators cannot be demoted by regular administrators.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to ${isCurrentlyAdmin ? 'remove admin privileges from' : 'make'} ${userName} ${isCurrentlyAdmin ? '' : 'an admin'}?`)) {
      return;
    }

    try {
      setAdminToggleLoading(userId);
      await API.patch('/admin/users', { userId, action: 'toggle-admin' });

      // Update user state directly
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === userId
            ? { ...user, isAdmin: !user.isAdmin }
            : user
        )
      );

      toast({
        title: isCurrentlyAdmin ? "Admin Removed" : "Admin Promoted",
        description: `${userName} has been ${isCurrentlyAdmin ? 'removed from admin' : 'promoted to admin'}.`,
        variant: "success",
      });

    } catch (e: any) {
      toast({
        title: "Admin Toggle Failed",
        description: `Failed to update ${userName}: ${e?.response?.data?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setAdminToggleLoading(null);
    }
  };

  const handleToggleSuperAdmin = async (userId: string) => {
    const user = users.find(u => u._id === userId);
    const userName = user?.name || user?.email || 'Unknown user';
    const isCurrentlySuperAdmin = user?.superAdmin;

    // Only super admins can manage super admin status
    if (!currentUser?.superAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super administrators can manage super admin privileges.",
        variant: "destructive",
      });
      return;
    }

    // User must be admin before becoming super admin
    if (!user?.isAdmin && !isCurrentlySuperAdmin) {
      toast({
        title: "Cannot Promote",
        description: "User must be an administrator before becoming a super administrator.",
        variant: "destructive",
      });
      return;
    }

    const confirmMessage = isCurrentlySuperAdmin
      ? `Are you sure you want to remove super admin privileges from ${userName}? They will remain a regular admin.`
      : `Are you sure you want to promote ${userName} to Super Administrator? The current super admin will be automatically demoted to regular admin.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setAdminToggleLoading(userId);
      const response = await API.patch('/admin/users', { userId, action: 'toggle-super-admin' });

      // Update user state directly
      setUsers(prevUsers =>
        prevUsers.map(user => {
          if (user._id === userId) {
            return { ...user, superAdmin: !user.superAdmin, isAdmin: true };
          }
          // If promoting someone to super admin, demote the previous super admin
          if (!isCurrentlySuperAdmin && user.superAdmin && user._id !== userId) {
            return { ...user, superAdmin: false, isAdmin: true };
          }
          return user;
        })
      );

      let toastDescription = `${userName} has been ${isCurrentlySuperAdmin ? 'removed from super admin' : 'promoted to super admin'}.`;

      // Add note about previous super admin if there was one
      if (!isCurrentlySuperAdmin && response.data?.previousSuperAdmin) {
        const previousSuperAdmin = users.find(u => u._id === response.data.previousSuperAdmin);
        const previousName = previousSuperAdmin?.name || previousSuperAdmin?.email || 'Previous super admin';
        toastDescription += ` ${previousName} was automatically demoted to regular admin.`;
      }

      toast({
        title: isCurrentlySuperAdmin ? "Super Admin Removed" : "Super Admin Promoted",
        description: toastDescription,
        variant: "success",
      });

    } catch (e: any) {
      toast({
        title: "Super Admin Toggle Failed",
        description: `Failed to update ${userName}: ${e?.response?.data?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setAdminToggleLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      setBulkDeleteLoading(true);
      await API.delete('/admin/users', { data: { userIds: selectedUsers } });

      // Remove users from state directly instead of refreshing
      setUsers(prevUsers => prevUsers.filter(u => !selectedUsers.includes(u._id)));

      // Update total count
      setTotalUsers(prev => prev - selectedUsers.length);

      toast({
        title: "Users Deleted",
        description: `Successfully deleted ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}.`,
        variant: "success",
      });

      setSelectedUsers([]);
      fetchCleanupStats(); // Refresh stats only
    } catch (e: any) {
      toast({
        title: "Bulk Delete Failed",
        description: e?.response?.data?.message || 'Failed to delete users.',
        variant: "destructive",
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkVerify = async () => {
    const unverifiedUsers = selectedUsers.filter(userId => {
      const user = users.find(u => u._id === userId);
      return user && !user.emailVerified;
    });

    if (unverifiedUsers.length === 0) {
      toast({
        title: "No Users to Verify",
        description: "No unverified users selected.",
        variant: "destructive",
      });
      return;
    }

    const userNames = unverifiedUsers.map(userId => {
      const user = users.find(u => u._id === userId);
      return user?.name || user?.email || 'Unknown';
    }).slice(0, 3).join(', ') + (unverifiedUsers.length > 3 ? ` and ${unverifiedUsers.length - 3} more` : '');

    if (!confirm(`Are you sure you want to verify ${unverifiedUsers.length} user${unverifiedUsers.length > 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      setBulkVerifyLoading(true);
      await API.patch('/admin/users', { userIds: unverifiedUsers, action: 'verify' });

      // Update multiple users' state directly instead of refreshing
      setUsers(prevUsers =>
        prevUsers.map(user =>
          unverifiedUsers.includes(user._id)
            ? { ...user, emailVerified: new Date() }
            : user
        )
      );

      toast({
        title: "Users Verified",
        description: `Successfully verified ${unverifiedUsers.length} user${unverifiedUsers.length > 1 ? 's' : ''}: ${userNames}`,
        variant: "success",
      });

      fetchCleanupStats(); // Refresh stats only
    } catch (e: any) {
      toast({
        title: "Bulk Verification Failed",
        description: e?.response?.data?.message || 'Failed to verify users.',
        variant: "destructive",
      });
    } finally {
      setBulkVerifyLoading(false);
    }
  };

  const handleBulkAdminAction = async (action: 'promote' | 'demote') => {
    // Security check for demotion
    if (action === 'demote' && !currentUser?.superAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super administrators can demote other administrators.",
        variant: "destructive",
      });
      return;
    }

    const filteredUsers = selectedUsers.filter(userId => {
      const user = users.find(u => u._id === userId);
      return user && (action === 'promote' ? !user.isAdmin : user.isAdmin);
    });

    if (filteredUsers.length === 0) {
      toast({
        title: `No Users to ${action === 'promote' ? 'Promote' : 'Demote'}`,
        description: `No ${action === 'promote' ? 'non-admin' : 'admin'} users selected.`,
        variant: "destructive",
      });
      return;
    }

    // Additional check for super admins in the selection
    if (action === 'demote') {
      const superAdminsInSelection = filteredUsers.filter(userId => {
        const user = users.find(u => u._id === userId);
        return user?.superAdmin;
      });

      if (superAdminsInSelection.length > 0) {
        toast({
          title: "Cannot Demote Super Admins",
          description: "Super administrators cannot be demoted through bulk operations. Use individual actions.",
          variant: "destructive",
        });
        return;
      }
    }

    const userNames = filteredUsers.map(userId => {
      const user = users.find(u => u._id === userId);
      return user?.name || user?.email || 'Unknown';
    }).slice(0, 3).join(', ') + (filteredUsers.length > 3 ? ` and ${filteredUsers.length - 3} more` : '');

    if (!confirm(`Are you sure you want to ${action} ${filteredUsers.length} user${filteredUsers.length > 1 ? 's' : ''} ${action === 'promote' ? 'to admin' : 'from admin'}?`)) {
      return;
    }

    try {
      setBulkAdminLoading(true);
      const apiAction = action === 'promote' ? 'promote-admin' : 'demote-admin';
      await API.patch('/admin/users', { userIds: filteredUsers, action: apiAction });

      // Update multiple users' state directly
      setUsers(prevUsers =>
        prevUsers.map(user =>
          filteredUsers.includes(user._id)
            ? { ...user, isAdmin: action === 'promote' }
            : user
        )
      );

      toast({
        title: `Users ${action === 'promote' ? 'Promoted' : 'Demoted'}`,
        description: `Successfully ${action === 'promote' ? 'promoted' : 'demoted'} ${filteredUsers.length} user${filteredUsers.length > 1 ? 's' : ''}: ${userNames}`,
        variant: "success",
      });

    } catch (e: any) {
      toast({
        title: `Bulk ${action === 'promote' ? 'Promotion' : 'Demotion'} Failed`,
        description: e?.response?.data?.message || `Failed to ${action} users.`,
        variant: "destructive",
      });
    } finally {
      setBulkAdminLoading(false);
    }
  };

  const handleCleanup = async (action: 'cleanup-expired' | 'cleanup-unverified') => {
    const actionText = action === 'cleanup-expired' ? 'expired unverified accounts' : 'all unverified accounts';

    if (!confirm(`Are you sure you want to delete all ${actionText}? This action cannot be undone.`)) {
      return;
    }

    try {
      setCleanupLoading(true);
      const res = await API.post('/admin/cleanup', { action });

      toast({
        title: "Cleanup Successful",
        description: `Successfully cleaned up ${res.data.deletedCount} accounts.`,
        variant: "success",
      });

      fetchUsers(); // Refresh user list
      fetchCleanupStats(); // Refresh stats
    } catch (e: any) {
      toast({
        title: "Cleanup Failed",
        description: e?.response?.data?.message || 'Failed to cleanup accounts.',
        variant: "destructive",
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u._id));
    }
  };

  const isExpired = (user: User) => {
    if (user.emailVerified) return false;
    if (!user.emailVerificationTokenExpires) return true;
    return new Date(user.emailVerificationTokenExpires) < new Date();
  };

  return (
    <main className="p-6 md:p-8 mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage users, delete accounts, and cleanup unverified users.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Cleanup Statistics and Actions */}
      {cleanupStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white/60 dark:bg-zinc-900/40 backdrop-blur p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <Database className="h-4 w-4" /> Total Users
            </div>
            <div className="text-2xl font-semibold tracking-tight">{cleanupStats.totalUsers}</div>
          </div>
          <div className="rounded-lg border bg-white/60 dark:bg-zinc-900/40 backdrop-blur p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <UserX className="h-4 w-4" /> Unverified
            </div>
            <div className="text-2xl font-semibold tracking-tight">{cleanupStats.totalUnverified}</div>
          </div>
          <div className="rounded-lg border bg-white/60 dark:bg-zinc-900/40 backdrop-blur p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <AlertTriangle className="h-4 w-4" /> Expired
            </div>
            <div className="text-2xl font-semibold tracking-tight">{cleanupStats.expiredUnverified}</div>
          </div>
          <div className="rounded-lg border bg-white/60 dark:bg-zinc-900/40 backdrop-blur p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <Trash2 className="h-4 w-4" /> Actions
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleCleanup('cleanup-expired')}
                disabled={cleanupLoading || cleanupStats.expiredUnverified === 0}
                className="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400/90 text-white rounded transition-colors"
              >
                {cleanupLoading ? 'Cleaning...' : `Clean Expired (${cleanupStats.expiredUnverified})`}
              </button>
              <button
                onClick={() => handleCleanup('cleanup-unverified')}
                disabled={cleanupLoading || cleanupStats.totalUnverified === 0}
                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded transition-colors"
              >
                {cleanupLoading ? 'Cleaning...' : `Clean All (${cleanupStats.totalUnverified})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 pr-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {selectedUsers.length} user(s) selected
            </span>
            <button
              onClick={handleBulkVerify}
              disabled={bulkVerifyLoading || selectedUsers.filter(userId => {
                const user = users.find(u => u._id === userId);
                return user && !user.emailVerified;
              }).length === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 hover:bg-green-700 disabled:bg-green-700 px-3 py-1.5 text-sm text-white shadow-sm transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              {bulkVerifyLoading ? 'Verifying...' : `Verify Selected`}
            </button>

            <button
              onClick={() => handleBulkAdminAction('promote')}
              disabled={bulkAdminLoading || selectedUsers.filter(userId => {
                const user = users.find(u => u._id === userId);
                return user && !user.isAdmin;
              }).length === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-3 py-1.5 text-sm text-white shadow-sm transition-colors"
            >
              <Shield className="h-4 w-4" />
              {bulkAdminLoading ? 'Processing...' : `Promote to Admin`}
            </button>

            <button
              onClick={() => handleBulkAdminAction('demote')}
              disabled={bulkAdminLoading || selectedUsers.filter(userId => {
                const user = users.find(u => u._id === userId);
                return user && user.isAdmin;
              }).length === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 px-3 py-1.5 text-sm text-white shadow-sm transition-colors"
            >
              <ShieldOff className="h-4 w-4" />
              {bulkAdminLoading ? 'Processing...' : `Demote from Admin`}
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-3 py-1.5 text-sm text-white shadow-sm transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedUsers.length}`}
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-md border bg-white/70 dark:bg-zinc-900/40 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300">
            <tr>
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={toggleAllUsers}
                  className="rounded border-zinc-300"
                />
              </th>
              <th
                className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                onClick={() => handleSortChange('email')}
              >
                <div className="flex items-center gap-2">
                  Email
                  {sortBy === 'email' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                onClick={() => handleSortChange('name')}
              >
                <div className="flex items-center gap-2">
                  Name
                  {sortBy === 'name' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Admin</th>
              <th
                className="px-3 py-2 text-left font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                onClick={() => handleSortChange('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Created
                  {sortBy === 'createdAt' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-zinc-800">
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-zinc-500">
                  Loading users...
                </td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-zinc-500">
                  No users found
                </td>
              </tr>
            )}

            {!loading && users.map(user => (
              <tr key={user._id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                    className="rounded border-zinc-300"
                  />
                </td>
                <td className="px-3 py-2 font-mono text-sm" title={user.email}>
                  {user.email}
                </td>
                <td className="px-3 py-2 text-sm">
                  {user.name || <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${user.emailVerified
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                    {!user.emailVerified && isExpired(user) && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Expired
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {user.superAdmin ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        <Crown className="h-3 w-3" />
                        Super Admin
                      </span>
                    ) : user.isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        User
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {!user.emailVerified && (
                      <button
                        onClick={() => handleVerifyUser(user._id)}
                        disabled={verifyLoading === user._id}
                        title="Verify user email"
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {verifyLoading === user._id ? 'Verifying...' : 'Verify'}
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleAdmin(user._id)}
                      disabled={adminToggleLoading === user._id}
                      title={user.isAdmin ? "Remove admin privileges" : "Grant admin privileges"}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${user.isAdmin
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {user.isAdmin ? (
                        <ShieldOff className="h-3 w-3" />
                      ) : (
                        <Shield className="h-3 w-3" />
                      )}
                      {adminToggleLoading === user._id ? 'Processing...' : (user.isAdmin ? 'Demote' : 'Promote')}
                    </button>

                    {/* Super Admin Toggle Button - Only visible to super admins and for admin users */}
                    {currentUser?.superAdmin && user.isAdmin && (
                      <button
                        onClick={() => handleToggleSuperAdmin(user._id)}
                        disabled={adminToggleLoading === user._id}
                        title={user.superAdmin ? "Remove super admin privileges" : "Grant super admin privileges"}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${user.superAdmin
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                      >
                        {user.superAdmin ? (
                          <Crown className="h-3 w-3" />
                        ) : (
                          <Crown className="h-3 w-3" />
                        )}
                        {adminToggleLoading === user._id ? 'Processing...' : (user.superAdmin ? 'Demote SA' : 'Super Admin')}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={deleteLoading === user._id || user.isAdmin}
                      title={user.isAdmin ? "Cannot delete admin accounts" : "Delete user"}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${user.isAdmin
                        ? 'bg-zinc-800/70 text-zinc-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    >
                      <Trash2 className="h-3 w-3" />
                      {deleteLoading === user._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
            {searchTerm && ` matching "${searchTerm}"`}
          </div>

          <div className="flex items-center gap-2">
            {/* Page size selector */}
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNumber: number;
                  if (totalPages <= 7) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 4) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNumber = totalPages - 6 + i;
                  } else {
                    pageNumber = currentPage - 3 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-1.5 text-sm rounded border ${currentPage === pageNumber
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary for single page */}
      {totalPages <= 1 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
          Showing {totalUsers} user{totalUsers !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </main>
  );
}
