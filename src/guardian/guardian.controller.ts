import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { GuardianService } from './guardian.service';
import { CreateGuardianDto, UpdateGuardianDto } from './dtos/guardian.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/guardians')
@UseGuards(AdminJwtAuthGuard)
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('guardians.create')
  create(@Body() dto: CreateGuardianDto) {
    return this.guardianService.create(dto);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('guardians.index')
  findAll() {
    return this.guardianService.findAll();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('guardians.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.guardianService.findOne(id);
  }

  @Put('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('guardians.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGuardianDto) {
    return this.guardianService.update(id, dto);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('guardians.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.guardianService.remove(id);
  }
}
