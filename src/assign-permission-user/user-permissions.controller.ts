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
import { UserPermissionsService } from './user-permissions.service';
import { CreateUserPermissionDto, UpdateUserPermissionDto } from './dtos/user-permission.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/permission-assigning-user')
@UseGuards(AdminJwtAuthGuard)
export class UserPermissionsController {
  constructor(private readonly userPermissionsService: UserPermissionsService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-permissions.create')
  create(@Body() dto: CreateUserPermissionDto) {
    return this.userPermissionsService.create(dto);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-permissions.index')
  findAll() {
    return this.userPermissionsService.findAll();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-permissions.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userPermissionsService.findOne(id);
  }

  @Get('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-permissions.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.userPermissionsService.toggleStatus(id);
  }

  @Patch('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-permissions.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserPermissionDto) {
    return this.userPermissionsService.update(id, dto);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('user-permissions.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userPermissionsService.remove(id);
  }
}
