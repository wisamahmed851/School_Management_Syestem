import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './entity/teacher.entity';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { User } from 'src/users/entity/user.entity';
import { Role } from 'src/roles/entity/roles.entity';
import { UserRole } from 'src/assig-roles-user/entity/user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher, User, Role, UserRole])],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
