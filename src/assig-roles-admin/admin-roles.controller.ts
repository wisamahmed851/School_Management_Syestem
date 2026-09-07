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
import { AdminRolesService } from './admin-roles.service';
import { CreateAdminRoleDto, UpdateAdminRoleDto } from './dtos/admin-role.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/roles-assigning-admin')
@UseGuards(AdminJwtAuthGuard)
export class AdminRolesController {
  constructor(private readonly service: AdminRolesService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-roles.create')
  create(@Body() dto: CreateAdminRoleDto) {
    return this.service.create(dto);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-roles.index')
  findAll() {
    return this.service.findAll();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-roles.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-roles.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.service.toogleStatus(id);
  }

  @Patch('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-roles.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminRoleDto) {
    return this.service.update(id, dto);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-roles.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
