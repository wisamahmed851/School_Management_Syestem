import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dtos/role.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/roles')
@UseGuards(AdminJwtAuthGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('roles.create')
  create(@Body() data: CreateRoleDto) {
    return this.rolesService.create(data);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('roles.index')
  index(@Query('guard') guard?: string) {
    console.log(guard);
    return this.rolesService.index(guard);
  }

  @Get('show/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('roles.findOne')
  show(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('roles.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateRoleDto) {
    return this.rolesService.update(data, id);
  }

  @Get('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('roles.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.toogleStatus(id);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('roles.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}
