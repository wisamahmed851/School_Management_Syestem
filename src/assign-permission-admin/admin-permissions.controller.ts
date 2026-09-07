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
import { AdminPermissionsService } from './admin-permissions.service';
import { CreateAdminPermissionDto, UpdateAdminPermissionDto } from './dtos/admin-permission.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/permission-assigning-admin')
@UseGuards(AdminJwtAuthGuard)
export class AdminPermissionsController {
  constructor(private readonly adminPermissionsService: AdminPermissionsService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-permissions.create')
  create(@Body() dto: CreateAdminPermissionDto) {
    return this.adminPermissionsService.create(dto);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-permissions.index')
  findAll() {
    return this.adminPermissionsService.findAll();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-permissions.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminPermissionsService.findOne(id);
  }

  @Get('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-permissions.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.adminPermissionsService.toggleStatus(id);
  }

  @Patch('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-permissions.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminPermissionDto) {
    return this.adminPermissionsService.update(id, dto);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('admin-permissions.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminPermissionsService.remove(id);
  }
}
