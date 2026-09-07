import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/**
 * Apply to a route handler to declare the permission required to access it.
 * Format: 'module.action'  e.g. @RequirePermission('students.create')
 *
 * Must be used together with PermissionsGuard (applied AFTER AdminJwtAuthGuard).
 * Routes without this decorator are left unchanged.
 */
export const RequirePermission = (permissionName: string) =>
  SetMetadata(PERMISSION_KEY, permissionName);
