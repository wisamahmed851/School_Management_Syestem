import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entity/student.entity';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { SchoolClass } from 'src/school-class/entity/school-class.entity';
import { Guardian } from 'src/guardian/entity/guardian.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, SchoolClass, Guardian])],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
