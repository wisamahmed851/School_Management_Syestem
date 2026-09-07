import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entity/user.entity';
import { Role } from 'src/roles/entity/roles.entity';
import { UserRole } from 'src/assig-roles-user/entity/user-role.entity';
import { UpdateProfileDto, UserRegisterDto } from './dtos/user-auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserAuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    private jwtService: JwtService,

    @InjectRepository(Role)
    private roleRepo: Repository<Role>,

    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,

    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private handleUnknown(err: unknown): never {
    if (
      err instanceof BadRequestException ||
      err instanceof NotFoundException ||
      err instanceof UnauthorizedException
    ) {
      throw err;
    }
    throw new InternalServerErrorException('Unexpected error occurred', {
      cause: err as Error,
    });
  }

  async register(body: UserRegisterDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(User, {
        where: { email: body.email },
      });
      if (existing) {
        throw new BadRequestException('User with this email already exists');
      }

      if (body.password) {
        body.password = await bcrypt.hash(body.password, 10);
      }

      const user = queryRunner.manager.getRepository(User).create({
        name: body.name,
        email: body.email,
        password: body.password,
        phone: body.phone,
      });
      const savedUser = await queryRunner.manager.save(User, user);

      // Always assign the default 'user' role — never trust a role from the client.
      // Elevated roles must be assigned afterward via admin-only endpoints.
      const defaultRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'user', guard: 'user' },
        select: { id: true, name: true },
      });
      if (!defaultRole) {
        throw new InternalServerErrorException(
          "Default role 'user' not found. Ensure the roles seeder has run.",
        );
      }

      const userRole = queryRunner.manager.getRepository(UserRole).create({
        user_id: savedUser.id,
        user: savedUser,
        role_id: defaultRole.id,
        role: defaultRole,
      });
      await queryRunner.manager.save(UserRole, userRole);

      await queryRunner.commitTransaction();

      const { password, ...userWithoutPassword } = savedUser;
      return {
        success: true,
        message: 'User registered successfully',
        data: { user: userWithoutPassword, role: defaultRole },
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

  async validateUser(email: string, password: string) {
    try {
      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase().trim() },
      });
      if (!user) throw new BadRequestException('Invalid credentials');

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new BadRequestException('Invalid credentials');

      return user;
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  async login(user: User) {
    try {
      const roles = await this.userRoleRepo.find({
        where: { user_id: user.id },
        relations: ['role'],
        select: { role: { id: true, name: true } },
      });
      const roleNames = roles.map((r) => r.role.name);
      const payload = { sub: user.id, email: user.email, roles: roleNames };

      const token = this.jwtService.sign(payload, { expiresIn: '30m' });
      const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
      user.access_token = token;
      user.refresh_token = refresh_token;
      await this.userRepository.save(user);

      const { password, access_token, ...cleanUser } = user;
      return {
        success: true,
        message: 'Logged in successfully',
        data: {
          access_token: token,
          refresh_token,
          user: cleanUser,
          role: roles[0]?.role ?? null,
        },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  async refreshToken(refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { refresh_token: refreshToken },
    });
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    try {
      this.jwtService.verify(refreshToken, { secret: 'user-secret-key' });
      const roles = await this.userRoleRepo.find({
        where: { user_id: user.id },
        relations: ['role'],
      });
      const roleNames = roles.map((r) => r.role.name);
      const newAccessToken = this.jwtService.sign(
        { sub: user.id, email: user.email, roles: roleNames },
        { expiresIn: '30m' },
      );
      user.access_token = newAccessToken;
      await this.userRepository.save(user);

      const { password, access_token, refresh_token, ...cleanUser } = user;
      return {
        success: true,
        message: 'Token refreshed successfully',
        data: { access_token: newAccessToken, user: cleanUser },
      };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  async profile(user: User) {
    try {
      const found = await this.userRepository.findOne({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          image: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });
      if (!found) throw new NotFoundException('User not found');
      return { success: true, message: 'Profile fetched', data: found };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  async profileUpdate(user: User, body: UpdateProfileDto) {
    try {
      const exist = await this.userRepository.findOne({ where: { id: user.id } });
      if (!exist) throw new NotFoundException('User not found');

      if (body.name !== undefined) exist.name = body.name;
      if (body.phone !== undefined) exist.phone = body.phone;
      if (body.address !== undefined) exist.address = body.address;
      if (body.image !== undefined) exist.image = body.image;

      const saved = await this.userRepository.save(exist);
      const { password, access_token, refresh_token, ...clean } = saved;
      return { success: true, message: 'Profile updated successfully', data: clean };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  async changePassword(body: { oldPassword: string; newPassword: string }, user: User) {
    try {
      const found = await this.userRepository.findOne({ where: { id: user.id } });
      if (!found) throw new NotFoundException('User not found');

      const matched = await bcrypt.compare(body.oldPassword, found.password);
      if (!matched) throw new BadRequestException('Old password is incorrect');

      if (body.newPassword.trim().length < 6) {
        throw new BadRequestException('New password must be at least 6 characters');
      }

      found.password = await bcrypt.hash(body.newPassword.trim(), 10);
      await this.userRepository.save(found);
      return { success: true, message: 'Password updated successfully', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }

  async logout(data: User) {
    try {
      const user = await this.userRepository.findOne({ where: { id: data.id } });
      if (!user) throw new NotFoundException('User not found');
      user.access_token = '';
      await this.userRepository.save(user);
      return { success: true, message: 'Logged out successfully', data: {} };
    } catch (err) {
      this.handleUnknown(err);
    }
  }
}
