import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Shared service that computes the full set of effective permission names
 * for an admin, combining:
 *   1. Direct grants  (admin_permissions table)
 *   2. Role-based     (admin_role → role_permissions → permission)
 *
 * Uses DataSource directly so it can be declared @Global() without per-module
 * repository imports. Both PermissionsGuard and SidebarService consume this.
 */
@Injectable()
export class EffectivePermissionsService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Returns a deduplicated array of permission name strings that the given
   * admin currently has, considering only guard = 'admin' and status = 1.
   *
   * Examples: ['admins.index', 'students.create', 'attendance.mark']
   */
  async getEffectivePermissions(adminId: number): Promise<string[]> {
    // ── 1. Direct permissions ─────────────────────────────────────────────────
    const directRows: Array<{ name: string }> = await this.dataSource.query(
      `SELECT DISTINCT p.name
       FROM admin_permissions ap
       INNER JOIN permission p ON p.id = ap.permission_id
       WHERE ap.admin_id = ?
         AND ap.status   = 1
         AND p.guard     = 'admin'
         AND p.status    = 1`,
      [adminId],
    );

    // ── 2. Role-based permissions ──────────────────────────────────────────────
    const roleRows: Array<{ name: string }> = await this.dataSource.query(
      `SELECT DISTINCT p.name
       FROM admin_role ar
       INNER JOIN role_permissions rp ON rp.role_id = ar.role_id
       INNER JOIN permission p        ON p.id = rp.permission_id
       WHERE ar.admin_id = ?
         AND ar.status   = 1
         AND rp.status   = 1
         AND p.guard     = 'admin'
         AND p.status    = 1`,
      [adminId],
    );

    // Merge and deduplicate
    const names = new Set<string>([
      ...directRows.map((r) => r.name),
      ...roleRows.map((r) => r.name),
    ]);

    return [...names];
  }
}
