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
import { StudentService } from './student.service';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/students')
@UseGuards(AdminJwtAuthGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post('store')
  @UseGuards(PermissionsGuard)
  @RequirePermission('students.create')
  create(@Body() dto: CreateStudentDto) {
    return this.studentService.create(dto);
  }

  @Get('index')
  @UseGuards(PermissionsGuard)
  @RequirePermission('students.index')
  findAll() {
    return this.studentService.findAll();
  }

  @Get('findOne/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('students.findOne')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.findOne(id);
  }

  @Put('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('students.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.studentService.update(id, dto);
  }

  @Get('toggleStatus/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('students.toggleStatus')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.toggleStatus(id);
  }

  @Delete('remove/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('students.remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.remove(id);
  }
}
