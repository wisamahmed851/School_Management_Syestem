import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dtos/attendance.dto';
import { UserJwtAuthGuard } from 'src/auth/user/user-jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/users/entity/user.entity';

@Controller('user/teacher/attendance')
@UseGuards(UserJwtAuthGuard, RolesGuard)
@Roles('teacher')
export class TeacherAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * POST /user/teacher/attendance/mark
   * Mark attendance for the teacher's own class.
   * Ownership is verified inside the service:
   *   - Teacher must be linked to the calling User account.
   *   - Teacher must be the class_teacher_id for the requested class_id.
   */
  @Post('mark')
  mark(
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.markByTeacher(dto, user.id);
  }

  /**
   * GET /user/teacher/attendance/my-class
   * Returns the SchoolClass where this teacher is assigned as class teacher,
   * or a clear message if not yet assigned.
   */
  @Get('my-class')
  getMyClass(@CurrentUser() user: User) {
    return this.attendanceService.getMyClass(user.id);
  }

  /**
   * GET /user/teacher/attendance/class/:class_id?date=YYYY-MM-DD
   * View the attendance sheet for the teacher's own class on a given date.
   * Ownership is enforced — teacher must be class_teacher_id for this class.
   * Defaults to today if date query param is omitted.
   */
  @Get('class/:class_id')
  getByClass(
    @Param('class_id', ParseIntPipe) classId: number,
    @Query('date') date: string,
    @CurrentUser() user: User,
  ) {
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }
    return this.attendanceService.getByClassForTeacher(classId, date, user.id);
  }
}
