import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guardian } from './entity/guardian.entity';
import { GuardianController } from './guardian.controller';
import { GuardianService } from './guardian.service';
import { User } from 'src/users/entity/user.entity';
import { Role } from 'src/roles/entity/roles.entity';
import { UserRole } from 'src/assig-roles-user/entity/user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Guardian, User, Role, UserRole])],
  controllers: [GuardianController],
  providers: [GuardianService],
  exports: [GuardianService],
})
export class GuardianModule {}
