import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entity/attendance.entity';
import { AttendanceController } from './attendance.controller';
import { TeacherAttendanceController } from './teacher-attendance.controller';
import { AttendanceService } from './attendance.service';
import { Student } from 'src/student/entity/student.entity';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Admin } from 'src/admin/entity/admin.entity';
import { Teacher } from 'src/teacher/entity/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Student, SchoolClass, Admin, Teacher]),
  ],
  controllers: [AttendanceController, TeacherAttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule  {}
