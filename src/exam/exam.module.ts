import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entity/exam.entity';
import { ExamResult } from './entity/exam-result.entity';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Student } from 'src/student/entity/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamResult, SchoolClass, Subject, Student]),
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
