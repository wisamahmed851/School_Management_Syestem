import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsSeederService } from './permissions-seeder.service';
import { Permission } from 'src/permissions/entity/permission.entity';
import { Role } from 'src/roles/entity/roles.entity';
import { AdminRole } from 'src/assig-roles-admin/entity/admin-role.entity';
import { Admin } from 'src/admin/entity/admin.entity';
import { RolePermissions } from 'src/role-permissions/entity/role-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Role,
      AdminRole,
      Admin,
      RolePermissions,
    ]),
  ],
  providers: [PermissionsSeederService],
  exports: [PermissionsSeederService],
})
export class PermissionsSeederModule {}
