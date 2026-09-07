import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check handler-level first, then fall back to class-level
    const requiredRoles =
      this.reflector.get<string[]>('roles', context.getHandler()) ??
      this.reflector.get<string[]>('roles', context.getClass());

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const userRoles: string[] = user.roles || [];

    const hasRole = userRoles.some(role => requiredRoles.includes(role));
    if (!hasRole) throw new ForbiddenException('Access denied');

    return true;
  }
}
