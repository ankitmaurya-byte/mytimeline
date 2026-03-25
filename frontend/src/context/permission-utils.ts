// Permission utilities for role-based access control

export interface Permission {
    action: string;
    resource: string;
}

export interface Role {
    name: string;
    permissions: Permission[];
}

// Helper functions for permission checking
export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
    return userPermissions.some(
        permission =>
            permission.action === requiredPermission.action &&
            permission.resource === requiredPermission.resource
    );
}

export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

// Common permission constants
export const PERMISSIONS = {
    TASK_CREATE: { action: 'create', resource: 'task' },
    TASK_READ: { action: 'read', resource: 'task' },
    TASK_UPDATE: { action: 'update', resource: 'task' },
    TASK_DELETE: { action: 'delete', resource: 'task' },
    PROJECT_CREATE: { action: 'create', resource: 'project' },
    PROJECT_READ: { action: 'read', resource: 'project' },
    PROJECT_UPDATE: { action: 'update', resource: 'project' },
    PROJECT_DELETE: { action: 'delete', resource: 'project' },
    WORKSPACE_ADMIN: { action: 'admin', resource: 'workspace' },
} as const;
