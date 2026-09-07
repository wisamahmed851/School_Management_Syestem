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
import { ClassSubjectService } from './class-subject.service';
import { CreateClassSubjectDto, UpdateClassSubjectDto } from './dtos/class-subject.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/class-subjects')
@UseGuards(AdminJwtAuthGuard)
export class ClassSubjectController {
  constructor(private readonly classSubjectService: ClassSubjectService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('class-subjects.create')
  create(@Body() dto: CreateClassSubjectDto) {
    return this.classSubjectService.create(dto);
  }

  @Get('class/:class_id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('class-subjects.index')
  findByClass(@Param('class_id', ParseIntPipe) classId: number) {
    return this.classSubjectService.findByClass(classId);
  }

  @Get('teacher/:teacher_id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('class-subjects.index')
  findByTeacher(@Param('teacher_id', ParseIntPipe) teacherId: number) {
    return this.classSubjectService.findByTeacher(teacherId);
  }

  @Put('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('class-subjects.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClassSubjectDto) {
    return this.classSubjectService.update(id, dto);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('class-subjects.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.classSubjectService.remove(id);
  }
}
