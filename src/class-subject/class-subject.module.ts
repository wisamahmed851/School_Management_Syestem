import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassSubjectTeacher } from './entity/class-subject-teacher.entity';
import { ClassSubjectController } from './class-subject.controller';
import { ClassSubjectService } from './class-subject.service';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Subject } from 'src/subject/entity/subject.entity';
import { Teacher } from 'src/teacher/entity/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassSubjectTeacher, SchoolClass, Subject, Teacher]),
  ],
  controllers: [ClassSubjectController],
  providers: [ClassSubjectService],
  exports: [ClassSubjectService],
})
export class ClassSubjectModule {}
