import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserAuthModule } from './auth/user/user-auth.module';
import { RolesModule } from './roles/roles.module';
import { RolesSeederModule } from './roles/seeder/roles-seeder.module';
import { AdminsModule } from './admin/admin.module';
import { AdminAuthModule } from './auth/admin/admin-auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolePermissionModule } from './role-permissions/role-permissions.module';
import { AdminRoleModule } from './assig-roles-admin/admin-roles.module';
import { UserRoleModule } from './assig-roles-user/user-roles.module';
import { UserPermissionModule } from './assign-permission-user/user-permission.module';
import { AdminPermissionModule } from './assign-permission-admin/admin-permission.module';
import { UserAuthSeederModule } from './auth/user/seeder/user-auth-seeder.module';
import { AdminAuthSeederModule } from './admin/seeder/admin-auth-seeder.module';
import { AdminAuthSeederService } from './admin/seeder/admin-auth-seeder.service';
import { TeacherModule } from './teacher/teacher.module';
import { GuardianModule } from './guardian/guardian.module';
import { SchoolClassModule } from './school-class/school-class.module';
import { StudentModule } from './student/student.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AssignmentModule } from './assignment/assignment.module';
import { SubjectModule } from './subject/subject.module';
import { ClassSubjectModule } from './class-subject/class-subject.module';
import { ExamModule } from './exam/exam.module';
import { ParentPortalModule } from './parent-portal/parent-portal.module';
import { PermissionsGuardModule } from './common/guards/permissions.module';
import { PermissionsSeederModule } from './database/permissions-seeder.module';
import { SidebarModule } from './sidebar/sidebar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    UserAuthModule,
    RolesModule,
    RolesSeederModule,
    AdminsModule,
    AdminAuthModule,
    PermissionsModule,
    RolePermissionModule,
    AdminRoleModule,
    UserRoleModule,
    UserPermissionModule,
    AdminPermissionModule,
    UserAuthSeederModule,
    AdminAuthSeederModule,
    TeacherModule,
    GuardianModule,
    SchoolClassModule,
    StudentModule,
    AttendanceModule,
    AssignmentModule,
    SubjectModule,
    ClassSubjectModule,
    ExamModule,
    ParentPortalModule,
    PermissionsGuardModule,
    PermissionsSeederModule,
    SidebarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(
    private readonly adminAuthSeederService: AdminAuthSeederService,
  ) {}

  async onApplicationBootstrap() {
    await this.adminAuthSeederService.seed();
  }
}
