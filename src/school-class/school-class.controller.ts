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
import { SchoolClassService } from './school-class.service';
import { CreateSchoolClassDto, UpdateSchoolClassDto } from './dtos/school-class.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/classes')
@UseGuards(AdminJwtAuthGuard)
export class SchoolClassController {
  constructor(private readonly schoolClassService: SchoolClassService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('classes.create')
  create(@Body() dto: CreateSchoolClassDto) {
    return this.schoolClassService.create(dto);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('classes.index')
  findAll() {
    return this.schoolClassService.findAll();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('classes.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schoolClassService.findOne(id);
  }

  @Put('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('classes.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSchoolClassDto) {
    return this.schoolClassService.update(id, dto);
  }

  @Get('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('classes.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.schoolClassService.toggleStatus(id);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('classes.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schoolClassService.remove(id);
  }
}
