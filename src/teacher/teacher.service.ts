import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Teacher } from './entity/teacher.entity';
import { CreateTeacherDto, UpdateTeacherDto } from './dtos/teacher.dto';
import { User } from 'src/users/entity/user.entity';
import { Role } from 'src/roles/entity/roles.entity';
import { UserRole } from 'src/assig-roles-user/entity/user-role.entity';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,

    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────── CREATE ────────────────────────────────────

  async create(dto: CreateTeacherDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Guard: email must be unique across both Teacher and User tables
      const teacherExists = await queryRunner.manager.findOne(Teacher, {
        where: { email: dto.email },
      });
      if (teacherExists) {
        throw new BadRequestException(
          'A teacher with this email already exists',
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

      // 2. Resolve the "teacher" role — must already be in the DB.
      //    Do NOT auto-create it; caller must seed it first.
      const teacherRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'teacher', guard: 'user' },
        select: { id: true, name: true },
      });
      if (!teacherRole) {
        throw new NotFoundException(
          "Role 'teacher' (guard: user) not found in the roles table. " +
            "Please create it first via POST /admin/roles/store: " +
            '{ "name": "teacher", "guard": "user" }',
        );
      }

      // 3. Create the Teacher record (no password stored here)
      const teacher = queryRunner.manager.getRepository(Teacher).create({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        subject_specialization: dto.subject_specialization,
        joining_date: dto.joining_date,
      });
      const savedTeacher = await queryRunner.manager.save(Teacher, teacher);

      // 4. Create the linked User account
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = queryRunner.manager.getRepository(User).create({
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
      });
      const savedUser = await queryRunner.manager.save(User, user);

      // 5. Assign the "teacher" role to the new User account
      const userRole = queryRunner.manager.getRepository(UserRole).create({
        user_id: savedUser.id,
        user: savedUser,
        role_id: teacherRole.id,
        role: teacherRole,
      });
      await queryRunner.manager.save(UserRole, userRole);

      // 6. Link the User back to the Teacher record
      savedTeacher.user_id = savedUser.id;
      await queryRunner.manager.save(Teacher, savedTeacher);

      await queryRunner.commitTransaction();

      // Strip sensitive fields before returning
      const { password, access_token, refresh_token, ...cleanUser } = savedUser;
      return {
        success: true,
        message: 'Teacher created successfully',
        data: {
          teacher: { ...savedTeacher, user_id: savedUser.id },
          user: cleanUser,
          role: teacherRole,
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
      const teachers = await this.teacherRepo.find({
        relations: ['user'],
        order: { id: 'ASC' },
      });
      return {
        success: true,
        message: 'Teacher list',
        data: teachers,
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── FIND ONE ──────────────────────────────────

  async findOne(id: number) {
    try {
      const teacher = await this.teacherRepo.findOne({
        where: { id },
        relations: ['user'],
      });
      if (!teacher) throw new NotFoundException('Teacher not found');
      return { success: true, message: 'Teacher fetched', data: teacher };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── UPDATE ────────────────────────────────────

  async update(id: number, dto: UpdateTeacherDto) {
    try {
      const teacher = await this.teacherRepo.findOne({ where: { id } });
      if (!teacher) throw new NotFoundException('Teacher not found');

      // Email uniqueness check across Teacher table (excluding self)
      if (dto.email && dto.email !== teacher.email) {
        const dup = await this.teacherRepo.findOne({
          where: { email: dto.email, id: Not(id) },
        });
        if (dup) {
          throw new BadRequestException(
            'Another teacher with this email already exists',
          );
        }

        // Also sync email on the linked User account
        if (teacher.user_id) {
          const linkedUser = await this.userRepo.findOne({
            where: { id: teacher.user_id },
          });
          if (linkedUser) {
            // Guard: new email must not conflict with another User row
            const userEmailDup = await this.userRepo.findOne({
              where: { email: dto.email, id: Not(teacher.user_id) },
            });
            if (userEmailDup) {
              throw new BadRequestException(
                'A user account with this email already exists',
              );
            }
            linkedUser.email = dto.email;
            if (dto.name) linkedUser.name = dto.name;
            if (dto.phone) linkedUser.phone = dto.phone;
            await this.userRepo.save(linkedUser);
          }
        }
      } else if (teacher.user_id && (dto.name || dto.phone)) {
        // Sync name/phone updates to the linked User even when email hasn't changed
        const linkedUser = await this.userRepo.findOne({
          where: { id: teacher.user_id },
        });
        if (linkedUser) {
          if (dto.name) linkedUser.name = dto.name;
          if (dto.phone) linkedUser.phone = dto.phone;
          await this.userRepo.save(linkedUser);
        }
      }

      Object.assign(teacher, dto);
      const saved = await this.teacherRepo.save(teacher);
      return { success: true, message: 'Teacher updated', data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── TOGGLE STATUS ─────────────────────────────

  async toggleStatus(id: number) {
    try {
      const teacher = await this.teacherRepo.findOne({ where: { id } });
      if (!teacher) throw new NotFoundException('Teacher not found');

      teacher.status = teacher.status === 1 ? 0 : 1;
      const saved = await this.teacherRepo.save(teacher);
      const msg = saved.status === 1 ? 'Teacher activated' : 'Teacher deactivated';
      return { success: true, message: msg, data: saved };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  // ─────────────────────────────── REMOVE ────────────────────────────────────

  async remove(id: number) {
    try {
      const teacher = await this.teacherRepo.findOne({ where: { id } });
      if (!teacher) throw new NotFoundException('Teacher not found');

      await this.teacherRepo.remove(teacher);
      // Note: the linked User account is intentionally kept.
      // If you want cascading user deletion, handle that explicitly per business rules.
      return { success: true, message: 'Teacher deleted', data: {} };
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
