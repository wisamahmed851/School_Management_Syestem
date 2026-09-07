import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/entity/user.entity';
import { Role } from 'src/roles/entity/roles.entity';
import { UserRole } from 'src/assig-roles-user/entity/user-role.entity';

@Injectable()
export class UserAuthSeederService {
  private readonly logger = new Logger(UserAuthSeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async seed(): Promise<void> {
    await this.seedUser({
      name: 'Default User',
      email: 'user@example.com',
      password: '123456789',
      roleName: 'user',
    });
  }

  private async seedUser({
    name,
    email,
    password,
    roleName,
  }: {
    name: string;
    email: string;
    password: string;
    roleName: string;
  }) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) return;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepo.create({ name, email, password: hashedPassword });
    const savedUser = await this.userRepo.save(newUser);

    const role = await this.roleRepo.findOne({
      where: { name: roleName },
      select: { id: true, name: true },
    });
    if (!role) {
      this.logger.error(`Role '${roleName}' not found in roles table.`);
      return;
    }

    const userRole = this.userRoleRepo.create({ user: savedUser, role });
    await this.userRoleRepo.save(userRole);
    this.logger.log(`Seeded user '${email}' with role '${role.name}'`);
  }
}
