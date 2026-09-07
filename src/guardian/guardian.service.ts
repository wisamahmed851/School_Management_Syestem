import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Guardian } from './entity/guardian.entity';
import { CreateGuardianDto, UpdateGuardianDto } from './dtos/guardian.dto';
import { User } from 'src/users/entity/user.entity';
import { Role } from 'src/roles/entity/roles.entity';
import { UserRole } from 'src/assig-roles-user/entity/user-role.entity';

@Injectable()
export class GuardianService {
  constructor(
    @InjectRepository(Guardian)
    private readonly guardianRepo: Repository<Guardian>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,

    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────── CREATE ────────────────────────────────────

  async create(dto: CreateGuardianDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Email uniqueness across Guardian and User tables (only when email provided)
      if (dto.email) {
        const guardianExists = await queryRunner.manager.findOne(Guardian, {
          where: { email: dto.email },
        });
        if (guardianExists) {
          throw new BadRequestException(
            'A guardian with this email already exists',
          );
        }

        const userExists = await queryRunner.manager.findOne(User, {
          where: { email: dto.email },
        });
        if (userExists) {
          throw new BadRequestException(
            'A user account with this email already exists',
          );
        }
      }

      // 2. Resolve the "parent" role — must already be seeded, never auto-created
      const parentRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'parent', guard: 'user' },
        select: { id: true, name: true },
      });
      if (!parentRole) {
        throw new NotFoundException(
          "Role 'parent' (guard: user) not found in the roles table. " +
            'Please create it first via POST /admin/roles/store: ' +
            '{ "name": "parent", "guard": "user" }',
        );
      }

      // 3. Create the Guardian record (password is never stored here)
      const guardian = queryRunner.manager.getRepository(Guardian).create({
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        relation_to_student: dto.relation_to_student,
      });
      const savedGuardian = await queryRunner.manager.save(Guardian, guardian);

      // 4. Create the linked User account using the plain-text password
      //    The plain-text value is returned in the response so the admin can
      //    share it with the parent manually (TODO: replace with email/SMS later)
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Email is required for a User account; fall back to a generated placeholder
      // if the guardian has no email (e.g. guardian registered by phone only)
      const userEmail =
        dto.email ?? `guardian_${savedGuardian.id}@placeholder.local`;

      const user = queryRunner.manager.getRepository(User).create({
        name: dto.name,
        email: userEmail,
        password: hashedPassword,
        phone: dto.phone,
      });
      const savedUser = await queryRunner.manager.save(User, user);

      // 5. Assign the "parent" role to the new User account
      const userRole = queryRunner.manager.getRepository(UserRole).create({
        user_id: savedUser.id,
        user: savedUser,
        role_id: parentRole.id,
        role: parentRole,
      });
      await queryRunner.manager.save(UserRole, userRole);

      // 6. Link the User back to the Guardian record
      savedGuardian.user_id = savedUser.id;
      await queryRunner.manager.save(Guardian, savedGuardian);

      await queryRunner.commitTransaction();

      const { password, access_token, refresh_token, ...cleanUser } = savedUser;
      return {
        success: true,
        message: 'Guardian created successfully',
        data: {
          guardian: { ...savedGuardian, user_id: savedUser.id },
          user: cleanUser,
          role: parentRole,
          // TODO: replace with email/SMS notification once a mail service is set up.
          // For now the plain-text password is returned so the admin can share it manually.
          temporary_password: dto.password,
        },
      };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.handleUnknown(err);
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────── FIND ALL ──────────────────────────────────

  async findAll() {
    try {
      const guardians = await this.guardianRepo.find({
        relations: ['user'],
        order: { id: 'ASC' },
      });
      return { success: true, message: 'Guardian list', data: guardians };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ONE ──────────────────────────────────

  async findOne(id: number) {
    try {
      const guardian = await this.guardianRepo.findOne({
        where: { id },
        relations: ['user'],
      });
      if (!guardian) throw new NotFoundException('Guardian not found');
      return { success: true, message: 'Guardian fetched', data: guardian };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE ────────────────────────────────────

  async update(id: number, dto: UpdateGuardianDto) {
    try {
      const guardian = await this.guardianRepo.findOne({ where: { id } });
      if (!guardian) throw new NotFoundException('Guardian not found');

      // Email uniqueness check (excluding self) when email is being changed
      if (dto.email && dto.email !== guardian.email) {
        const dup = await this.guardianRepo.findOne({
          where: { email: dto.email, id: Not(id) },
        });
        if (dup) {
          throw new BadRequestException(
            'Another guardian with this email already exists',
          );
        }

        if (guardian.user_id) {
          const userEmailDup = await this.userRepo.findOne({
            where: { email: dto.email, id: Not(guardian.user_id) },
          });
          if (userEmailDup) {
            throw new BadRequestException(
              'A user account with this email already exists',
            );
          }
        }
      }

      // Sync relevant fields to the linked User account
      if (guardian.user_id) {
        const linkedUser = await this.userRepo.findOne({
          where: { id: guardian.user_id },
        });
        if (linkedUser) {
          if (dto.name) linkedUser.name = dto.name;
          if (dto.phone) linkedUser.phone = dto.phone;
          if (dto.email && dto.email !== guardian.email) {
            linkedUser.email = dto.email;
          }
          await this.userRepo.save(linkedUser);
        }
      }

      Object.assign(guardian, dto);
      const saved = await this.guardianRepo.save(guardian);
      return { success: true, message: 'Guardian updated', data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── REMOVE ────────────────────────────────────

  async remove(id: number) {
    try {
      const guardian = await this.guardianRepo.findOne({ where: { id } });
      if (!guardian) throw new NotFoundException('Guardian not found');

      await this.guardianRepo.remove(guardian);
      // The linked User account is intentionally preserved.
      // Cascade user deletion should be a deliberate, separate action.
      return { success: true, message: 'Guardian deleted', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── PRIVATE ───────────────────────────────────

  private handleUnknown(err: unknown): never {
    if (
      err instanceof BadRequestException ||
      err instanceof NotFoundException
    ) {
      throw err;
    }
    throw new InternalServerErrorException('Unexpected error', {
      cause: err as Error,
    });
  }
}
