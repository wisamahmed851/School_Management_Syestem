import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentPortalController } from './parent-portal.controller';
import { ParentPortalService } from './parent-portal.service';
import { Guardian } from 'src/guardian/entity/guardian.entity';
import { Student } from 'src/student/entity/student.entity';
import { Attendance } from 'src/attendance/entity/attendance.entity';
import { AssignmentSubmission } from 'src/assignment/entity/assignment-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Guardian,
      Student,
      Attendance,
      AssignmentSubmission,
    ]),
  ],
  controllers: [ParentPortalController],
  providers: [ParentPortalService],
})
export class ParentPortalModule {}
