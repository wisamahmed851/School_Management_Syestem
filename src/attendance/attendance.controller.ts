import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, UpdateAttendanceDto } from './dtos/attendance.dto';
import { AdminJwtAuthGuard } from 'src/auth/admin/admin-jwt.guard';
import { CurrentAdmin } from 'src/common/decorators/current-user.decorator';
import { Admin } from 'src/admin/entity/admin.entity';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermission } from 'src/common/decorators/permissions.decorator';

@Controller('admin/attendance')
@UseGuards(AdminJwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('mark')
  @UseGuards(PermissionsGuard)
  @RequirePermission('attendance.mark')
  mark(@Body() dto: MarkAttendanceDto, @CurrentAdmin() admin: Admin) {
    return this.attendanceService.mark(dto, admin.id);
  }

  @Get('class/:class_id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('attendance.index')
  getByClass(
    @Param('class_id', ParseIntPipe) classId: number,
    @Query('date') date: string,
  ) {
    if (!date) date = new Date().toISOString().split('T')[0];
    return this.attendanceService.getByClass(classId, date);
  }

  @Get('student/:student_id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('attendance.index')
  getByStudent(@Param('student_id', ParseIntPipe) studentId: number) {
    return this.attendanceService.getByStudent(studentId);
  }

  @Put('update/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('attendance.update')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }
}
