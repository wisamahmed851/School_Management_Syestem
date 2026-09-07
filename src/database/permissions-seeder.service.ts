import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from 'src/permissions/entity/permission.entity';
import { Role } from 'src/roles/entity/roles.entity';
import { AdminRole } from 'src/assig-roles-admin/entity/admin-role.entity';
import { Admin } from 'src/admin/entity/admin.entity';
import { RolePermissions } from 'src/role-permissions/entity/role-permission.entity';

/**
 * Derived directly from every @RequirePermission() applied in Step 2.
 * Format: [module, action] → name = 'module.action', guard = 'admin'
 *
 * To stay in sync: if you add a @RequirePermission somewhere new,
 * add the corresponding entry here.
 */
const ADMIN_PERMISSIONS: Array<{ module: string; action: string }> = [
  // admins
  { module: 'admins', action: 'create' },
  { module: 'admins', action: 'index' },
  { module: 'admins', action: 'findOne' },
  { module: 'admins', action: 'update' },
  { module: 'admins', action: 'remove' },
  { module: 'admins', action: 'toggleStatus' },
  // users
  { module: 'users', action: 'create' },
  { module: 'users', action: 'index' },
  { module: 'users', action: 'findOne' },
  { module: 'users', action: 'update' },
  { module: 'users', action: 'toggleStatus' },
  // roles
  { module: 'roles', action: 'create' },
  { module: 'roles', action: 'index' },
  { module: 'roles', action: 'findOne' },
  { module: 'roles', action: 'update' },
  { module: 'roles', action: 'toggleStatus' },
  { module: 'roles', action: 'remove' },
  // permissions
  { module: 'permissions', action: 'create' },
  { module: 'permissions', action: 'index' },
  { module: 'permissions', action: 'findOne' },
  { module: 'permissions', action: 'update' },
  { module: 'permissions', action: 'toggleStatus' },
  { module: 'permissions', action: 'remove' },
  // role-permissions
  { module: 'role-permissions', action: 'create' },
  { module: 'role-permissions', action: 'index' },
  { module: 'role-permissions', action: 'findOne' },
  { module: 'role-permissions', action: 'toggleStatus' },
  { module: 'role-permissions', action: 'update' },
  { module: 'role-permissions', action: 'remove' },
  // admin-roles
  { module: 'admin-roles', action: 'create' },
  { module: 'admin-roles', action: 'index' },
  { module: 'admin-roles', action: 'findOne' },
  { module: 'admin-roles', action: 'toggleStatus' },
  { module: 'admin-roles', action: 'update' },
  { module: 'admin-roles', action: 'remove' },
  // user-roles
  { module: 'user-roles', action: 'create' },
  { module: 'user-roles', action: 'index' },
  { module: 'user-roles', action: 'findOne' },
  { module: 'user-roles', action: 'toggleStatus' },
  { module: 'user-roles', action: 'update' },
  { module: 'user-roles', action: 'remove' },
  // admin-permissions
  { module: 'admin-permissions', action: 'create' },
  { module: 'admin-permissions', action: 'index' },
  { module: 'admin-permissions', action: 'findOne' },
  { module: 'admin-permissions', action: 'toggleStatus' },
  { module: 'admin-permissions', action: 'update' },
  { module: 'admin-permissions', action: 'remove' },
  // user-permissions
  { module: 'user-permissions', action: 'create' },
  { module: 'user-permissions', action: 'index' },
  { module: 'user-permissions', action: 'findOne' },
  { module: 'user-permissions', action: 'toggleStatus' },
  { module: 'user-permissions', action: 'update' },
  { module: 'user-permissions', action: 'remove' },
  // teachers
  { module: 'teachers', action: 'create' },
  { module: 'teachers', action: 'index' },
  { module: 'teachers', action: 'findOne' },
  { module: 'teachers', action: 'update' },
  { module: 'teachers', action: 'toggleStatus' },
  { module: 'teachers', action: 'remove' },
  // guardians
  { module: 'guardians', action: 'create' },
  { module: 'guardians', action: 'index' },
  { module: 'guardians', action: 'findOne' },
  { module: 'guardians', action: 'update' },
  { module: 'guardians', action: 'remove' },
  // classes
  { module: 'classes', action: 'create' },
  { module: 'classes', action: 'index' },
  { module: 'classes', action: 'findOne' },
  { module: 'classes', action: 'update' },
  { module: 'classes', action: 'toggleStatus' },
  { module: 'classes', action: 'remove' },
  // students
  { module: 'students', action: 'create' },
  { module: 'students', action: 'index' },
  { module: 'students', action: 'findOne' },
  { module: 'students', action: 'update' },
  { module: 'students', action: 'toggleStatus' },
  { module: 'students', action: 'remove' },
  // subjects
  { module: 'subjects', action: 'create' },
  { module: 'subjects', action: 'index' },
  { module: 'subjects', action: 'findOne' },
  { module: 'subjects', action: 'update' },
  { module: 'subjects', action: 'toggleStatus' },
  { module: 'subjects', action: 'remove' },
  // class-subjects
  { module: 'class-subjects', action: 'create' },
  { module: 'class-subjects', action: 'index' },
  { module: 'class-subjects', action: 'update' },
  { module: 'class-subjects', action: 'remove' },
  // attendance
  { module: 'attendance', action: 'mark' },
  { module: 'attendance', action: 'index' },
  { module: 'attendance', action: 'update' },
  // assignments
  { module: 'assignments', action: 'create' },
  { module: 'assignments', action: 'index' },
  { module: 'assignments', action: 'findOne' },
  { module: 'assignments', action: 'update' },
  { module: 'assignments', action: 'remove' },
  { module: 'assignments', action: 'gradeSubmission' },
];

