import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/users/entity/user.entity';
import { JwtAdmin, JwtUser } from '../interfaces/jwt-user.interface';
import { Admin } from 'src/admin/entity/admin.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser;
    return data ? user?.[data] : user;
  },
);

export const CurrentAdmin = createParamDecorator(
  (data: keyof Admin | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const admin = request.user as JwtAdmin;
    return data ? admin?.[data] : admin;
  },
);
