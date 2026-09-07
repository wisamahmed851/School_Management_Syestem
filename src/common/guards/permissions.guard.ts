import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permissions.decorator';
import { EffectivePermissionsService } from '../services/permissions.service';

/**
 * Checks whether the authenticated admin has a required permission,
 * delegating the actual lookup to EffectivePermissionsService so the
 * same logic is shared with SidebarService.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly effectivePermissionsService: EffectivePermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission =
      this.reflector.get<string>(PERMISSION_KEY, context.getHandler()) ??
      this.reflector.get<string>(PERMISSION_KEY, context.getClass());

    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const admin = request.user;

    if (!admin?.id) {
      throw new ForbiddenException('Admin identity could not be resolved.');
    }

    const granted = await this.effectivePermissionsService.getEffectivePermissions(
      admin.id,
    );

    if (granted.includes(requiredPermission)) return true;

    throw new ForbiddenException(
      `Access denied. Required permission: '${requiredPermission}'.`,
    );
  }
}
