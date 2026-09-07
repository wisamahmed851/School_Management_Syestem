import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import {
  CreateRolePermissionAssigningDto,
  UpdateRolePermissionAssigningDto,
} from './dto/role-permission.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/role-permissions')
@UseGuards(AdminJwtAuthGuard)
export class RolePermissionsController {
  constructor(private readonly service: RolePermissionsService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('role-permissions.create')
  create(@Body() dto: CreateRolePermissionAssigningDto) {
    return this.service.create(dto);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('role-permissions.index')
  findAll() {
    return this.service.findAll();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('role-permissions.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('role-permissions.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.service.toogleStatus(id);
  }

  @Patch('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('role-permissions.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRolePermissionAssigningDto) {
    return this.service.update(id, dto);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('role-permissions.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
