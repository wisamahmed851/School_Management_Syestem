import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entity/assignment.entity';
import { AssignmentSubmission } from './entity/assignment-submission.entity';
import { AssignmentController } from './assignment.controller';
import { TeacherAssignmentController } from './teacher-assignment.controller';
import { AssignmentService } from './assignment.service';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Student } from 'src/student/entity/student.entity';
import { Teacher } from 'src/teacher/entity/teacher.entity';

import { ClassSubjectTeacher } from 'src/class-subject/entity/class-subject-teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      AssignmentSubmission,
      SchoolClass,
      Student,
      Teacher,
      ClassSubjectTeacher,
    ]),
  ],
  controllers: [AssignmentController, TeacherAssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
