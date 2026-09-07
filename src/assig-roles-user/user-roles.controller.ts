import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRolesService } from './user-roles.service';
import { CreateUserRoleDto, UpdateUserRoleDto } from './dtos/user-role.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/roles-assigning-user')
@UseGuards(AdminJwtAuthGuard)
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-roles.create')
  create(@Body() dto: CreateUserRoleDto) {
    return this.userRolesService.create(dto);
  }

  @Get('list')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-roles.index')
  findAll() {
    return this.userRolesService.findAll();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-roles.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userRolesService.findOne(id);
  }

  @Patch('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-roles.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserRoleDto) {
    return this.userRolesService.update(id, dto);
  }

  @Get('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-roles.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.userRolesService.toggleStatus(id);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-roles.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userRolesService.remove(id);
  }
}