@Injectable()
export class PermissionsSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionsSeederService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(AdminRole)
    private readonly adminRoleRepo: Repository<AdminRole>,

    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,

    @InjectRepository(RolePermissions)
    private readonly rolePermissionRepo: Repository<RolePermissions>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedPermissions();
    await this.assignAllPermissionsToAdminRole();
    await this.ensureAdminsHaveAdminRole();
  }

  // ── STEP 3: Seed permission rows ──────────────────────────────────────────

  async seedPermissions(): Promise<Permission[]> {
    const seeded: Permission[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const { module, action } of ADMIN_PERMISSIONS) {
      const name = `${module}.${action}`;
      const existing = await this.permissionRepo.findOne({ where: { name } });
      if (existing) {
        seeded.push(existing);
        continue;
      }

      const permission = this.permissionRepo.create({
        module,
        action,
        name,
        guard: 'admin',
        status: 1,
        created_at: today as any,
        updated_at: today as any,
      });
      const saved = await this.permissionRepo.save(permission);
      seeded.push(saved);
      this.logger.log(`Seeded permission: ${name}`);
    }

    this.logger.log(`Permission seeding complete. Total: ${seeded.length}`);
    return seeded;
  }

  // ── STEP 4: Assign all permissions to the 'admin' role ───────────────────

  async assignAllPermissionsToAdminRole(): Promise<void> {
    const adminRole = await this.roleRepo.findOne({
      where: { name: 'admin', guard: 'admin' },
    });

    if (!adminRole) {
      this.logger.error(
        "Role 'admin' (guard: admin) not found. Run the RolesSeeder first.",
      );
      return;
    }

    // Get all admin-guard permissions
    const allPermissions = await this.permissionRepo.find({
      where: { guard: 'admin', status: 1 },
    });

    const today = new Date().toISOString().split('T')[0];
    let assigned = 0;

    for (const permission of allPermissions) {
      const existing = await this.rolePermissionRepo.findOne({
        where: { role_id: adminRole.id, permission_id: permission.id },
      });
      if (existing) continue;

      const rp = this.rolePermissionRepo.create({
        role_id: adminRole.id,
        role: adminRole,
        permission_id: permission.id,
        permission,
        status: 1,
        created_at: today as any,
        updated_at: today as any,
      });
      await this.rolePermissionRepo.save(rp);
      assigned++;
    }

    this.logger.log(
      `Assigned ${assigned} new permission(s) to role 'admin'. ` +
        `Total on role: ${allPermissions.length}`,
    );
  }

  // ── STEP 4: Ensure every Admin has the 'admin' role ──────────────────────

  async ensureAdminsHaveAdminRole(): Promise<void> {
    const adminRole = await this.roleRepo.findOne({
      where: { name: 'admin', guard: 'admin' },
    });
    if (!adminRole) return;

    const allAdmins = await this.adminRepo.find();
    const today = new Date().toISOString().split('T')[0];
    let linked = 0;

    for (const admin of allAdmins) {
      const existing = await this.adminRoleRepo.findOne({
        where: { admin_id: admin.id, role_id: adminRole.id },
      });
      if (existing) continue;

      const ar = this.adminRoleRepo.create({
        admin_id: admin.id,
        admin,
        role_id: adminRole.id,
        role: adminRole,
        status: 1,
        created_at: today as any,
        updated_at: today as any,
      });
      await this.adminRoleRepo.save(ar);
      linked++;
      this.logger.log(
        `Linked admin '${admin.email}' to role 'admin' (was missing).`,
      );
    }

    if (linked === 0) {
      this.logger.log('All admin accounts already have the admin role. No action needed.');
    }
  }
}
